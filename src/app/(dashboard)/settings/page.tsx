"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "",
    ruc: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    primaryColor: "#1a1a2e",
    secondaryColor: "#6b7280",
    legalRepresentative: "",
    legalRepresentativeDni: "",
    igvRate: 0.18,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((json) => {
      if (json.data) {
        setForm({
          name: json.data.name || "",
          ruc: json.data.ruc || "",
          address: json.data.address || "",
          phone: json.data.phone || "",
          email: json.data.email || "",
          website: json.data.website || "",
          logo: json.data.logo || "",
          primaryColor: json.data.primaryColor || "#1a1a2e",
          secondaryColor: json.data.secondaryColor || "#6b7280",
          legalRepresentative: json.data.legalRepresentative || "",
          legalRepresentativeDni: json.data.legalRepresentativeDni || "",
          igvRate: json.data.igvRate ?? 0.18,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Logo debe ser menor a 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success("Configuración guardada");
    } else {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración de Empresa</h1>
          <p className="text-sm text-[var(--text-secondary)]">Estos datos se usarán en los PDFs de cotización</p>
        </div>
      </div>

      <div className="mb-5">
        <AdBanner slotId="settings_top" format="auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de la Empresa *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">RUC</label>
                  <input value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Teléfono *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Representante Legal</label>
                  <input value={form.legalRepresentative} onChange={(e) => setForm({ ...form, legalRepresentative: e.target.value })} className="input-field" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">DNI Representante</label>
                  <input value={form.legalRepresentativeDni} onChange={(e) => setForm({ ...form, legalRepresentativeDni: e.target.value })} className="input-field" placeholder="Número de DNI" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Página Web</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tasa IGV (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={form.igvRate}
                  onChange={(e) => setForm({ ...form, igvRate: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  style={{ width: 120 }}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">Ej: 0.18 = 18%</p>
              </div>

              <div className="border-t border-[var(--border-color)] pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-4">Identidad Visual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Logo de Empresa</label>
                    <div className="flex items-center gap-4">
                      {form.logo && (
                        <img src={form.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-[var(--border-color)] p-1 bg-white" />
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent-blue)] file:text-white hover:file:opacity-90 transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5">Color Primario</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-xs font-mono">{form.primaryColor}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5">Color Secundario</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-xs font-mono">{form.secondaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="btn btn-primary mt-4" style={{ width: "fit-content" }} disabled={saving}>
                {saving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card p-5 sticky top-6">
            <h3 className="text-sm font-semibold mb-4">Vista Previa Empresarial</h3>
            <div className="flex items-center gap-3 mb-4 p-4 rounded-xl border-l-4" style={{ borderColor: form.primaryColor, backgroundColor: `${form.primaryColor}10` }}>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[var(--border-color)] overflow-hidden">
                {form.logo ? (
                  <img src={form.logo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 size={24} style={{ color: form.primaryColor }} />
                )}
              </div>
              <div>
                <p className="font-semibold" style={{ color: form.primaryColor }}>{form.name || "Mi Empresa"}</p>
                <p className="text-xs text-[var(--text-secondary)]">{form.ruc || "RUC ——————"}</p>
              </div>
            </div>
            <div className="text-sm flex flex-col gap-1.5 text-[var(--text-secondary)]">
              {form.address && <p>📍 {form.address}</p>}
              {form.phone && <p>📞 {form.phone}</p>}
              {form.email && <p>✉️ {form.email}</p>}
              {form.website && <p>🌐 {form.website}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
