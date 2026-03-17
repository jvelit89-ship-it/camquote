import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser, setAuthCookie } from "@/lib/auth";

export async function POST(
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

    const [userToImpersonate] = await db.select().from(users).where(eq(users.id, id));

    if (!userToImpersonate) {
      return NextResponse.json(
        { error: { message: "Usuario no encontrado" } },
        { status: 404 }
      );
    }

    // Set auth cookie as the target user
    await setAuthCookie({
      userId: userToImpersonate.id,
      tenantId: userToImpersonate.tenantId,
      email: userToImpersonate.email,
      name: userToImpersonate.name,
      role: userToImpersonate.role,
    });

    return NextResponse.json({
      success: true,
      message: `Iniciando sesión como ${userToImpersonate.name}`,
    });
  } catch (err: any) {
    console.error("Impersonation error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } },
      { status: 500 }
    );
  }
}
