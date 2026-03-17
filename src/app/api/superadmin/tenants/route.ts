import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "superadmin") {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Acceso denegado" } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const allTenants = await db
      .select({
        id: tenants.id,
        companyName: tenants.companyName,
        planId: tenants.planId,
        status: tenants.status,
        createdAt: tenants.createdAt,
        ownerEmail: users.email,
        ownerName: users.name,
      })
      .from(tenants)
      .leftJoin(users, eq(tenants.ownerUserId, users.id))
      .orderBy(sql`${tenants.createdAt} DESC`)
      .limit(limit);

    return NextResponse.json(
      { data: allTenants },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("Superadmin tenants list error:", err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Error interno" } }, { status: 500 });
  }
}
