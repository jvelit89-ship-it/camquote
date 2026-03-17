import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems, clients, companySettings } from "@/db/schema";
import { eq, and, or, like, sql, gte, lte } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { quotationSchema } from "@/lib/validations";
import { getAuthUser } from "@/lib/auth";
import { generateQuotationNumber, roundTwo } from "@/lib/utils";

import { checkQuotationLimit } from "@/lib/limits";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const conditions = [
    eq(quotations.isDeleted, 0),
    eq(quotations.tenantId, user.tenantId)
  ];

  if (search) {
    conditions.push(
      or(
        like(quotations.quotationNumber, `%${search}%`),
        like(clients.name, `%${search}%`)
      )!
    );
  }

  if (status) conditions.push(eq(quotations.status, status));
  if (dateFrom) conditions.push(gte(quotations.createdAt, dateFrom as any));
  if (dateTo) conditions.push(lte(quotations.createdAt, (dateTo + "T23:59:59Z") as any));

  const whereClause = and(...conditions);

  const data = await db
    .select({
      id: quotations.id,
      quotationNumber: quotations.quotationNumber,
      clientId: quotations.clientId,
      clientName: clients.name,
      clientCompany: clients.company,
      status: quotations.status,
      subtotal: quotations.subtotal,
      igvAmount: quotations.igvAmount,
      total: quotations.total,
      notes: quotations.notes,
      terms: quotations.terms,
      createdAt: quotations.createdAt,
      updatedAt: quotations.updatedAt,
    })
    .from(quotations)
    .leftJoin(clients, eq(quotations.clientId, clients.id))
    .where(whereClause)
    .orderBy(sql`${quotations.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotations)
    .leftJoin(clients, eq(quotations.clientId, clients.id))
    .where(whereClause);
  const total = totalResult[0];

  return NextResponse.json({
    data,
    pagination: { page, limit, total: total?.count || 0, totalPages: Math.ceil((total?.count || 0) / limit) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    // Verificar límite mensual de cotizaciones
    const canCreate = await checkQuotationLimit(user.tenantId);
    if (!canCreate) {
      return NextResponse.json({ 
        error: { message: "Has alcanzado el límite de cotizaciones mensuales de tu plan. Tu cuota se reiniciará el próximo mes o puedes subir de plan ahora." } 
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { clientId, notes, terms, items } = parsed.data;
    const quotationId = uuid();
    const quotationNumber = generateQuotationNumber();

    // Obtener tasa de IGV
    const settingsResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    const settings = settingsResult[0];
    const igvRate = settings?.igvRate ?? 0.18;

    // Calcular totales
    const subtotal = roundTwo(items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0));
    const igvAmount = roundTwo(subtotal * igvRate);
    const total = roundTwo(subtotal + igvAmount);

    // Insertar cotización
    await db.insert(quotations).values({
      id: quotationId,
      tenantId: user.tenantId,
      quotationNumber,
      clientId,
      userId: user.userId,
      status: "draft",
      subtotal,
      igvAmount,
      total,
      notes: notes || "",
      terms: terms || "",
      isDeleted: 0,
    } as any);

    // Insertar items
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      await db.insert(quotationItems).values({
        id: uuid(),
        quotationId,
        productId: (item as any).productId || null,
        productName: (item as any).productName,
        productUnit: (item as any).productUnit,
        quantity: (item as any).quantity,
        unitPrice: (item as any).unitPrice,
        subtotal: roundTwo((item as any).quantity * (item as any).unitPrice),
        sortOrder: index,
      } as any);
    }

    return NextResponse.json({ data: { id: quotationId, quotationNumber } }, { status: 201 });
  } catch (err) {
    console.error("Create quotation error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
