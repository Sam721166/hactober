"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FirmwareIDE } from "@/components/firmware/FirmwareIDE";
import { Loader2, FolderKanban, Cpu, ChevronDown } from "lucide-react";

function FirmwarePageContent() {
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (data.ok && data.projects?.length > 0) {
          setProjects(data.projects);

          let initialProj = data.projects[0];
          if (queryProjectId) {
            const matched = data.projects.find((p: any) => p.id === queryProjectId);
            if (matched) initialProj = matched;
          }

          setSelectedProjectId(initialProj.id);
          setActiveProject(initialProj);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [queryProjectId]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setActiveProject(proj);
    }
  };

  const handleSaveFirmware = async (filename: string, code: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/firmware`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: code }),
      });
      const data = await res.json();
      if (data.ok && activeProject) {
        setActiveProject((prev: any) => {
          if (!prev) return prev;
          const currentList = prev.firmwares ? [...prev.firmwares] : [];
          const idx = currentList.findIndex((f: any) => f.filename === filename || f.name === filename);
          if (idx >= 0) {
            currentList[idx] = { ...currentList[idx], content: code };
          } else {
            currentList.push({ id: filename, filename, content: code });
          }
          return { ...prev, firmwares: currentList };
        });
      }
      return data.ok;
    } catch (err) {
      console.error("Failed to save firmware:", err);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#090b10] text-xs text-zinc-400 font-mono">
        <Loader2 className="h-5 w-5 animate-spin text-sky-400 mr-2" />
        Loading Firmware IDE Toolchain...
      </div>
    );
  }

  const initialCode =
    activeProject?.firmwares?.[0]?.content ||
    activeProject?.plan?.firmware?.content ||
    `// Embedded Firmware Project: ${activeProject?.title || "Standalone Sandbox"}
// Microcontroller: ${activeProject?.board || "ESP32 DevKit"}

void setup() {
  Serial.begin(115200);
  pinMode(13, OUTPUT);
  Serial.println("System initialized.");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(100);
  digitalWrite(13, LOW);
  delay(900);
}
`;

  return (
    <div className="flex h-full flex-col bg-[#090b10] text-zinc-200 overflow-hidden font-sans">
      {/* Standalone Project Switcher Bar */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-800 bg-[#090b10] px-4 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-sky-400" />
            <span>Target Workspace:</span>
          </span>

          <select
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-200 focus:outline-none focus:border-sky-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.board})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span>Board: <strong className="text-zinc-200">{activeProject?.board || "ESP32"}</strong></span>
          <span className="text-zinc-600">•</span>
          <span>{activeProject?.circuit?.components?.length || 0} Parts wired</span>
        </div>
      </div>

      {/* Embedded Full-Featured IDE */}
      <div className="flex-1 overflow-hidden h-full">
        <FirmwareIDE
          key={selectedProjectId || "standalone"}
          projectId={selectedProjectId}
          projectName={activeProject?.title || "Embedded Project"}
          initialCode={initialCode}
          initialFiles={activeProject?.firmwares?.map((f: any) => ({ name: f.filename, content: f.content, isModified: false }))}
          circuitConnections={activeProject?.circuit?.connections || []}
          onSave={handleSaveFirmware}
        />
      </div>
    </div>
  );
}

export default function StandaloneFirmwarePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#090b10] text-xs text-zinc-400 font-mono">
          <Loader2 className="h-5 w-5 animate-spin text-sky-400 mr-2" />
          Loading Firmware IDE...
        </div>
      }
    >
      <FirmwarePageContent />
    </Suspense>
  );
}
