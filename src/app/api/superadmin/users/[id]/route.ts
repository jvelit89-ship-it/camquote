import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Acceso denegado" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { name, email, role, tenantId } = await req.json();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (tenantId !== undefined) updateData.tenantId = tenantId;

    db.update(users).set(updateData).where(eq(users.id, id)).run();

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado con éxito",
    });
  } catch (err: any) {
    console.error("User update error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Acceso denegado" } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === adminUser.userId) {
      return NextResponse.json(
        { error: { message: "No puedes eliminar tu propia cuenta de superadministrador" } },
        { status: 400 }
      );
    }

    db.delete(users).where(eq(users.id, id)).run();

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado con éxito",
    });
  } catch (err: any) {
    console.error("User delete error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } },
      { status: 500 }
    );
  }
}
