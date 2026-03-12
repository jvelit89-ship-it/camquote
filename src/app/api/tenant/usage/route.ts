import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, quotations } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { getTenantLimits } from "@/lib/limits";
import { eq, count, and, gte } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    const limits = await getTenantLimits(user.tenantId);

    // 1. Contar Usuarios
    const usersCount = db.select({ value: count() }).from(users).where(eq(users.tenantId, user.tenantId)).get();

    // 2. Contar Productos (activos)
    const productsCount = db.select({ value: count() }).from(products).where(
      and(eq(products.tenantId, user.tenantId), eq(products.isDeleted, 0))
    ).get();

    // 3. Contar Cotizaciones (mes actual)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const quotationsCount = db.select({ value: count() }).from(quotations).where(
      and(
        eq(quotations.tenantId, user.tenantId), 
        eq(quotations.isDeleted, 0),
        gte(quotations.createdAt, startOfMonth.toISOString())
      )
    ).get();

    return NextResponse.json({
      data: {
        users: { current: usersCount?.value || 0, limit: limits.maxUsers },
        products: { current: productsCount?.value || 0, limit: limits.maxProducts },
        quotations: { current: quotationsCount?.value || 0, limit: limits.maxQuotations },
      }
    });
  } catch (err: any) {
    console.error("Usage API error:", err);
    return NextResponse.json({ error: { message: "Error al obtener uso" } }, { status: 500 });
  }
}
