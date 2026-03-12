"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreditCard, Save, RefreshCw, Users, Package, FileText } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxProducts: number;
  maxQuotations: number;
  updatedAt: string;
}

export default function SuperadminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/plans");
      const json = await res.json();
      if (res.ok) setPlans(json.data || []);
    } catch {
      toast.error("Error al cargar planes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPlans(); }, []);

  async function handleUpdatePlan(id: string, data: Partial<Plan>) {
    setSaving(id);
    try {
      const res = await fetch(`/api/superadmin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Plan actualizado");
        fetchPlans();
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="p-1">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-blue-600">Niveles de Suscripción</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configura los precios, límites y beneficios de cada plan del SaaS
          </p>
        </div>
        <button onClick={fetchPlans} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Recargar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading && plans.length === 0 ? (
          <div className="col-span-3 text-center py-20">Cargando planes...</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="glass-card p-6 flex flex-col relative overflow-hidden">
               {/* Accent line based on plan id */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                plan.id === 'free' ? 'bg-gray-400' : 
                plan.id === 'pro' ? 'bg-blue-600' : 'bg-amber-500'
              }`} />

              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <span className="text-2xl font-black text-indigo-700">
                  ${plan.price}
                  <span className="text-xs font-medium text-gray-500 ml-1">/mes</span>
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} />
                    <span>Usuarios Máx:</span>
                  </div>
                  <input 
                    type="number" 
                    className="input-field w-20 text-right" 
                    defaultValue={plan.maxUsers}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val !== plan.maxUsers) handleUpdatePlan(plan.id, { maxUsers: val });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package size={14} />
                    <span>Productos Máx:</span>
                  </div>
                  <input 
                    type="number" 
                    className="input-field w-20 text-right" 
                    defaultValue={plan.maxProducts}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val !== plan.maxProducts) handleUpdatePlan(plan.id, { maxProducts: val });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText size={14} />
                    <span>Cotizaciones/mes:</span>
                  </div>
                  <input 
                    type="number" 
                    className="input-field w-20 text-right" 
                    defaultValue={plan.maxQuotations}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (val !== plan.maxQuotations) handleUpdatePlan(plan.id, { maxQuotations: val });
                    }}
                  />
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>Precio Mensual:</span>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="bg-transparent border-b border-gray-200 w-16 text-right focus:outline-none focus:border-indigo-500"
                      defaultValue={plan.price}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val !== plan.price) handleUpdatePlan(plan.id, { price: val });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
                <span>Actualizado: {new Date(plan.updatedAt).toLocaleDateString()}</span>
                {saving === plan.id && <RefreshCw size={12} className="animate-spin text-indigo-500" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
