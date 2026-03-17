import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compareSync } from "bcryptjs";
import { setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !compareSync(password, user.passwordHash)) {
      return NextResponse.json(
        { error: { code: "AUTH_FAILED", message: "Credenciales incorrectas" } },
        { status: 401 }
      );
    }

    await setAuthCookie({ 
      userId: user.id, 
      tenantId: user.tenantId, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        tenantId: user.tenantId,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } },
      { status: 500 }
    );
  }
}
