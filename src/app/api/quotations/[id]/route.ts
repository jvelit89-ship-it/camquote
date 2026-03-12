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
  const quotation = db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).get();

  if (!quotation || quotation.isDeleted === 1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Cotización no encontrada" } }, { status: 404 });
  }

  const items = db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).orderBy(quotationItems.sortOrder).all();
  const client = db.select().from(clients).where(and(eq(clients.id, quotation.clientId), eq(clients.tenantId, user.tenantId))).get();
  const settings = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();

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
    const now = new Date().toISOString();

    const settings = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();
    const igvRate = settings?.igvRate ?? 0.18;

    const subtotal = roundTwo(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const igvAmount = roundTwo(subtotal * igvRate);
    const total = roundTwo(subtotal + igvAmount);

    db.update(quotations).set({
      clientId,
      subtotal,
      igvAmount,
      total,
      notes: notes || "",
      terms: terms || "",
      updatedAt: now,
    }).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).run();

    // Reemplazar items: eliminar existentes e insertar nuevos
    db.delete(quotationItems).where(eq(quotationItems.quotationId, id)).run();

    items.forEach((item, index) => {
      db.insert(quotationItems).values({
        id: uuid(),
        quotationId: id,
        productId: item.productId || null,
        productName: item.productName,
        productUnit: item.productUnit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: roundTwo(item.quantity * item.unitPrice),
        sortOrder: index,
      }).run();
    });

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
  db.update(quotations).set({ isDeleted: 1, updatedAt: new Date().toISOString() }).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).run();
  return NextResponse.json({ success: true });
}
