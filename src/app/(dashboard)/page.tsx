import { db } from "@/db";
import { clients, products, quotations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  Users,
  Package,
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdBanner } from "@/components/ads/AdBanner";
import { SubscriptionUsage } from "@/components/SubscriptionUsage";

async function getStats(tenantId: string) {
  const totalQuotations = db.select({ count: sql<number>`count(*)` }).from(quotations).where(and(eq(quotations.isDeleted, 0), eq(quotations.tenantId, tenantId))).get();
  const approvedQuotations = db.select({ count: sql<number>`count(*)` }).from(quotations).where(and(eq(quotations.status, "approved"), eq(quotations.isDeleted, 0), eq(quotations.tenantId, tenantId))).get();
  const totalAmount = db.select({ sum: sql<number>`coalesce(sum(total), 0)` }).from(quotations).where(and(eq(quotations.isDeleted, 0), eq(quotations.tenantId, tenantId))).get();
  const totalClients = db.select({ count: sql<number>`count(*)` }).from(clients).where(and(eq(clients.isDeleted, 0), eq(clients.tenantId, tenantId))).get();
  const totalProducts = db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.isDeleted, 0), eq(products.tenantId, tenantId))).get();

  const recentQuotations = db
    .select({
      id: quotations.id,
      quotationNumber: quotations.quotationNumber,
      clientName: clients.name,
      total: quotations.total,
      status: quotations.status,
      createdAt: quotations.createdAt,
    })
    .from(quotations)
    .leftJoin(clients, eq(quotations.clientId, clients.id))
    .where(and(eq(quotations.isDeleted, 0), eq(quotations.tenantId, tenantId)))
    .orderBy(sql`${quotations.createdAt} DESC`)
    .limit(5)
    .all();

  return {
    totalQuotations: totalQuotations?.count || 0,
    approvedQuotations: approvedQuotations?.count || 0,
    totalAmount: totalAmount?.sum || 0,
    totalClients: totalClients?.count || 0,
    totalProducts: totalProducts?.count || 0,
    recentQuotations,
  };
}

const STATUS_BADGES: Record<string, string> = {
  draft: "badge-draft",
  sent: "badge-sent",
  approved: "badge-approved",
  rejected: "badge-rejected",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user || !user.tenantId) {
    redirect("/login");
  }

  const stats = await getStats(user.tenantId);

  const kpis = [
    { label: "Total Cotizaciones", value: stats.totalQuotations.toString(), icon: FileText, color: "from-blue-600 to-blue-700" },
    { label: "Cotizaciones Aprobadas", value: stats.approvedQuotations.toString(), icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
    { label: "Total Clientes", value: stats.totalClients.toString(), icon: Users, color: "from-orange-500 to-amber-500" },
    { label: "Catálogo Productos", value: stats.totalProducts.toString(), icon: Package, color: "from-purple-500 to-fuchsia-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title text-3xl font-black tracking-tight text-slate-900 mb-1">Panel General</h1>
          <p className="text-sm font-medium text-slate-500">Resumen operativo de tu empresa en CamQuote.cc</p>
        </div>
        <div className="flex gap-3">
          <Link href="/quotations/new" className="btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">
            <Plus size={18} /> Nueva Cotización
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card kpi-card group relative overflow-hidden p-6 hover:shadow-2xl hover:shadow-blue-500/5 h-full flex flex-col justify-between">
             <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.label}</span>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <kpi.icon size={22} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{kpi.value}</span>
            </div>
            {/* Glossy overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="mb-8">
        <AdBanner slotId="dashboard_top" format="auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Quotations */}
        <div className="glass-card p-8 lg:col-span-2 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cotizaciones Recientes</h2>
              <p className="text-sm text-slate-500">Últimos movimientos de ventas</p>
            </div>
            <Link href="/quotations" className="text-sm font-bold text-blue-600 flex items-center gap-1 group">
              Ver historial <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {stats.recentQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
               <p className="text-sm font-medium text-slate-400">
                No hay cotizaciones aún. ¡Crea la primera!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4">N° Documento</th>
                    <th className="pb-4">Cliente</th>
                    <th className="pb-4">Monto Total</th>
                    <th className="pb-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentQuotations.map((q: any) => (
                    <tr key={q.id} className="group hover:bg-blue-50/30 transition-all">
                      <td className="py-4">
                        <Link href={`/quotations/${q.id}`} className="text-blue-600 font-bold hover:text-blue-700">
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="py-4 text-slate-600 font-medium">{q.clientName || "—"}</td>
                      <td className="py-4 font-black text-slate-900">{formatCurrency(q.total)}</td>
                      <td className="py-4">
                        <span className={`badge ${STATUS_BADGES[q.status] || "badge-draft"} shadow-sm`}>
                          {STATUS_LABELS[q.status] || q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-5">
          <SubscriptionUsage />
          
          <div className="glass-card p-8 shadow-xl shadow-slate-200/50 flex flex-col flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Accesos Rápidos</h2>
            <div className="flex flex-col gap-3">
              <Link href="/quotations/new" className="btn bg-slate-900 text-white hover:bg-slate-800 w-full rounded-2xl py-4">
                <Plus size={18} /> Nueva Cotización
              </Link>
              <Link href="/clients" className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 w-full rounded-2xl py-4 shadow-sm">
                <Users size={18} className="text-slate-400" /> Clientes
              </Link>
              <Link href="/products" className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 w-full rounded-2xl py-4 shadow-sm">
                <Package size={18} className="text-slate-400" /> Catálogo
              </Link>
            </div>

            <div className="mt-auto pt-8">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Inventario Activo</p>
                  <p className="text-3xl font-black">{stats.totalProducts}</p>
                  <p className="text-xs opacity-60 mt-1">productos registrados</p>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
