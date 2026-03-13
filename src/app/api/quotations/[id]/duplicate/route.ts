import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getAuthUser } from "@/lib/auth";
import { generateQuotationNumber } from "@/lib/utils";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const original = db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).get();

  if (!original) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Cotización no encontrada" } }, { status: 404 });
  }

  const now = new Date().toISOString();
  const newId = uuid();
  const newNumber = generateQuotationNumber();

  // Duplicar cotización
  db.insert(quotations).values({
    id: newId,
    tenantId: user.tenantId,
    quotationNumber: newNumber,
    clientId: original.clientId,
    userId: user.userId,
    status: "draft",
    subtotal: original.subtotal,
    igvAmount: original.igvAmount,
    total: original.total,
    notes: original.notes,
    terms: original.terms,
    isDeleted: 0,
    createdAt: now,
    updatedAt: now,
  }).run();

  // Duplicar items
  const items = db.select().from(quotationItems).where(eq(quotationItems.quotationId, id)).all();
  items.forEach((item: any) => {
    db.insert(quotationItems).values({
      ...item,
      id: uuid(),
      quotationId: newId,
    }).run();
  });

  return NextResponse.json({ data: { id: newId, quotationNumber: newNumber } }, { status: 201 });
}
