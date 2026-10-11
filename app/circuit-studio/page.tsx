"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CircuitStudioCanvas } from "@/components/circuits/CircuitStudioCanvas";
import { Loader2 } from "lucide-react";

function CircuitStudioContent() {
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedCircuit, setSelectedCircuit] = useState<any>(null);
  const [projectName, setProjectName] = useState("Circuit Studio Sandbox");
  const [canvasKey, setCanvasKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function initCircuitStudio() {
      setIsLoading(true);

      // 1. Fetch available projects first so workspace selector is always populated
      let loadedProjects: any[] = [];
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (active && data.ok && data.projects?.length > 0) {
          loadedProjects = data.projects;
          setProjects(loadedProjects);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }

      if (!active) return;

      // 2. Check if a specific projectId was passed in query params
      if (queryProjectId && loadedProjects.length > 0) {
        const matched = loadedProjects.find((p) => p.id === queryProjectId);
        if (matched) {
          setSelectedProjectId(matched.id);
          setProjectName(matched.title);
          setSelectedCircuit(matched.circuit);
          setCanvasKey(`project-${matched.id}-${Date.now()}`);
          setIsLoading(false);
          return;
        }
      }

      // 3. Check if there is a pending circuit stashed from Project Builder
      try {
        let stashed = typeof window !== "undefined" ? sessionStorage.getItem("circuitdoctor_temp_circuit") : null;
        if (!stashed && typeof window !== "undefined") {
          stashed = localStorage.getItem("circuitdoctor_temp_circuit");
        }

        if (stashed) {
          const parsed = JSON.parse(stashed);
          if (parsed?.circuit && active) {
            setSelectedCircuit(parsed.circuit);
            setProjectName(parsed.title || "Project Builder Generated Circuit");
            setSelectedProjectId(parsed.projectId || "temp-builder");
            setCanvasKey(`builder-${Date.now()}`);
            setIsLoading(false);

            // Clean up stash after loading to avoid stale reloads
            try {
              sessionStorage.removeItem("circuitdoctor_temp_circuit");
              localStorage.removeItem("circuitdoctor_temp_circuit");
            } catch (_) {}
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to read cached circuit:", e);
      }

      // 4. Default fallback: select first project or open default sandbox
      if (active) {
        if (loadedProjects.length > 0) {
          const first = loadedProjects[0];
          setSelectedProjectId(first.id);
          setProjectName(first.title);
          setSelectedCircuit(first.circuit);
          setCanvasKey(`project-${first.id}-${Date.now()}`);
        } else {
          setCanvasKey("default-sandbox");
        }
        setIsLoading(false);
      }
    }

    void initCircuitStudio();

    return () => {
      active = false;
    };
  }, [queryProjectId]);

  const handleSelectProject = async (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find((proj) => proj.id === id);
    if (p) {
      setProjectName(p.title);
      setSelectedCircuit(p.circuit);
      setCanvasKey(`project-${p.id}-${Date.now()}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 font-mono">
        <Loader2 className="h-5 w-5 animate-spin text-sky-500 mr-2" />
        Loading Circuit Studio...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      <div className="flex-1 overflow-hidden h-full">
        <CircuitStudioCanvas
          key={canvasKey}
          initialCircuit={selectedCircuit}
          projectId={selectedProjectId}
          projectName={projectName}
          projects={projects}
          onSelectProject={handleSelectProject}
        />
      </div>
    </div>
  );
}

export default function CircuitStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 font-mono">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500 mr-2" />
          Loading Circuit Studio...
        </div>
      }
    >
      <CircuitStudioContent />
    </Suspense>
  );
}
