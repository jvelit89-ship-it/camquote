
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, receipts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params; // contractId

  const data = db.select().from(receipts)
    .where(and(eq(receipts.contractId, id), eq(receipts.tenantId, user.tenantId)))
    .orderBy(desc(receipts.createdAt))
    .all();

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount, concept, date } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: { message: "Monto inválido" } }, { status: 400 });
  }

  const contract = db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.tenantId, user.tenantId))).get();
  if (!contract) {
    return NextResponse.json({ error: { message: "Contrato no encontrado" } }, { status: 404 });
  }

  const receiptId = crypto.randomUUID();
  const receiptNumber = `REC-${contract.contractNumber.split('-')[1]}-${Math.floor(Math.random() * 900) + 100}`;

  const newReceipt = {
    id: receiptId,
    tenantId: user.tenantId,
    contractId: id,
    receiptNumber,
    amount: Number(amount),
    concept: concept || "Pago",
    date: date || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.insert(receipts).values(newReceipt).run();

  return NextResponse.json({ data: newReceipt });
}
