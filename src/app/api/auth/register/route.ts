import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, tenants, companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { v4 as uuid } from "uuid";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  companyName: z.string().min(1, "El nombre de la empresa es obligatorio"),
  ruc: z.string().min(8, "RUC inválido").max(11, "RUC demasiado largo"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, ruc } = parsed.data;

    // 1. Verificar si el correo ya existe
    const existingUserResult = await db.select().from(users).where(eq(users.email, email));
    if (existingUserResult[0]) {
      return NextResponse.json(
        { error: { code: "EMAIL_EXISTS", message: "El correo electrónico ya está registrado" } },
        { status: 409 }
      );
    }

    // 2. Verificar si la empresa ya existe
    const existingTenantResult = await db.select().from(tenants).where(eq(tenants.companyName, companyName));
    if (existingTenantResult[0]) {
      return NextResponse.json(
        { error: { code: "COMPANY_EXISTS", message: "Este nombre de empresa ya se encuentra registrado" } },
        { status: 409 }
      );
    }

    // 3. Verificar si el RUC ya existe
    const existingRucResult = await db.select().from(companySettings).where(eq(companySettings.ruc, ruc));
    if (existingRucResult[0]) {
      return NextResponse.json(
        { error: { code: "RUC_EXISTS", message: "Este RUC ya se encuentra registrado por otra empresa" } },
        { status: 409 }
      );
    }

    const tenantId = uuid();
    const userId = uuid();
    const now = new Date();

    await db.transaction(async (tx: any) => {
      // 1. Crear el Tenant
      await tx.insert(tenants).values({
        id: tenantId,
        companyName: companyName,
        ownerUserId: userId,
        planId: "free",
        status: "active",
        createdAt: now,
        updatedAt: now,
      } as any);

      // 2. Crear el Usuario Admin asociado al Tenant
      await tx.insert(users).values({
        id: userId,
        tenantId: tenantId,
        email,
        passwordHash: hashSync(password, 10),
        name,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      } as any);

      // 3. Crear configuraciones base para la empresa
      await tx.insert(companySettings).values({
        id: uuid(),
        tenantId: tenantId,
        name: companyName,
        ruc: ruc,
        igvRate: 0.18,
        primaryColor: "#2563eb", // blue-600
        secondaryColor: "#475569", // slate-600
        updatedAt: now,
      } as any);
    });

    return NextResponse.json({ success: true, message: "Cuenta creada exitosamente" }, { status: 201 });

  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } },
      { status: 500 }
    );
  }
}
