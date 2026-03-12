import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    return NextResponse.json({ showAds: true });
  }

  const tenant = db.select().from(tenants).where(eq(tenants.id, user.tenantId)).get();
  const showAds = !tenant || tenant.planId === "free";

  return NextResponse.json({ showAds });
}
