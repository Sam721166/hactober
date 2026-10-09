"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Database,
  FolderKanban,
  Package,
  Plus,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/discover", label: "Discover", icon: Layers },
    { href: "/builder", label: "Project Builder", icon: Sparkles },
    { href: "/circuit-doctor", label: "Circuit Doctor", icon: Activity },
    { href: "/circuit-studio", label: "Circuit Studio", icon: Cpu },
    { href: "/components", label: "Components", icon: Package },
    { href: "/projects", label: "Workspaces", icon: FolderKanban },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                CIRCUIT<span className="text-cyan-600 dark:text-cyan-400">DOCTOR</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline -mt-0.5">
                Build it. Debug it. Learn it.
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-cyan-700 font-semibold dark:bg-zinc-800 dark:text-cyan-400"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="h-3 w-3" />
            <span>PostgreSQL Active</span>
          </div>

          <Link
            href="/builder"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
