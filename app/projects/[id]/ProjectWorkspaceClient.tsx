"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CircuitStudioCanvas } from "@/components/circuits/CircuitStudioCanvas";
import { FirmwareIDE } from "@/components/firmware/FirmwareIDE";
import { extractPinsFromCode, ExtractedPin } from "@/lib/analysis/firmware";
import {
  FolderKanban,
  Cpu,
  Layers,
  FileCode,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Save,
  ArrowLeft,
  ListOrdered,
  DollarSign,
  Radio,
  ExternalLink,
  Loader2,
} from "lucide-react";

export function ProjectWorkspaceClient({ id }: { id: string }) {
  const [project, setProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "circuit" | "firmware" | "comparison" | "bom"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Firmware editor state
  const [firmwareCode, setFirmwareCode] = useState("");
  const [extractedPins, setExtractedPins] = useState<ExtractedPin[]>([]);
  const [isSavingFw, setIsSavingFw] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.ok) {
          setProject(data.project);
          if (data.project.firmwares?.[0]?.content) {
            const fw = data.project.firmwares[0].content;
            setFirmwareCode(fw);
            setExtractedPins(extractPinsFromCode(fw));
          } else if (data.project.plan?.firmware?.content) {
            const fw = data.project.plan.firmware.content;
            setFirmwareCode(fw);
            setExtractedPins(extractPinsFromCode(fw));
          }
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id]);

  // Save firmware
  const handleSaveFirmware = async () => {
    setIsSavingFw(true);
    try {
      const res = await fetch(`/api/projects/${id}/firmware`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "main.ino",
          content: firmwareCode,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExtractedPins(data.extractedPins);
        alert("Firmware saved successfully!");
      }
    } catch (err) {
      alert("Failed to save firmware.");
    } finally {
      setIsSavingFw(false);
    }
  };

  // Export BOM to CSV
  const handleExportBomCsv = () => {
    if (!project?.bom || project.bom.length === 0) return;
    const header = "Ref,Name,Quantity,Unit Price (INR),Notes\n";
    const rows = project.bom
      .map(
        (b: any) =>
          `"${b.ref}","${b.name}",${b.quantity},${b.unitPriceInr || ""},"${b.notes || ""}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bom-${project.slug || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-xs text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <span>Loading project workspace...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 space-y-3">
        <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Project Workspace Not Found
        </h2>
        <Link
          href="/projects"
          className="text-xs text-zinc-900 font-semibold hover:underline dark:text-zinc-100 flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Workspace Sub Header */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Back to workspaces"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100">
              {project.title}
            </span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 font-semibold">
              {project.board}
            </span>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "circuit", label: "Circuit Studio", icon: Cpu },
            { id: "firmware", label: "Firmware IDE", icon: FileCode },
            { id: "comparison", label: "Pin Mapping", icon: Radio },
            { id: "bom", label: "BOM", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-zinc-900 text-white font-semibold shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Doctor Launcher */}
        <div className="flex items-center gap-2">
          <Link
            href={`/circuit-doctor?board=${encodeURIComponent(project.board)}`}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors shadow-xs"
          >
            <Activity className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Diagnose with Doctor</span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Project Description
                </span>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {project.description}
                </p>

                {project.plan?.overview && (
                  <p className="text-xs leading-relaxed text-zinc-500 mt-2">
                    {project.plan.overview}
                  </p>
                )}
              </div>

              {/* Build Steps */}
              {project.plan?.buildSteps && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                  <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Build & Assembly Guide
                  </span>
                  <div className="space-y-3 mt-3">
                    {project.plan.buildSteps.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-zinc-950 dark:text-zinc-100 font-mono">
                            STEP {s.step}: {s.goal}
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{s.instructions}</p>
                        {s.outcome && (
                          <div className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] mt-1 flex items-center gap-1 pt-1">
                            <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                            <span>Expected Outcome: {s.outcome}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Embedded Circuit Studio Canvas */}
        {activeTab === "circuit" && (
          <div className="h-full w-full">
            <CircuitStudioCanvas
              key={project.id}
              initialCircuit={project.circuit}
              projectId={project.id}
              projectName={project.title}
            />
          </div>
        )}

        {/* Tab 3: Firmware IDE */}
        {activeTab === "firmware" && (
          <div className="h-full w-full overflow-hidden">
            <FirmwareIDE
              projectId={project.id}
              projectName={project.title}
              initialCode={firmwareCode}
              circuitConnections={project.circuit?.connections || []}
              onSave={async (filename, content) => {
                setFirmwareCode(content);
                const res = await fetch(`/api/projects/${id}/firmware`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ filename, content }),
                });
                const data = await res.json();
                if (data.ok) {
                  setExtractedPins(data.extractedPins || extractPinsFromCode(content));
                }
              }}
              onSwitchToCircuitTab={() => setActiveTab("circuit")}
            />
          </div>
        )}

        {/* Tab 4: Pin Mapping & Circuit-to-Firmware Comparison */}
        {activeTab === "comparison" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-mono text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  Circuit-to-Firmware Pin Mapping Cross-Check
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Correlates firmware GPIO configurations with structured Circuit Studio connections.
                </p>

                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                      <tr>
                        <th className="p-2.5 text-zinc-500">Hardware / GPIO Pin</th>
                        <th className="p-2.5 text-zinc-500">Firmware Usage</th>
                        <th className="p-2.5 text-zinc-500">Circuit Studio Connection</th>
                        <th className="p-2.5 text-zinc-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {project.circuit?.connections?.map((conn: any, idx: number) => {
                        const pinName = conn.targetPin || conn.sourcePin;
                        const matchingFw = extractedPins.find(
                          (p) =>
                            p.pin.toLowerCase() === pinName.toLowerCase() ||
                            p.pin.toLowerCase().includes(pinName.toLowerCase())
                        );

                        return (
                          <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                            <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{pinName}</td>
                            <td className="p-2.5 text-zinc-600 dark:text-zinc-400">
                              {matchingFw ? matchingFw.operations.join(", ") : "Not referenced in code"}
                            </td>
                            <td className="p-2.5 text-zinc-600 dark:text-zinc-400">
                              Connected to {conn.sourceComponentId || conn.targetComponentId}
                            </td>
                            <td className="p-2.5">
                              {matchingFw ? (
                                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Matched
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                  <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Unreferenced
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Bill of Materials */}
        {activeTab === "bom" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 font-mono">
                    Bill of Materials (BOM)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Component list and estimated prices in Indian Rupees (₹).
                  </p>
                </div>
                <button
                  onClick={handleExportBomCsv}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                    <tr>
                      <th className="p-3 text-zinc-500">Ref</th>
                      <th className="p-3 text-zinc-500">Component Name</th>
                      <th className="p-3 text-zinc-500">Quantity</th>
                      <th className="p-3 text-zinc-500">Unit Price (₹)</th>
                      <th className="p-3 text-zinc-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {project.bom?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{item.ref}</td>
                        <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.name}
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">
                          {item.unitPriceInr ? `₹${item.unitPriceInr}` : "—"}
                        </td>
                        <td className="p-3 text-zinc-400">{item.notes || "Standard"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
