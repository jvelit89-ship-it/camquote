import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, or, like, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { clientSchema } from "@/lib/validations";

import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const city = url.searchParams.get("city") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const all = url.searchParams.get("all") === "true";
  const offset = (page - 1) * limit;

  const conditions = [
    eq(clients.isDeleted, 0),
    eq(clients.tenantId, user.tenantId)
  ];

  if (search) {
    conditions.push(
      or(
        like(clients.name, `%${search}%`),
        like(clients.company, `%${search}%`),
        like(clients.documentNumber, `%${search}%`),
        like(clients.email, `%${search}%`)
      )!
    );
  }

  if (city) {
    conditions.push(like(clients.city, `%${city}%`));
  }

  const whereClause = and(...conditions);

  if (all) {
    const data = await db.select().from(clients).where(whereClause).orderBy(sql`${clients.name} ASC`);
    return NextResponse.json({ data });
  }

  const data = await db.select().from(clients).where(whereClause).orderBy(sql`${clients.createdAt} DESC`).limit(limit).offset(offset);
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(clients).where(whereClause);
  const total = totalResult[0];

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

    const body = await req.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const now = new Date();
    const id = uuid();

    await db.insert(clients).values({
      id,
      tenantId: user.tenantId,
      ...parsed.data,
      isDeleted: 0,
      createdAt: now,
      updatedAt: now,
    } as any);

    const createdResult = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.tenantId, user.tenantId)));
    return NextResponse.json({ data: createdResult[0] }, { status: 201 });
  } catch (err) {
    console.error("Create client error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
