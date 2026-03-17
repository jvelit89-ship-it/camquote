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

  const settingsResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
  const settings = settingsResult[0];
  if (!settings) {
    // Crear registro por defecto si no existe para este tenant
    await db.insert(companySettings).values({
      id: uuid(),
      tenantId: user.tenantId,
      name: "Mi Empresa",
      igvRate: 0.18,
      updatedAt: new Date(),
    } as any);
    const createdResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    return NextResponse.json({ data: createdResult[0] });
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

    const settingsResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    const settings = settingsResult[0];

    if (settings) {
      await db.update(companySettings).set({
        ...parsed.data,
        logo: body.logo,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        igvRate: body.igvRate,
        updatedAt: new Date(),
      }).where(eq(companySettings.tenantId, user.tenantId));
    } else {
      await db.insert(companySettings).values({
        id: uuid(),
        tenantId: user.tenantId,
        ...parsed.data,
        updatedAt: new Date(),
      } as any);
    }

    const updatedResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    return NextResponse.json({ data: updatedResult[0] });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
