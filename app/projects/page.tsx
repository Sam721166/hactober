"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  FolderKanban,
  Plus,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Activity,
  Calendar,
  ExternalLink,
} from "lucide-react";

export default function WorkspacesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaces() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (data.ok) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to load workspaces:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkspaces();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
                <FolderKanban className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Project Workspaces</h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                PostgreSQL Storage
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Manage your persistent hardware projects, interactive circuit schematics, firmware files, and diagnostic logs.
            </p>
          </div>

          <Link
            href="/builder"
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Project</span>
          </Link>
        </div>

        {/* Project List */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              Loading workspaces from database...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400 dark:border-zinc-800">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No Workspaces Yet
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Use Project Builder to architect your first circuit and save it to your workspace.
              </p>
              <Link
                href="/builder"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Open Project Builder</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-cyan-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-600">
                        {proj.board}
                      </span>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {proj.category}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {proj.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                      {proj.description}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                      <span>{proj.circuit?.components?.length || 0} Components</span>
                      <span>•</span>
                      <span>{proj.circuit?.connections?.length || 0} Wires</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-500"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <span className="text-[10px] text-zinc-400 font-mono">
                      {proj.isSample ? "Sample" : "Custom"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
