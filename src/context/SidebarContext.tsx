"use client";

import { useState, createContext, useContext } from "react";

const SidebarContext = createContext<{
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
}>({
  isMobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ isMobileOpen, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
