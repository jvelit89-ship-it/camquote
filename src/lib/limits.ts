import { db } from "@/db";
import { tenants, plans, users, products, quotations } from "@/db/schema";
import { eq, count, and, gte } from "drizzle-orm";

export interface PlanLimits {
  maxUsers: number;
  maxProducts: number;
  maxQuotations: number;
}

// function round2(n: number): number {
//   return Math.round(n * 100) / 100;
// }

export async function getTenantLimits(tenantId: string): Promise<PlanLimits> {
  const tenant = db.select({ planId: tenants.planId }).from(tenants).where(eq(tenants.id, tenantId)).get();
  
  if (!tenant) throw new Error("Tenant not found");

  const plan = db.select().from(plans).where(eq(plans.id, tenant.planId)).get();
  
  let baseLimits = { maxUsers: 1, maxProducts: 20, maxQuotations: 10 };
  if (plan) {
    baseLimits = {
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxProducts,
      maxQuotations: plan.maxQuotations,
    };
  }

  // Calculate current month string (e.g. "2026-03")
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get purchases
  const { tenantPurchases } = await import("@/db/schema");
  const purchases = db.select().from(tenantPurchases).where(eq(tenantPurchases.tenantId, tenantId)).all();

  // Sum extra products (perpetual)
  const extraProducts = purchases
    .filter(p => p.type === "products" && p.isPerpetual === 1)
    .reduce((sum, p) => sum + p.quantity, 0);

  // Sum extra quotations (only for current month)
  const extraQuotations = purchases
    .filter(p => p.type === "quotations" && p.purchaseMonth === currentMonth)
    .reduce((sum, p) => sum + p.quantity, 0);

  return {
    maxUsers: baseLimits.maxUsers,
    maxProducts: baseLimits.maxProducts + extraProducts,
    maxQuotations: baseLimits.maxQuotations + extraQuotations,
  };
}

export async function checkUserLimit(tenantId: string): Promise<boolean> {
  const limits = await getTenantLimits(tenantId);
  const current = db.select({ value: count() }).from(users).where(eq(users.tenantId, tenantId)).get();
  return (current?.value || 0) < limits.maxUsers;
}

export async function checkProductLimit(tenantId: string): Promise<boolean> {
  const limits = await getTenantLimits(tenantId);
  const current = db.select({ value: count() }).from(products).where(
    and(eq(products.tenantId, tenantId), eq(products.isDeleted, 0))
  ).get();
  return (current?.value || 0) < limits.maxProducts;
}

export async function checkQuotationLimit(tenantId: string): Promise<boolean> {
  const limits = await getTenantLimits(tenantId);
  
  // Usually quotations are limited per month or total. Let's assume per month for scalability.
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const current = db.select({ value: count() }).from(quotations).where(
    and(
      eq(quotations.tenantId, tenantId), 
      eq(quotations.isDeleted, 0),
      gte(quotations.createdAt, startOfMonth.toISOString())
    )
  ).get();

  return (current?.value || 0) < limits.maxQuotations;
}
