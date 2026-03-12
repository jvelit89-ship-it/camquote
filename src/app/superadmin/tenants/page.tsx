"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Building2, Search, Slash, CheckCircle, Trash2 } from "lucide-react";

interface Tenant {
  id: string;
  companyName: string;
  planId: string;
  status: "active" | "suspended" | "cancelled";
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
}

export default function SuperadminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<{id: string, name: string}[]>([]);
  const [modal, setModal] = useState<{
    show: boolean;
    type: 'confirm' | 'delete' | 'plan';
    id: string;
    targetStatus?: string;
    targetPlanId?: string;
    title: string;
    message: string;
  }>({ show: false, type: 'confirm', id: '', title: '', message: '' });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        fetch("/api/superadmin/tenants?limit=100", { cache: "no-store" }),
        fetch("/api/superadmin/plans", { cache: "no-store" })
      ]);
      
      const tenantsJson = await tenantsRes.json();
      const plansJson = await plansRes.json();

      if (tenantsRes.ok) setTenants(tenantsJson.data || []);
      if (plansRes.ok) setAvailablePlans(plansJson.data || []);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  async function handleStatusChange(id: string, newStatus: string) {
    setModal({
      show: true,
      type: 'confirm',
      id,
      targetStatus: newStatus,
      title: "Confirmar Cambio de Estado",
      message: `¿Estás seguro de cambiar el estado de esta empresa a '${newStatus}'?`
    });
  }

  async function executeStatusChange() {
    const { id, targetStatus, targetPlanId, type } = modal;
    if (!id) return;

    setModal(prev => ({ ...prev, show: false }));
    
    try {
      const body: any = {};
      if (type === 'confirm') body.status = targetStatus;
      if (type === 'plan') body.planId = targetPlanId;

      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(type === 'plan' ? "Plan actualizado" : `Estado actualizado a ${targetStatus}`);
        fetchTenants();
      } else {
        toast.error(data.error?.message || "Error en la operación");
      }
    } catch (err) {
      toast.error("Error de red");
    }
  }

  function handlePlanChange(id: string, currentPlanId: string) {
    setModal({
      show: true,
      type: 'plan',
      id,
      targetPlanId: currentPlanId,
      title: "Cambiar Plan de Suscripción",
      message: "Selecciona el nuevo nivel de servicio para esta empresa:"
    });
  }

  async function handleDelete(id: string) {
    setModal({
      show: true,
      type: 'delete',
      id,
      title: "¡ADVERTENCIA DE ELIMINACIÓN!",
      message: "Estás a punto de eliminar permanentemente esta empresa y TODOS sus datos (usuarios, productos, cotizaciones). Esta acción no se puede deshacer."
    });
  }

  async function executeDelete() {
    const { id } = modal;
    if (!id) return;

    setModal(prev => ({ ...prev, show: false }));
    console.log(`[Superadmin] Iniciando eliminación definitiva de tenant: ${id}`);
    
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Empresa eliminada del sistema");
        fetchTenants();
      } else {
        console.error("[Superadmin] API Delete Error:", data);
        toast.error(data.error?.message || "No se pudo eliminar la empresa");
      }
    } catch (err) {
      console.error("[Superadmin] Network Delete Error:", err);
      toast.error("Error de red al intentar eliminar");
    }
  }

  const filtered = tenants.filter(t => 
    t.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    t.ownerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title text-red-600">Empresas (Tenants)</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Administración de cuentas registradas en el SaaS
          </p>
        </div>
      </div>

      <div className="glass-card p-4 mb-5">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa o correo del propietario..."
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Propietario / Email</th>
              <th>Plan</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No se encontraron tenants</td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold">{t.companyName || "Sin Nombre"}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t.ownerName}</span>
                      <span className="text-xs text-gray-500">{t.ownerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handlePlanChange(t.id, t.planId)}
                      className="badge badge-sent uppercase font-bold hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                    >
                      {t.planId}
                    </button>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    {t.status === "active" && <span className="badge badge-approved">Activo</span>}
                    {t.status === "suspended" && <span className="badge badge-rejected">Suspendido</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {t.status === "active" ? (
                        <button onClick={() => handleStatusChange(t.id, "suspended")} className="btn-icon bg-amber-100 text-amber-700 hover:bg-amber-200" title="Suspender">
                          <Slash size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleStatusChange(t.id, "active")} className="btn-icon bg-green-100 text-green-700 hover:bg-green-200" title="Activar">
                          <CheckCircle size={16} />
                        </button>
                      )}
                       <button onClick={() => handleDelete(t.id)} className="btn-icon bg-red-100 text-red-700 hover:bg-red-200" title="Eliminar (Peligroso)">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl scale-in-center overflow-hidden relative">
            <h3 className={`text-xl font-bold mb-4 ${modal.type === 'delete' ? 'text-red-600' : 'text-[var(--accent-primary)]'}`}>
              {modal.title}
            </h3>
            <p className="text-gray-600 mb-8">
              {modal.message}
            </p>

            {modal.type === 'plan' && (
              <div className="mb-8">
                <select 
                  className="input-field w-full"
                  value={modal.targetPlanId}
                  onChange={(e) => setModal(prev => ({ ...prev, targetPlanId: e.target.value }))}
                >
                  {availablePlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setModal(prev => ({ ...prev, show: false }))}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={modal.type === 'delete' ? executeDelete : executeStatusChange}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-all ${
                  modal.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200' 
                    : 'bg-[var(--accent-primary)] hover:opacity-90 shadow-lg'
                }`}
              >
                {modal.type === 'delete' ? 'Eliminar Definitivamente' : 'Confirmar'}
              </button>
            </div>
            {modal.type === 'delete' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
