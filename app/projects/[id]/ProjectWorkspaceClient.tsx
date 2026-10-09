"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { CircuitStudioCanvas } from "@/components/circuits/CircuitStudioCanvas";
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
} from "lucide-react";

export function ProjectWorkspaceClient({ id }: { id: string }) {
  const [project, setProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "circuit" | "firmware" | "comparison" | "bom" | "guide"
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
    a.download = `bom-${project.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-xs text-zinc-400">
          Loading project workspace...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Project Workspace Not Found
          </h2>
          <Link
            href="/projects"
            className="mt-3 text-xs text-cyan-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Navbar />

      {/* Workspace Sub Header */}
      <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            title="Back to workspaces"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {project.title}
            </span>
            <span className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-mono text-cyan-700 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-900/60 font-semibold">
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
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
                  active
                    ? "bg-zinc-100 font-bold text-cyan-700 dark:bg-zinc-800 dark:text-cyan-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Doctor Launcher */}
        <div className="flex items-center gap-2">
          <Link
            href={`/circuit-doctor?board=${encodeURIComponent(project.board)}`}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Diagnose in Doctor</span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
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
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                  <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Build & Assembly Guide
                  </span>
                  <div className="space-y-3 mt-3">
                    {project.plan.buildSteps.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            Step {s.step}: {s.goal}
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300">{s.instructions}</p>
                        {s.outcome && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Outcome: {s.outcome}</span>
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
          <div className="h-full flex flex-col md:flex-row overflow-hidden">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex h-10 items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 dark:border-zinc-800 dark:bg-zinc-900 text-xs shrink-0 font-mono">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  main.ino
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(firmwareCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleSaveFirmware}
                    disabled={isSavingFw}
                    className="flex items-center gap-1 rounded bg-cyan-600 px-2.5 py-1 text-white hover:bg-cyan-500 font-semibold"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingFw ? "Saving..." : "Save Code"}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={firmwareCode}
                onChange={(e) => {
                  setFirmwareCode(e.target.value);
                  setExtractedPins(extractPinsFromCode(e.target.value));
                }}
                className="flex-1 w-full p-4 font-mono text-xs bg-zinc-950 text-zinc-100 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Right Pane: Extracted Pins & Static Analysis */}
            <div className="w-80 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-y-auto shrink-0 text-xs space-y-3">
              <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Extracted Pin References ({extractedPins.length})
              </span>
              <p className="text-[11px] text-zinc-500">
                Deterministic regex pattern analysis of active GPIOs and peripheral calls.
              </p>

              <div className="space-y-2 mt-2">
                {extractedPins.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-600">Pin {p.pin}</span>
                      <span className="text-[10px] text-zinc-400">
                        Line {p.lineNumbers.join(", ")}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-300">
                      Ops: {p.operations.join(" • ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Pin Mapping & Circuit-to-Firmware Comparison */}
        {activeTab === "comparison" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Circuit-to-Firmware Pin Mapping Cross-Check
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Correlates firmware GPIO configurations with structured Circuit Studio connections.
                </p>

                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                      <tr>
                        <th className="p-2.5">Hardware / GPIO Pin</th>
                        <th className="p-2.5">Firmware Usage</th>
                        <th className="p-2.5">Circuit Studio Connection</th>
                        <th className="p-2.5">Status</th>
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
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-cyan-600">{pinName}</td>
                            <td className="p-2.5 text-zinc-600 dark:text-zinc-300">
                              {matchingFw ? matchingFw.operations.join(", ") : "Not referenced in code"}
                            </td>
                            <td className="p-2.5 text-zinc-600 dark:text-zinc-300">
                              Connected to {conn.sourceComponentId || conn.targetComponentId}
                            </td>
                            <td className="p-2.5">
                              {matchingFw ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 className="h-3 w-3" /> Matched
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="h-3 w-3" /> Unreferenced
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
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    Bill of Materials (BOM)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Component list and estimated prices in Indian Rupees (₹).
                  </p>
                </div>
                <button
                  onClick={handleExportBomCsv}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                    <tr>
                      <th className="p-3">Ref</th>
                      <th className="p-3">Component Name</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit Price (₹)</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {project.bom?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-cyan-600">{item.ref}</td>
                        <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.name}
                        </td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3 font-bold">
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
