import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, or, like, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { productSchema } from "@/lib/validations";

import { getAuthUser } from "@/lib/auth";

import { checkProductLimit } from "@/lib/limits";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const all = url.searchParams.get("all") === "true";
  const offset = (page - 1) * limit;

  const conditions = [
    eq(products.isDeleted, 0),
    eq(products.tenantId, user.tenantId)
  ];

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.description, `%${search}%`)
      )!
    );
  }

  if (category) {
    conditions.push(eq(products.category, category));
  }

  const whereClause = and(...conditions);

  if (all) {
    const data = db.select().from(products).where(whereClause).orderBy(sql`${products.name} ASC`).all();
    return NextResponse.json({ data });
  }

  const data = db.select().from(products).where(whereClause).orderBy(sql`${products.createdAt} DESC`).limit(limit).offset(offset).all();
  const total = db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause).get();

  return NextResponse.json({
    data,
    pagination: { page, limit, total: total?.count || 0, totalPages: Math.ceil((total?.count || 0) / limit) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    // Verificar límite de plan
    const canAdd = await checkProductLimit(user.tenantId);
    if (!canAdd) {
      return NextResponse.json({
        error: { message: "Has alcanzado el límite de productos de tu plan actual. Por favor, actualiza tu suscripción." }
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = uuid();

    db.insert(products).values({
      id,
      tenantId: user.tenantId,
      ...parsed.data,
      isDeleted: 0,
      createdAt: now,
      updatedAt: now,
    }).run();

    const created = db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId))).get();
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
