import { db } from "@/db";
import { tenants, users, quotations } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Building2, Users, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getSuperadminStats() {
  const totalTenants = db.select({ count: sql<number>`count(*)` }).from(tenants).get();
  const activeTenants = db.select({ count: sql<number>`count(*)` }).from(tenants).where(sql`${tenants.status} = 'active'`).get();
  const totalUsers = db.select({ count: sql<number>`count(*)` }).from(users).get();
  const totalQuotations = db.select({ count: sql<number>`count(*)` }).from(quotations).get();

  return {
    totalTenants: totalTenants?.count || 0,
    activeTenants: activeTenants?.count || 0,
    totalUsers: totalUsers?.count || 0,
    totalQuotations: totalQuotations?.count || 0,
  };
}

export default async function SuperadminDashboard() {
  const stats = await getSuperadminStats();

  const kpis = [
    { label: "Empresas Registradas", value: stats.totalTenants.toString(), icon: Building2, color: "from-blue-600 to-blue-700" },
    { label: "Empresas Activas", value: stats.activeTenants.toString(), icon: Building2, color: "from-emerald-500 to-teal-600" },
    { label: "Total Usuarios", value: stats.totalUsers.toString(), icon: Users, color: "from-amber-500 to-orange-600" },
    { label: "Cotizaciones Globales", value: stats.totalQuotations.toString(), icon: FileText, color: "from-purple-500 to-fuchsia-600" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title text-red-600">Superadmin | Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Panel de control global del sistema SaaS Multi-tenant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card kpi-card">
            <div className="flex items-center justify-between">
              <span className="kpi-label">{kpi.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <kpi.icon size={16} className="text-white" />
              </div>
            </div>
            <span className="kpi-value">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <Building2 size={18} className="text-red-500" />
            Gestión de Empresas (Tenants)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Visualiza y administra todas las cuentas empresariales registradas en el sistema. Puedes suspender o eliminar tenants que infrinjan los términos de servicio.
          </p>
          <Link href="/superadmin/tenants" className="btn bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto">
            Ver todas las empresas <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-blue-500">
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Supervisión
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            El sistema actualmente aloja a {stats.totalUsers} usuarios en {stats.totalTenants} espacios de trabajo, habiendo generado un volumen global de {stats.totalQuotations} documentos.
          </p>
        </div>
      </div>
    </div>
  );
}
