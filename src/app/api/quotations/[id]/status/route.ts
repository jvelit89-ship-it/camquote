import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["draft", "sent", "approved", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Estado inválido" } }, { status: 400 });
  }

  db.update(quotations).set({ status, updatedAt: new Date().toISOString() }).where(and(eq(quotations.id, id), eq(quotations.tenantId, user.tenantId))).run();
  return NextResponse.json({ success: true });
}
