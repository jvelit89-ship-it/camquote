import Sidebar from "./Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/context/SidebarContext";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  
  if (!user || user.role !== "superadmin") {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
