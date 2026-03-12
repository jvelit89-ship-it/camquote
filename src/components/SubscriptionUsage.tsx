"use client";

import { useState, useEffect } from "react";
import { Users, Package, FileText, AlertTriangle, ArrowUpCircle } from "lucide-react";

interface UsageDetail {
  current: number;
  limit: number;
}

interface UsageData {
  users: UsageDetail;
  products: UsageDetail;
  quotations: UsageDetail;
}

export function SubscriptionUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/usage")
      .then(res => res.json())
      .then(json => {
        if (json.data) setUsage(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-32 glass-card" />;
  if (!usage) return null;

  const items = [
    { label: "Usuarios", icon: Users, ...usage.users },
    { label: "Productos", icon: Package, ...usage.products },
    { label: "Cotizaciones/mes", icon: FileText, ...usage.quotations },
  ];

  const handlePurchase = async (type: "quotations" | "products") => {
    if (!confirm(`¿Estás seguro de comprar 10 ${type === "quotations" ? "cotizaciones" : "productos"} extra?`)) return;
    
    try {
      const res = await fetch("/api/tenant/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-card p-6 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Uso del Plan</h2>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percent = Math.min(100, (item.current / item.limit) * 100);
          const isFull = item.current >= item.limit;
          const isQuotations = item.label === "Cotizaciones/mes";
          const isProducts = item.label === "Productos";

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-slate-600">
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </div>
                <span className={isFull ? "text-red-500 font-bold" : "text-slate-500"}>
                  {item.current} / {item.limit}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isFull ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              
              {isFull && isQuotations && (
                <div className="mt-2 text-[10px] bg-red-50 border border-red-100 p-2 rounded-lg">
                  <p className="text-red-600 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Límite de cotizaciones alcanzado.</p>
                  <p className="text-slate-600 mb-2">Se reiniciarán automáticamente el próximo mes.</p>
                  <button onClick={() => handlePurchase("quotations")} className="w-full bg-white border border-slate-200 shadow-sm rounded-md py-1.5 text-blue-600 font-bold hover:bg-slate-50 transition-colors">
                    Comprar 10 extra ($2.00)
                  </button>
                </div>
              )}

              {isFull && isProducts && (
                <div className="mt-2 text-[10px] bg-red-50 border border-red-100 p-2 rounded-lg">
                  <p className="text-red-600 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Límite de catálogo alcanzado.</p>
                  <button onClick={() => handlePurchase("products")} className="w-full bg-white border border-slate-200 shadow-sm rounded-md py-1.5 text-blue-600 font-bold hover:bg-slate-50 transition-colors">
                    Expandir 10 cupos ($3.00, pago único)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
