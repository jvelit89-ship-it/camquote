import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, price, maxUsers, maxProducts, maxQuotations, features } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (maxUsers !== undefined) updateData.maxUsers = Number(maxUsers);
    if (maxProducts !== undefined) updateData.maxProducts = Number(maxProducts);
    if (maxQuotations !== undefined) updateData.maxQuotations = Number(maxQuotations);
    if (features !== undefined) updateData.features = JSON.stringify(features);

    await db.update(plans).set(updateData).where(eq(plans.id, id));

    return NextResponse.json({ success: true, message: "Plan actualizado correctamente" });
  } catch (err: any) {
    console.error("Plan update error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: err.message || "Error interno" } }, { status: 500 });
  }
}
