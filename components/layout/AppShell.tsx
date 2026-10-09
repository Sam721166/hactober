"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CommandMenu } from "./CommandMenu";
import { X } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global ⌘K or / key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full">
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white dark:bg-zinc-950 shadow-2xl">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-3 top-3.5 z-10 p-1 text-zinc-500 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
            <AppSidebar
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onOpenSearch={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
            />
          </div>
          <div
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <AppHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Page Children Container */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Command Menu Modal */}
      <CommandMenu
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
