import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const allUsers = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        companyName: tenants.companyName,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(limit)
      .all();

    return NextResponse.json({ data: allUsers });
  } catch (err) {
    console.error("Superadmin users list error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAuthUser();
    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { name, email, password, role, tenantId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: { message: "Nombre, email y contraseña son requeridos" } }, { status: 400 });
    }

    // Check if email exists
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: { message: "El correo ya está registrado" } }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const now = new Date().toISOString();
    db.insert(users).values({
      id,
      name,
      email,
      passwordHash: hashedPassword,
      role: role || "user",
      tenantId: tenantId || null,
      createdAt: now,
      updatedAt: now,
    }).run();

    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    console.error("Superadmin user create error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
