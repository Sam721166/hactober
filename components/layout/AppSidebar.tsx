"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Cpu,
  Activity,
  Package,
  Compass,
  FolderKanban,
  Search,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
}

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  onOpenSearch,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navigationSections = [
    {
      title: "Core Platform",
      items: [
        {
          label: "Overview",
          href: "/",
          icon: LayoutDashboard,
          description: "System dashboard & quickstart",
        },
        {
          label: "Project Builder",
          href: "/builder",
          icon: Sparkles,
          badge: "AI",
          description: "Architecture & firmware generator",
        },
        {
          label: "Circuit Studio",
          href: "/circuit-studio",
          icon: Cpu,
          badge: "Canvas",
          description: "Visual schematic & simulation",
        },
        {
          label: "Circuit Doctor",
          href: "/circuit-doctor",
          icon: Activity,
          badge: "Vision",
          description: "Multimodal fault diagnostics",
        },
      ],
    },
    {
      title: "Hardware Assets",
      items: [
        {
          label: "Component Library",
          href: "/components",
          icon: Package,
          description: "Verified MCUs, sensors & pinouts",
        },
        {
          label: "Project Library",
          href: "/discover",
          icon: Compass,
          description: "Tested reference designs & ideas",
        },
        {
          label: "My Workspaces",
          href: "/projects",
          icon: FolderKanban,
          description: "Saved projects & circuit data",
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-zinc-200 bg-white transition-all duration-200 select-none dark:border-zinc-800 dark:bg-zinc-950 shrink-0 ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header & Toggle */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-zinc-200 dark:border-zinc-800">
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              className="flex items-center gap-2.5 overflow-hidden group min-w-0"
              title="CircuitDoctor Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950 group-hover:bg-zinc-800 dark:group-hover:bg-white transition-all shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  CIRCUIT<span className="text-zinc-500">DOCTOR</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-tight truncate">
                  Hardware AI Studio
                </span>
              </div>
            </Link>

            <button
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex w-full items-center justify-center">
            <button
              onClick={onToggleCollapse}
              className="group flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-900 hover:text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-100 dark:hover:text-zinc-950 transition-all shadow-xs"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4 group-hover:scale-105 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Search Bar */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-900">
        <button
          onClick={onOpenSearch}
          className={`w-full flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 transition-all ${
            isCollapsed ? "justify-center px-0" : "justify-between"
          }`}
          title="Search features (⌘K)"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            {!isCollapsed && <span className="truncate text-[11px]">Search features...</span>}
          </div>
          {!isCollapsed && (
            <kbd className="rounded border border-zinc-200 bg-white px-1 py-0.5 text-[9px] font-mono font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 shrink-0">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {navigationSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 pb-1 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    } ${isCollapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isActive
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                      }`}
                    />

                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold tracking-tight ${
                              isActive
                                ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions & System Status */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {/* Quick New Project Button */}
        <Link
          href="/builder"
          className={`flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all ${
            isCollapsed ? "justify-center px-0" : "justify-center"
          }`}
          title="New Project"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span>New Project</span>}
        </Link>

        {/* Database & Engine Status Card */}
        {!isCollapsed && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-2 text-[10px] font-mono text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL
              </span>
              <span className="text-zinc-400">Connected</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-zinc-700 dark:text-zinc-300">Gemma & Gemini</span>
              <span className="text-zinc-400">Online</span>
            </div>
          </div>
        )}

        {/* Expand button if collapsed (at bottom as well) */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center py-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
