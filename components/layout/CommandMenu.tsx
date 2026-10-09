"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Cpu,
  Activity,
  Package,
  FolderKanban,
  Compass,
  ArrowRight,
  X,
  FileCode,
} from "lucide-react";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const navigationItems = [
    {
      title: "Overview & Dashboard",
      description: "Platform summary, core pillars, and quick project starter",
      href: "/",
      category: "Core Navigation",
      icon: Cpu,
    },
    {
      title: "Project Builder",
      description: "AI-assisted hardware project generator with BOM and starter firmware",
      href: "/builder",
      category: "Core Navigation",
      icon: Sparkles,
    },
    {
      title: "Circuit Studio",
      description: "Interactive visual schematic canvas with live simulation & wiring",
      href: "/circuit-studio",
      category: "Core Navigation",
      icon: Cpu,
    },
    {
      title: "Circuit Doctor",
      description: "Multimodal AI diagnosis for troubleshooting faulty circuit photographs",
      href: "/circuit-doctor",
      category: "Core Navigation",
      icon: Activity,
    },
    {
      title: "Component Catalogue",
      description: "Verified microcontrollers, sensors, actuators, and pinout specs",
      href: "/components",
      category: "Hardware Resources",
      icon: Package,
    },
    {
      title: "Project Library & Discover",
      description: "Seeded reference circuits, open-source designs & AI idea generator",
      href: "/discover",
      category: "Hardware Resources",
      icon: Compass,
    },
    {
      title: "My Workspaces",
      description: "Persistent database workspaces, firmwares, and project files",
      href: "/projects",
      category: "Hardware Resources",
      icon: FolderKanban,
    },
  ];

  // Close on Escape key and listen for Command+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = navigationItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="h-4 w-4 text-zinc-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a feature, command, or page..."
            className="w-full bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-zinc-400 hover:text-zinc-700"
            >
              Clear
            </button>
          ) : (
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching features or pages found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">
                      {item.category}
                    </span>
                    <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 bg-zinc-50/70 text-[11px] text-zinc-500 font-mono dark:border-zinc-800 dark:bg-zinc-900/50">
          <span>Navigation Quick Menu</span>
          <div className="flex items-center gap-2">
            <span>Select: ↵</span>
            <span>Close: ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
