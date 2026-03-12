import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, planId } = body;

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (status) {
      const validStatuses = ["active", "suspended", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: { message: "Estado inválido" } }, { status: 400 });
      }
      updateData.status = status;
    }

    if (planId) {
      updateData.planId = planId;
    }

    db.update(tenants).set(updateData).where(eq(tenants.id, id)).run();

    return NextResponse.json({ success: true, message: "Tenant actualizado" });
  } catch (err: any) {
    console.error("Tenant status update error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { id } = await params;

    // Hard delete - Use con precaución
    db.delete(tenants).where(eq(tenants.id, id)).run();

    return NextResponse.json({ success: true, message: "Tenant eliminado" });
  } catch (err: any) {
    console.error("Tenant deletion error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}
