import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { productSchema } from "@/lib/validations";

import { getAuthUser } from "@/lib/auth";
import { and } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  const product = db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId))).get();

  if (!product || product.isDeleted === 1) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Producto no encontrado" } }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    db.update(products).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId))).run();
    const updated = db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId))).get();
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });
  }

  const { id } = await params;
  db.update(products).set({ isDeleted: 1, updatedAt: new Date().toISOString() }).where(and(eq(products.id, id), eq(products.tenantId, user.tenantId))).run();
  return NextResponse.json({ success: true });
}
