import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>

    </SidebarProvider>
  );
}
