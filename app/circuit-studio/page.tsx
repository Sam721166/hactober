"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { CircuitStudioCanvas } from "@/components/circuits/CircuitStudioCanvas";
import { FolderKanban, Save, Sparkles, Layers } from "lucide-react";

export default function CircuitStudioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedCircuit, setSelectedCircuit] = useState<any>(null);
  const [projectName, setProjectName] = useState("Circuit Studio Sandbox");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (data.ok && data.projects?.length > 0) {
          setProjects(data.projects);
          // Set first project circuit
          const first = data.projects[0];
          setSelectedProjectId(first.id);
          setProjectName(first.title);
          setSelectedCircuit(first.circuit);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    loadProjects();
  }, []);

  const handleSelectProject = async (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find((proj) => proj.id === id);
    if (p) {
      setProjectName(p.title);
      setSelectedCircuit(p.circuit);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Navbar />

      {/* Top Project Switcher Subbar */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-200 bg-zinc-100/70 px-4 dark:border-zinc-800 dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Active Workspace:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-0.5 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.board})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span>Mode: Visual Node & Wire Schematics</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <CircuitStudioCanvas
          key={selectedProjectId}
          initialCircuit={selectedCircuit}
          projectId={selectedProjectId}
          projectName={projectName}
        />
      </div>
    </div>
  );
}
