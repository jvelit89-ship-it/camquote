"use client";

import { Bell, Search, LogOut, Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export default function Header() {
  const { toggleMobile } = useSidebar();

  return (
    <header className="flex items-center justify-between mb-8 lg:mb-10 gap-4">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={toggleMobile}
        className="mobile-nav-toggle lg:hidden p-3 rounded-2xl border border-slate-100 bg-white text-slate-600 hover:text-blue-600 transition-all shadow-sm active:scale-95"
      >
        <Menu size={22} />
      </button>

      <div className="relative group flex-1 max-w-[400px]">
        <Search 
          size={18} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" 
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-xl text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium shadow-sm"
        />
      </div>

      <div className="flex items-center gap-3 lg:gap-8">
        <button className="relative w-12 h-12 hidden sm:flex items-center justify-center rounded-[18px] border border-slate-50 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm">
          <Bell size={22} strokeWidth={1.75} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-[3px] border-white shadow-sm" />
        </button>

        <div className="flex items-center gap-3 lg:gap-5 lg:pl-8 lg:border-l lg:border-slate-100">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-bold text-slate-900">Usuario</p>
            <p className="text-[10px] uppercase tracking-[0.1em] font-black text-blue-600 opacity-80">Administrador</p>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-[14px] lg:rounded-[18px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm lg:text-[17px] font-black shadow-lg shadow-blue-500/20">
            U
          </div>
          
          <form action="/api/auth/logout" method="POST">
            <button 
              type="submit" 
              className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-[14px] lg:rounded-[18px] border border-slate-50 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
              title="Cerrar sesión"
            >
              <LogOut size={22} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
