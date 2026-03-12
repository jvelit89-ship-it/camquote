"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Globe, ShieldAlert } from "lucide-react";

export default function SuperadminSettingsPage() {
  const [adsenseId, setAdsenseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/superadmin/settings")
      .then((res) => res.json())
      .then((data) => {
        setAdsenseId(data.googleAdsenseId || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAdsenseId: adsenseId }),
      });

      if (res.ok) {
        toast.success("Ajustes globales actualizados");
      } else {
        toast.error("Error al guardar ajustes");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title text-gray-800">Ajustes Globales</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configuración técnica y de monetización de CamQuote.cc
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* AdSense Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Monetización</h3>
              <p className="text-xs text-slate-500">Google AdSense IDs</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Google AdSense Publisher ID</label>
              <input
                type="text"
                value={adsenseId}
                onChange={(e) => setAdsenseId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="input-field font-mono text-xs"
                disabled={loading}
              />
              <p className="mt-2 text-[10px] text-slate-400">
                Este ID se usará para la verificación del sitio y para todos los banners de publicidad.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="btn btn-primary w-full gap-2"
            >
              {saving ? "Guardando..." : (
                <>
                  <Save size={18} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security / System Info */}
        <div className="glass-card p-6 border-dashed border-slate-200 bg-slate-50/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Estado del Sistema</h3>
              <p className="text-xs text-slate-500">Configuraciones avanzadas</p>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4 italic">
            Próximamente: Límites de almacenamiento por tenant, configuración de SMTP y gestión de logs globales.
          </p>
          
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50 text-xs text-blue-700">
            <strong>Nota:</strong> Los cambios en el ID de AdSense pueden tardar unos minutos en propagarse por el sistema de caché de Next.js.
          </div>
        </div>
      </div>
    </div>
  );
}
