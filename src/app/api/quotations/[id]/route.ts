import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { quotationSchema } from "@/lib/validations";
import { getAuthUser } from "@/lib/auth";
import { and } from "drizzle-orm";
import { roundTwo } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const quotationResult = await db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId)));
  const quotation = quotationResult[0];

  if (!quotation || quotation.isDeleted === 1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Cotización no encontrada" } }, { status: 404 });
  }

  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(quotationItems.sortOrder);
  const clientResult = await db.select().from(clients).where(and(eq(clients.id, quotation.clientId), eq(clients.tenantId, user.tenantId)));
  const client = clientResult[0];
  const settingsResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
  const settings = settingsResult[0];

  return NextResponse.json({ data: { ...quotation, items, client, company: settings } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { clientId, notes, terms, items } = parsed.data;
    const now = new Date();

    const settingsResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    const settings = settingsResult[0];
    const igvRate = settings?.igvRate ?? 0.18;

    const subtotal = roundTwo(items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0));
    const igvAmount = roundTwo(subtotal * igvRate);
    const total = roundTwo(subtotal + igvAmount);

    await db.update(quotations).set({
      clientId,
      subtotal,
      igvAmount,
      total,
      notes: notes || "",
      terms: terms || "",
      updatedAt: now,
    }).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId)));

    // Reemplazar items: eliminar existentes e insertar nuevos
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await db.insert(quotationItems).values({
        id: uuid(),
        quotationId: id,
        productId: (item as any).productId || null,
        productName: (item as any).productName,
        productUnit: (item as any).productUnit,
        quantity: (item as any).quantity,
        unitPrice: (item as any).unitPrice,
        subtotal: roundTwo((item as any).quantity * (item as any).unitPrice),
        sortOrder: index,
      } as any);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update quotation error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  await db.update(quotations).set({ isDeleted: 1, updatedAt: new Date() }).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId)));
  return NextResponse.json({ success: true });
}
