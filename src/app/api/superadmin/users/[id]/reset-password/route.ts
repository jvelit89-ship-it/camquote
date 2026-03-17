import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: { message: "La contraseña debe tener al menos 6 caracteres" } }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true, message: "Contraseña restablecida con éxito" });
  } catch (err: any) {
    console.error("Password reset error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}
