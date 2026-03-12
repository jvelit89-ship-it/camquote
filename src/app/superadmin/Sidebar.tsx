"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  CreditCard,
  X,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

const NAV_ITEMS = [
  { href: "/superadmin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/superadmin/tenants", icon: Building2, label: "Empresas" },
  { href: "/superadmin/plans", icon: CreditCard, label: "Planes" },
  { href: "/superadmin/users", icon: Users, label: "Usuarios Global" },
  { href: "/superadmin/settings", icon: Settings, label: "Ajustes Global" },
];

export default function SuperadminSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/superadmin") return pathname === "/superadmin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={closeMobile}
        />
      )}

      <aside className={`sidebar !bg-blue-600 border-r-0 shadow-2xl shadow-blue-900/20 ${isMobileOpen ? "mobile-open" : ""}`}>
        <div className="flex items-center justify-between mb-10 px-4 lg:justify-center shrink-0">
          <Link href="/superadmin" className="w-[52px] h-[52px] rounded-[18px] bg-white flex items-center justify-center shadow-lg shadow-blue-900/10 group" onClick={closeMobile}>
            <img 
              src="/branding/logo.png" 
              alt="Logo" 
              className="w-[36px] h-[36px] object-contain transition-transform group-hover:scale-110" 
            />
          </Link>
          <button onClick={closeMobile} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1 w-full px-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`sidebar-item transition-all duration-300 !text-blue-100 hover:!bg-white/10 hover:!text-white ${isActive(item.href) ? "!bg-white !text-blue-600 shadow-lg shadow-blue-900/20 active" : ""}`}
              title={item.label}
            >
              <item.icon 
                size={22} 
                className="shrink-0"
                strokeWidth={isActive(item.href) ? 2.5 : 1.75}
              />
              <span className="sidebar-label lg:hidden">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-4 w-full pt-6 border-t border-white/10 shrink-0">
          <form action="/api/auth/logout" method="POST" onClick={closeMobile}>
            <button 
              type="submit" 
              className="sidebar-item w-full !text-blue-200 hover:!bg-red-500/20 hover:!text-white transition-colors" 
              title="Cerrar sesión"
            >
              <LogOut size={22} strokeWidth={1.75} />
              <span className="sidebar-label">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-label {
          font-size: 15px;
          font-weight: 600;
          display: block;
          white-space: nowrap;
        }
        @media (min-width: 1024px) {
          .sidebar-label {
            display: none;
          }
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          height: 52px;
          border-radius: 16px;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .sidebar-item {
            justify-content: center;
            padding: 0;
            width: 52px;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
}
