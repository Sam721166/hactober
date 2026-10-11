"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Columns2,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  Gauge,
  Wifi,
  Share2,
} from "lucide-react";

export function ProjectWorkspaceClient({ id }: { id: string }) {
  const [project, setProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "circuit" | "firmware" | "comparison" | "bom" | "split"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);

  // Firmware editor state
  const [firmwareCode, setFirmwareCode] = useState("");
  const [extractedPins, setExtractedPins] = useState<ExtractedPin[]>([]);
  const [isSavingFw, setIsSavingFw] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Inline rename state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Build step checklist progress
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Read initial tab from URL query params if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["overview", "circuit", "firmware", "comparison", "bom", "split"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.ok) {
          setProject(data.project);
          setEditableTitle(data.project.title);
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

  // Save inline title rename
  const handleSaveTitle = async () => {
    if (!editableTitle.trim() || editableTitle === project?.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editableTitle.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setProject((prev: any) => ({ ...prev, title: editableTitle.trim() }));
      }
    } catch (err) {
      console.warn("Failed to rename project:", err);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  // Save circuit
  const handleSaveCircuit = async (circuitData: {
    components: any[];
    connections: any[];
  }) => {
    try {
      const res = await fetch(`/api/projects/${id}/circuit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circuitData),
      });
      const data = await res.json();
      if (data.ok) {
        setProject((prev: any) => ({ ...prev, circuit: circuitData }));
      }
    } catch (err) {
      console.error("Failed to save circuit:", err);
    }
  };

  // Toggle assembly step checklist
  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
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

  // Export Full Hardware Project Bundle
  const handleExportFullBundle = () => {
    const bundle = {
      project: {
        id: project.id,
        title: project.title,
        board: project.board,
        category: project.category,
        difficulty: project.difficulty,
        budgetInr: project.budgetInr,
        exportedAt: new Date().toISOString(),
      },
      circuit: project.circuit,
      firmware: {
        filename: "main.ino",
        content: firmwareCode,
        extractedPins,
      },
      bom: project.bom,
      plan: project.plan,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug || id}-hardware-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Microcontroller specs profile
  const mcuSpecs = useMemo(() => {
    const b = (project?.board || "").toLowerCase();
    if (b.includes("esp32")) {
      return {
        arch: "Xtensa® 32-bit LX6 Dual-Core @ 240MHz",
        voltage: "3.3V Logic (5V USB Power)",
        pins: "36 GPIO Pins (18 ADC, 2 DAC, PWM on all GPIO)",
        connectivity: "Wi-Fi 802.11 b/g/n + Bluetooth v4.2 BR/EDR & BLE",
        flash: "4MB SPI Flash Memory",
      };
    }
    if (b.includes("uno")) {
      return {
        arch: "Microchip ATmega328P 8-bit AVR @ 16MHz",
        voltage: "5.0V Logic (7-12V Input Jack)",
        pins: "14 Digital I/O (6 PWM) + 6 Analog Inputs",
        connectivity: "USB Type-B Serial UART (115200 Baud)",
        flash: "32KB Flash Memory (0.5KB Bootloader)",
      };
    }
    if (b.includes("pico")) {
      return {
        arch: "Raspberry Pi RP2040 Dual ARM Cortex-M0+ @ 133MHz",
        voltage: "3.3V Logic (Micro-USB 5V)",
        pins: "26 Multi-function GPIO Pins (3 Analog 12-bit ADC)",
        connectivity: "USB 1.1 Host/Device + 8 Programmable I/O (PIO)",
        flash: "2MB On-board QSPI Flash",
      };
    }
    return {
      arch: "Embedded Microcontroller",
      voltage: "3.3V / 5.0V Standard Logic",
      pins: "Standard Digital & Analog I/O",
      connectivity: "UART Serial Interface",
      flash: "Internal Flash Memory",
    };
  }, [project?.board]);

  // Calculate pin matching stats
  const pinStats = useMemo(() => {
    const conns = project?.circuit?.connections || [];
    let matched = 0;
    let unreferenced = 0;
    conns.forEach((c: any) => {
      const pinName = c.targetPin || c.sourcePin || "";
      const found = extractedPins.some(
        (p) =>
          p.pin.toLowerCase() === pinName.toLowerCase() ||
          p.pin.toLowerCase().includes(pinName.toLowerCase())
      );
      if (found) matched++;
      else unreferenced++;
    });
    return { matched, unreferenced, total: conns.length };
  }, [project?.circuit?.connections, extractedPins]);

  // Calculate total BOM cost
  const totalBomCost = useMemo(() => {
    if (!project?.bom || !Array.isArray(project.bom)) return 0;
    return project.bom.reduce(
      (sum: number, item: any) => sum + (item.unitPriceInr || 0) * (item.quantity || 1),
      0
    );
  }, [project?.bom]);

  // Step completion percentage
  const stepsCount = project?.plan?.buildSteps?.length || 0;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const stepPercentage = stepsCount > 0 ? Math.round((completedCount / stepsCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-xs text-zinc-400 font-mono">
        <Loader2 className="h-6 w-6 animate-spin mb-2 text-sky-500" />
        <span>Loading workspace hardware models...</span>
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
      {/* Workspace Header Strip */}
      <div className="flex h-13 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0 gap-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/projects"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Back to all workspaces"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                className="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="p-1 text-emerald-600 hover:text-emerald-700"
                title="Save title"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-mono text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100 truncate">
                {project.title}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                title="Rename workspace"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <span className="hidden sm:inline-flex rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 font-semibold shrink-0">
                {project.board}
              </span>
            </div>
          )}
        </div>

        {/* Center: Modern Segmented Mode Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-950/80 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-x-auto text-xs shrink-0">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "circuit", label: "Circuit Studio", icon: Cpu },
            { id: "firmware", label: "Firmware IDE", icon: FileCode },
            {
              id: "split",
              label: "Split View",
              icon: Columns2,
              badge: "Studio+IDE",
            },
            {
              id: "comparison",
              label: "Pin Map",
              icon: Radio,
              badge: pinStats.total > 0 ? `${pinStats.matched}/${pinStats.total}` : undefined,
            },
            {
              id: "bom",
              label: "BOM",
              icon: DollarSign,
              badge: totalBomCost > 0 ? `₹${totalBomCost}` : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all whitespace-nowrap ${
                  active
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold shadow-xs ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-sky-500" : ""}`} />
                <span className="hidden md:inline">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                      active
                        ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 font-bold"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Doctor & Export Bundle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportFullBundle}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs transition-colors"
            title="Download complete hardware JSON bundle"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Bundle</span>
          </button>

          <Link
            href={`/circuit-doctor?board=${encodeURIComponent(project.board)}`}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors shadow-2xs"
          >
            <Activity className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Doctor</span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="mx-auto max-w-5xl space-y-6">
              {/* Top Banner: Project Summary + Hardware Spec Profile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Description Card */}
                <div className="md:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Workspace Description
                    </span>
                    <span className="rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-mono font-semibold px-2 py-0.5">
                      {project.category || "IoT"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {project.description}
                  </p>
                  {project.plan?.overview && (
                    <p className="text-xs leading-relaxed text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      {project.plan.overview}
                    </p>
                  )}

                  {/* Quick Action Shortcuts */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab("split")}
                      className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Columns2 className="h-3.5 w-3.5" />
                      <span>Launch Split-Screen Studio</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("circuit")}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs transition-colors"
                    >
                      <Cpu className="h-3.5 w-3.5 text-sky-500" />
                      <span>Schematic Canvas</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("firmware")}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs transition-colors"
                    >
                      <FileCode className="h-3.5 w-3.5 text-violet-500" />
                      <span>Firmware IDE</span>
                    </button>
                  </div>
                </div>

                {/* Target Hardware Specs Profile */}
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>MCU Specs</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{project.board}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-400">Architecture:</span>
                        <p className="text-zinc-800 dark:text-zinc-200 font-semibold mt-0.5">
                          {mcuSpecs.arch}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Logic Voltage:</span>
                        <p className="text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                          {mcuSpecs.voltage}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Pin Capacity:</span>
                        <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">{mcuSpecs.pins}</p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Connectivity:</span>
                        <p className="text-sky-700 dark:text-sky-400 mt-0.5">{mcuSpecs.connectivity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>{project.circuit?.components?.length || 0} Parts wired</span>
                    <span>{project.circuit?.connections?.length || 0} Nets</span>
                  </div>
                </div>
              </div>

              {/* Build Steps Checklist with Live Progress */}
              {project.plan?.buildSteps && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h3 className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100 uppercase tracking-wider">
                        Hardware Assembly & Build Milestones
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Interactive checklist to guide hardware assembly and sensor bring-up.
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${stepPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {completedCount}/{stepsCount} Done ({stepPercentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {project.plan.buildSteps.map((s: any, idx: number) => {
                      const isDone = Boolean(completedSteps[s.step]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(s.step)}
                          className={`cursor-pointer rounded-lg border p-4 text-xs transition-all flex items-start gap-3 ${
                            isDone
                              ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 opacity-80"
                              : "border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70"
                          }`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <div className="h-4 w-4 rounded border border-zinc-300 dark:border-zinc-600" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  isDone
                                    ? "text-emerald-800 dark:text-emerald-300 line-through"
                                    : "text-zinc-950 dark:text-zinc-100"
                                }`}
                              >
                                STEP {s.step}: {s.goal}
                              </span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {s.instructions}
                            </p>
                            {s.outcome && (
                              <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] pt-1 flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  Outcome:
                                </span>
                                <span>{s.outcome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
              key={`studio-${project.id}`}
              initialCircuit={project.circuit}
              projectId={project.id}
              projectName={project.title}
              onSave={handleSaveCircuit}
              allowSimulation={true}
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
              initialFiles={project.firmwares?.map((f: any) => ({ name: f.filename, content: f.content, isModified: false }))}
              circuitConnections={project.circuit?.connections || []}
              onSave={async (filename, content) => {
                if (filename === "main.ino") {
                  setFirmwareCode(content);
                }
                const res = await fetch(`/api/projects/${id}/firmware`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ filename, content }),
                });
                const data = await res.json();
                if (data.ok) {
                  if (!project.firmwares) project.firmwares = [];
                  const existing = project.firmwares.find((f: any) => f.filename === filename);
                  if (existing) {
                    existing.content = content;
                  } else {
                    project.firmwares.push({ id: filename, filename, content });
                  }
                  if (filename === "main.ino") {
                    setExtractedPins(data.extractedPins || extractPinsFromCode(content));
                  }
                }
              }}
              onSwitchToCircuitTab={() => setActiveTab("circuit")}
            />
          </div>
        )}

        {/* Tab 4: Split-Screen View (Circuit Schematic + Firmware Code) */}
        {activeTab === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
            {/* Left 50%: Interactive Circuit Schematic */}
            <div className="h-[50vh] lg:h-full w-full overflow-hidden flex flex-col">
              <div className="flex h-9 items-center justify-between px-3 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono shrink-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-sky-500" />
                  <span>Interactive Schematic</span>
                </span>
                <span className="text-zinc-400">Live Simulation</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <CircuitStudioCanvas
                  key={`split-canvas-${project.id}`}
                  initialCircuit={project.circuit}
                  projectId={project.id}
                  projectName={project.title}
                  diagramOnly={true}
                  allowSimulation={true}
                  onSave={handleSaveCircuit}
                />
              </div>
            </div>

            {/* Right 50%: Firmware IDE */}
            <div className="h-[50vh] lg:h-full w-full overflow-hidden flex flex-col">
              <div className="flex h-9 items-center justify-between px-3 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono shrink-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-violet-500" />
                  <span>Firmware IDE</span>
                </span>
                <span className="text-zinc-400 font-mono">
                  {extractedPins.length} GPIOs Referenced
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <FirmwareIDE
                  projectId={project.id}
                  projectName={project.title}
                  initialCode={firmwareCode}
                  initialFiles={project.firmwares?.map((f: any) => ({ name: f.filename, content: f.content, isModified: false }))}
                  circuitConnections={project.circuit?.connections || []}
                  onSave={async (filename, content) => {
                    if (filename === "main.ino") {
                      setFirmwareCode(content);
                    }
                    const res = await fetch(`/api/projects/${id}/firmware`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ filename, content }),
                    });
                    const data = await res.json();
                    if (data.ok) {
                      if (!project.firmwares) project.firmwares = [];
                      const existing = project.firmwares.find((f: any) => f.filename === filename);
                      if (existing) {
                        existing.content = content;
                      } else {
                        project.firmwares.push({ id: filename, filename, content });
                      }
                      if (filename === "main.ino") {
                        setExtractedPins(data.extractedPins || extractPinsFromCode(content));
                      }
                    }
                  }}
                  onSwitchToCircuitTab={() => setActiveTab("circuit")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Pin Mapping Cross-Check */}
        {activeTab === "comparison" && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      Circuit-to-Firmware Pin Mapping Cross-Check
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Correlates firmware GPIO configurations with structured Circuit Studio connections.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> {pinStats.matched} Matched
                    </span>
                    {pinStats.unreferenced > 0 && (
                      <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" /> {pinStats.unreferenced} Unreferenced
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                      <tr>
                        <th className="p-2.5 text-zinc-500">Hardware / GPIO Pin</th>
                        <th className="p-2.5 text-zinc-500">Firmware Usage</th>
                        <th className="p-2.5 text-zinc-500">Circuit Studio Connection</th>
                        <th className="p-2.5 text-zinc-500">Cross-Check Status</th>
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

        {/* Tab 6: Bill of Materials */}
        {activeTab === "bom" && (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 font-mono">
                    Bill of Materials (BOM)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Component list and estimated prices in Indian Rupees (₹). Total:{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{totalBomCost}
                    </span>
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

              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                    <tr>
                      <th className="p-3 text-zinc-500">Ref</th>
                      <th className="p-3 text-zinc-500">Component Name</th>
                      <th className="p-3 text-zinc-500">Quantity</th>
                      <th className="p-3 text-zinc-500">Unit Price (₹)</th>
                      <th className="p-3 text-zinc-500">Subtotal</th>
                      <th className="p-3 text-zinc-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {project.bom?.map((item: any, idx: number) => {
                      const qty = item.quantity || 1;
                      const price = item.unitPriceInr || 0;
                      const subtotal = qty * price;
                      return (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                          <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{item.ref}</td>
                          <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.name}
                          </td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-400">{qty}</td>
                          <td className="p-3 font-mono text-zinc-700 dark:text-zinc-300">
                            {price > 0 ? `₹${price}` : "—"}
                          </td>
                          <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">
                            {subtotal > 0 ? `₹${subtotal}` : "—"}
                          </td>
                          <td className="p-3 text-zinc-400">{item.notes || "Standard"}</td>
                        </tr>
                      );
                    })}
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
