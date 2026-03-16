import type { Metadata } from "next";
import { db } from "@/db";
import { companySettings, globalSettings, tenants } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CamQuote.cc — Cotizador Online Seguridad Gratis",
  description: "Sistema profesional de cotizaciones para seguridad electrónica y cámaras",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();
  // Global Settings for AdSense
  const sysSettingsResult = await db.select().from(globalSettings).where(eq(globalSettings.id, "current"));
  const sysSettings = sysSettingsResult[0];
  const adsenseId = sysSettings?.googleAdsenseId || "ca-pub-1749527650458388";

  let company = undefined;
  let tenant = null;
  if (user?.tenantId) {
    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, user.tenantId));
    tenant = tenantResult[0];
    const companyResult = await db.select().from(companySettings).where(eq(companySettings.tenantId, user.tenantId));
    company = companyResult[0];
  } else {
    const companyResult = await db.select().from(companySettings);
    company = companyResult[0];
  }

  const showAds = false; // Disable temporarily to fix click issue

  const primaryColor = company?.primaryColor || "#1a1a2e";
  const secondaryColor = company?.secondaryColor || "#6b7280";

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Dynamic Google AdSense Script - Only for FREE users */}
        {showAds && (
          <script 
            async 
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            className="adsbygoogle"
            crossOrigin="anonymous"
          ></script>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --accent-blue: ${primaryColor};
            --accent-primary: ${primaryColor};
            --accent-secondary: ${secondaryColor};
          }
        `}} />
      </head>
      <body className="antialiased font-sans bg-[#fafafa] min-h-screen relative overflow-x-hidden">
        {/* Strict Blue/White Background Aesthetic */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-white">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.02)_0%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-50/20 blur-[130px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-50/10 blur-[130px]" />
        </div>
        <div className="relative z-0">
          {children}
          <Toaster position="top-right" richColors />
        </div>
      </body>
    </html>
  );
}
