import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { companySettingsSchema } from "@/lib/validations";

import { getAuthUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const settings = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();
  if (!settings) {
    // Crear registro por defecto si no existe para este tenant
    db.insert(companySettings).values({
      id: uuid(),
      tenantId: user.tenantId,
      name: "Mi Empresa",
      igvRate: 0.18,
      updatedAt: new Date().toISOString(),
    }).run();
    const created = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();
    return NextResponse.json({ data: created });
  }
  return NextResponse.json({ data: settings });
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    const body = await req.json();
    const parsed = companySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const settings = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();

    if (settings) {
      db.update(companySettings).set({
        ...parsed.data,
        logo: body.logo,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        igvRate: body.igvRate,
        updatedAt: new Date().toISOString(),
      }).where(eq(companySettings.tenantId, user.tenantId)).run();
    } else {
      db.insert(companySettings).values({
        id: uuid(),
        tenantId: user.tenantId,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      }).run();
    }

    const updated = db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId)).get();
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
