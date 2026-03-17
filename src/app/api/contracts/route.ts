
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contracts, clients, quotations } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
  }

  const data = await db
    .select({
      id: contracts.id,
      contractNumber: contracts.contractNumber,
      quotationNumber: quotations.quotationNumber,
      quotationId: contracts.quotationId,
      clientName: clients.name,
      status: contracts.status,
      createdAt: contracts.createdAt
    })
    .from(contracts)
    .innerJoin(quotations, eq(contracts.quotationId, quotations.id))
    .innerJoin(clients, eq(quotations.clientId, clients.id))
    .where(and(eq(contracts.tenantId, user.tenantId), eq(contracts.isDeleted, 0)))
    .orderBy(desc(contracts.createdAt));

  return NextResponse.json({ data });
}
