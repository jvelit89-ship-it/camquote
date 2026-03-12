import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const allPlans = db.select().from(plans).orderBy(desc(plans.price)).all();

    return NextResponse.json(
      { data: allPlans },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    console.error("Superadmin plans list error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
       return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, price, maxUsers, maxProducts, maxQuotations, features } = body;

    if (!id || !name) {
      return NextResponse.json({ error: { message: "ID y Nombre son requeridos" } }, { status: 400 });
    }

    db.insert(plans).values({
      id,
      name,
      price: Number(price) || 0,
      maxUsers: Number(maxUsers) || 1,
      maxProducts: Number(maxProducts) || 20,
      maxQuotations: Number(maxQuotations) || 10,
      features: features ? JSON.stringify(features) : null,
      updatedAt: new Date().toISOString(),
    }).run();

    return NextResponse.json({ success: true, message: "Plan creado exitosamente" });
  } catch (err: any) {
    console.error("Plan creation error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}
