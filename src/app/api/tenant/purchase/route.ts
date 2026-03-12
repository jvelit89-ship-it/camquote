import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenantPurchases } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: { message: "No autenticado" } }, { status: 401 });
    }

    const body = await req.json();
    const { type, orderId } = body; // "quotations" | "products"

    if (type !== "quotations" && type !== "products") {
      return NextResponse.json({ error: { message: "Tipo de compra inválido" } }, { status: 400 });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Define pricing logic
    let quantity = 0;
    let priceUsd = 0;
    let isPerpetual = 0;

    if (type === "quotations") {
      quantity = 10;
      priceUsd = 2.00;
      isPerpetual = 0; // monthly
    } else if (type === "products") {
      quantity = 10;
      priceUsd = 3.00;
      isPerpetual = 1; // permanent
    }

    const id = crypto.randomUUID();

    // En MySQL usamos .execute() en lugar de .run() si no es better-sqlite3
    await db.insert(tenantPurchases).values({
      id,
      tenantId: user.tenantId,
      type,
      quantity,
      priceUsd,
      isPerpetual,
      purchaseMonth: currentMonth,
      // orderId: orderId // Podríamos añadir esta columna al esquema si quisiéramos trazar el pago
    }).execute();

    return NextResponse.json({ success: true, message: "Compra realizada con éxito", orderId });
  } catch (err: any) {
    console.error("Purchase API error:", err);
    return NextResponse.json({ error: { message: "Error al procesar la compra" } }, { status: 500 });
  }
}
