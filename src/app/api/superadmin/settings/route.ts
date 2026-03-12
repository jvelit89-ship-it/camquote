import { db } from "@/db";
import { globalSettings } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthUser();
  if (user?.role !== "superadmin") {
    return NextResponse.json({ error: { message: "No autorizado" } }, { status: 403 });
  }

  const settings = db.select().from(globalSettings).where(eq(globalSettings.id, "current")).get();
  return NextResponse.json(settings || { googleAdsenseId: "" });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (user?.role !== "superadmin") {
    return NextResponse.json({ error: { message: "No autorizado" } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { googleAdsenseId } = body;

    const now = new Date().toISOString();
    
    const existing = db.select().from(globalSettings).where(eq(globalSettings.id, "current")).get();

    if (existing) {
      db.update(globalSettings)
        .set({ googleAdsenseId, updatedAt: now })
        .where(eq(globalSettings.id, "current"))
        .run();
    } else {
      db.insert(globalSettings)
        .values({ id: "current", googleAdsenseId, updatedAt: now })
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: { message: "Error al actualizar ajustes" } }, { status: 500 });
  }
}
