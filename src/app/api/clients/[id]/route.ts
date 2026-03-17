import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, quotations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { clientSchema } from "@/lib/validations";

import { getAuthUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const clientResult = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId), eq(clients.isDeleted, 0)));
  const client = clientResult[0];

  if (!client) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Cliente no encontrado" } }, { status: 404 });
  }

  return NextResponse.json({ data: client });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    await db.update(clients).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId)));
    const updatedResult = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId)));

    return NextResponse.json({ data: updatedResult[0] });
  } catch (err) {
    console.error("Update client error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;

  // Verificar si tiene cotizaciones activas
  const hasQuotationsResult = await db.select({ count: sql<number>`count(*)` }).from(quotations).where(and(eq(quotations.clientId, id), eq(quotations.tenantId, user.tenantId), eq(quotations.isDeleted, 0)));
  const hasQuotations = hasQuotationsResult[0];

  if (hasQuotations && hasQuotations.count > 0) {
    // Soft delete si tiene cotizaciones
    await db.update(clients).set({ isDeleted: 1, updatedAt: new Date() }).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId)));
  } else {
    await db.delete(clients).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId)));
  }

  return NextResponse.json({ success: true });
}
