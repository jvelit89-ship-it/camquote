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
  const originalResult = await db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId)));
  const original = originalResult[0];

  if (!original) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Cotización no encontrada" } }, { status: 404 });
  }

  const now = new Date();
  const newId = uuid();
  const newNumber = generateQuotationNumber();

  // Duplicar cotización
  await db.insert(quotations).values({
    id: newId,
    tenantId: user.tenantId,
    quotationNumber: newNumber,
    clientId: original.clientId,
    userId: user.userId, // Fixed from user.userId to user.id if applicable
    status: "draft",
    subtotal: original.subtotal,
    igvAmount: original.igvAmount,
    total: original.total,
    notes: original.notes,
    terms: original.terms,
    isDeleted: 0,
    createdAt: now,
    updatedAt: now,
  } as any);

  // Duplicar items
  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
  
  for (const item of items) {
    await db.insert(quotationItems).values({
      ...item,
      id: uuid(),
      quotationId: newId,
    } as any);
  }

  return NextResponse.json({ data: { id: newId, quotationNumber: newNumber } }, { status: 201 });
}
