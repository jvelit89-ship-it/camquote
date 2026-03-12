"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  CreditCard, 
  Zap, 
  Package, 
  FileText, 
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface UsageStats {
  current: number;
  limit: number;
}

interface SubscriptionData {
  users: UsageStats;
  products: UsageStats;
  quotations: UsageStats;
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

export default function SubscriptionPage() {
  const [usage, setUsage] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/tenant/usage");
      const json = await res.json();
      if (json.data) {
        setUsage(json.data);
      }
    } catch (error) {
      toast.error("Error al cargar datos de suscripción");
    } finally {
      setLoading(false);
    }
  };

  const onSuccess = async (type: "quotations" | "products", orderId: string) => {
    try {
      const res = await fetch("/api/tenant/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderId }),
      });

      if (res.ok) {
        toast.success("¡Pago confirmado! Cuota aumentada.");
        fetchUsage();
      } else {
        toast.error("Error al registrar el pago en el sistema");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-[var(--text-secondary)]">Cargando suscripción...</div>;

  const getPercentage = (stats: UsageStats) => Math.min(Math.round((stats.current / stats.limit) * 100), 100);
  const getStatusColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="max-w-5xl mx-auto pb-10">
        <div className="page-header mb-8">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Zap className="text-amber-500" />
              Mi Suscripción
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">Gestiona tu plan y límites de uso</p>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 flex items-center gap-2">
               <CheckCircle2 size={14} />
               PLAN FREE
             </div>
          </div>
        </div>

        <div className="mb-8">
          <AdBanner slotId="subscription_top" format="auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Quotations Card */}
          <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <FileText size={24} />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Mensual</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">Cotizaciones</h3>
              <p className="text-sm text-[var(--text-secondary)]">Consumo del mes actual</p>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-[var(--text-primary)]">{usage?.quotations.current}</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">de {usage?.quotations.limit}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${getStatusColor(getPercentage(usage?.quotations || {current:0, limit:1}))}`}
                  style={{ width: `${getPercentage(usage?.quotations || {current:0, limit:1})}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-center mb-3 text-[var(--text-secondary)] uppercase tracking-widest">+10 Cotizaciones por $2.00</p>
              <PayPalButtons 
                style={{ layout: "horizontal", height: 40 }}
                createOrder={(data: any, actions: any) => {
                  return actions.order.create({
                    purchase_units: [{
                      amount: { 
                        currency_code: "USD",
                        value: "2.00" 
                      },
                      description: "Recarga de 10 Cotizaciones - CamQuote",
                      payee: { email_address: "jvelit89@gmail.com" }
                    }]
                  });
                }}
                onApprove={async (data: any, actions: any) => {
                  if (actions.order) {
                    const order = await actions.order.capture();
                    onSuccess("quotations", order.id);
                  }
                }}
              />
            </div>
          </div>

          {/* Products Card */}
          <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                <Package size={24} />
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Permanente</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">Productos</h3>
              <p className="text-sm text-[var(--text-secondary)]">Límite de catálogo</p>
            </div>
            
            <div className="mt-2 text-center py-2">
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-[var(--text-primary)]">{usage?.products.current}</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">de {usage?.products.limit}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${getStatusColor(getPercentage(usage?.products || {current:0, limit:1}))}`}
                  style={{ width: `${getPercentage(usage?.products || {current:0, limit:1})}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-center mb-3 text-[var(--text-secondary)] uppercase tracking-widest">+10 Productos por $3.00</p>
              <PayPalButtons 
                style={{ layout: "horizontal", height: 40, color: "blue" }}
                createOrder={(data: any, actions: any) => {
                  return actions.order.create({
                    purchase_units: [{
                      amount: { 
                        currency_code: "USD",
                        value: "3.00" 
                      },
                      description: "Recarga de 10 Productos - CamQuote",
                      payee: { email_address: "jvelit89@gmail.com" }
                    }]
                  });
                }}
                onApprove={async (data: any, actions: any) => {
                  if (actions.order) {
                    const order = await actions.order.capture();
                    onSuccess("products", order.id);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">¿Necesitas más potencia?</h2>
          <p className="text-[var(--text-secondary)] max-w-md">
            Sube de nivel con el plan PRO para obtener cotizaciones ilimitadas, 
            múltiples usuarios y soporte prioritario.
          </p>
          <button className="btn btn-primary px-10 h-12 text-base shadow-xl shadow-blue-500/20 mt-2">
            Ver Planes Proximamente
          </button>
        </div>

      </div>

      <style jsx>{`
        .glass-card {
           background: rgba(255, 255, 255, 0.7);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(255, 255, 255, 0.3);
           border-radius: 24px;
           box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
        }
      `}</style>
    </PayPalScriptProvider>
  );
}
