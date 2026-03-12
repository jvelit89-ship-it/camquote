"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface AdBannerProps {
  slotId: string;
  format?: "auto" | "fluid" | "rectangle";
  responsive?: boolean;
  publisherId?: string;
  showAds?: boolean;
}

export function AdBanner({ 
  slotId, 
  format = "auto", 
  responsive = true,
  publisherId = "ca-pub-1749527650458388"
}: AdBannerProps) {
  const [showAds, setShowAds] = useState<boolean | null>(null);
  const adRef = useRef<HTMLModElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/ads/config", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setShowAds(data.showAds))
      .catch((err) => {
        console.error("Failed to fetch ad config", err);
        setShowAds(true);
      });
  }, []);

  useEffect(() => {
    if (showAds === false) return;
    try {
      if (adRef.current && !adRef.current.hasAttribute("data-ad-status")) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, [pathname, showAds]); // Refresh on navigation if needed

  if (showAds === false) return null;
  if (showAds === null) return <div className="w-full h-[100px] animate-pulse bg-gray-50 rounded-xl" />;

  return (
    <div className="w-full flex justify-center py-2 overflow-hidden my-4 bg-gray-50/50 rounded-xl border border-gray-100/50 min-h-[100px] relative">
       {/* Placeholder para desarrollo o si el Ad no carga */}
       <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 z-0 pointer-events-none">
        Espacio Publicitario
       </div>
       
      <ins
        ref={adRef}
        className="adsbygoogle relative z-10"
        style={{ display: "block", minWidth: "100%", textAlign: "center" }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
