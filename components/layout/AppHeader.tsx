"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Plus,
  Database,
  Layers,
  ChevronRight,
  Sparkles,
  Command,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AppHeader({
  onOpenMobileMenu,
  onOpenSearch,
  isSidebarCollapsed,
  onToggleSidebar,
}: AppHeaderProps) {
  const pathname = usePathname();

  // Generate clean breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    if (pathname === "/") return [{ label: "Home", href: "/" }, { label: "Overview" }];
    if (pathname.startsWith("/builder"))
      return [{ label: "Platform", href: "/" }, { label: "Project Builder" }];
    if (pathname.startsWith("/circuit-studio"))
      return [{ label: "Platform", href: "/" }, { label: "Circuit Studio" }];
    if (pathname.startsWith("/circuit-doctor"))
      return [{ label: "Platform", href: "/" }, { label: "Circuit Doctor" }];
    if (pathname.startsWith("/components"))
      return [{ label: "Hardware Assets", href: "/components" }, { label: "Component Catalogue" }];
    if (pathname.startsWith("/discover"))
      return [{ label: "Hardware Assets", href: "/discover" }, { label: "Project Library" }];
    if (pathname.startsWith("/projects"))
      return [{ label: "Workspaces", href: "/projects" }, { label: "Project Workspaces" }];
    return [{ label: "Platform", href: "/" }, { label: "Dashboard" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6 shrink-0">
      {/* Left: Desktop Toggle / Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 md:hidden dark:border-zinc-800 dark:text-zinc-400"
          title="Open Navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors shadow-2xs"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Clean Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 ml-1">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-zinc-400" />}
              {bc.href ? (
                <Link
                  href={bc.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {bc.label}
                </Link>
              ) : (
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {bc.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Quick Actions & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 transition-colors"
        >
          <Search className="h-3 w-3 text-zinc-400" />
          <span className="text-[11px]">Search</span>
          <kbd className="rounded border border-zinc-200 bg-white px-1 text-[9px] font-mono text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
            ⌘K
          </kbd>
        </button>

        {/* Database Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="h-3 w-3 text-zinc-500" />
          <span>PostgreSQL Active</span>
        </div>

        {/* Quick New Project Button */}
        <Link
          href="/builder"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Project</span>
        </Link>
      </div>
    </header>
  );
}
