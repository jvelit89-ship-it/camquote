"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    ruc: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("¡Cuenta creada exitosamente!");
        router.push("/login?registered=true");
      } else {
        toast.error(data.error?.message || "Error al registrarse");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 selection:bg-blue-100 bg-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-50/40 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative z-10 py-12">
        <div className="flex flex-col items-center mb-10">
          <div className="w-[80px] h-[80px] rounded-[28px] bg-white shadow-xl shadow-blue-500/5 flex items-center justify-center mb-6 border border-slate-50">
            <img src="/branding/logo.png" alt="Logo" className="w-[52px] h-[52px] object-contain" />
          </div>
          <h1 className="text-[34px] font-black text-[#0f172a] tracking-tight">Crea tu cuenta</h1>
          <p className="text-gray-400 font-medium text-center mt-2">Únete a CamQuote.cc — Cotizador Online Gratis</p>
        </div>

        <div className="bg-white rounded-[48px] p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.06)] border border-slate-50/50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2 ml-1">Nombre Completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field h-14"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2 ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field h-14"
                  placeholder="juan@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2 ml-1">Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field h-14"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2 ml-1">Nombre de tu Empresa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="input-field h-14"
                  placeholder="Mi Empresa Integrador SAC"
                  required
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2 ml-1">RUC de la Empresa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.ruc}
                  onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                  className="input-field h-14"
                  placeholder="20123456789"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-[64px] text-base group"
            >
              {loading ? "Creando cuenta..." : "Comenzar gratis ahora"}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-1" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-500 font-medium">
              ¿Ya eres usuario?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:underline transition-all">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
