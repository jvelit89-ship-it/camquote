"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Error al iniciar sesión");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 selection:bg-blue-100 bg-white relative overflow-hidden">
      {/* Background Glow from Ref */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section - Match Ref Image */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-[88px] h-[88px] rounded-[32px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6 border border-slate-50 relative">
             {/* Glow behind logo icon */}
             <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full scale-110" />
             <img src="/branding/logo.png" alt="CamQuote Logo" className="w-[60px] h-[60px] object-contain relative z-10" />
          </div>
          <h1 className="text-[40px] font-black text-[#0f172a] tracking-tight leading-tight">Iniciar Sesión</h1>
          <p className="text-gray-400 font-medium text-center mt-3 text-lg">Bienvenido de nuevo a CamQuote.cc</p>
        </div>

        {/* Form Card - Exact rounded and shadow from Ref */}
        <div className="glass-card p-12">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-3 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field h-16"
                placeholder="admin@cotizaciones.com"
                required
              />
            </div>

            <div>
              <label className="block text-[15px] font-bold text-slate-700 mb-3 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field h-16"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-2xl border border-red-100 font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full h-[70px] text-[17px] mt-2 group"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Ingresar al sistema"}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col gap-5">
            <p className="text-sm text-center text-slate-300 font-medium tracking-wide">
              Demo: <span className="text-slate-400">admin@cotizaciones.com</span> / <span className="text-slate-400">admin123</span>
            </p>
            <p className="text-[17px] text-center text-slate-500 font-semibold">
              ¿No tienes una cuenta?{" "}
              <Link href="/register" className="text-blue-600 font-bold hover:underline transition-all underline-offset-4">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
