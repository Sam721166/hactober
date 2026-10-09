"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CircuitStudioCanvas } from "@/components/circuits/CircuitStudioCanvas";
import {
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ListOrdered,
  DollarSign,
  ShieldCheck,
  Save,
  Activity,
  Code2,
  Copy,
  Check,
  Play,
  ExternalLink,
} from "lucide-react";

function ProjectBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [idea, setIdea] = useState(() => searchParams.get("prompt") || "");
  const [board, setBoard] = useState("ESP32");
  const [budgetInr, setBudgetInr] = useState("1500");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [category, setCategory] = useState("IoT");
  const [availableComponents, setAvailableComponents] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"circuit" | "overview" | "wiring" | "firmware" | "steps">("circuit");
  const [isSaving, setIsSaving] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Submit project plan generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsGenerating(true);
    setGeneratedPlan(null);
    setSavedProjectId(null);

    try {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          board,
          budgetInr: budgetInr ? parseInt(budgetInr, 10) : 1500,
          experienceLevel,
          category,
          availableComponents: availableComponents.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setGeneratedPlan(data.plan);
      } else {
        alert(`Generation error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated project to database
  const handleSaveProject = async () => {
    if (!generatedPlan || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedPlan.title,
          description: generatedPlan.overview,
          board,
          category,
          difficulty: experienceLevel,
          budgetInr: budgetInr ? parseInt(budgetInr, 10) : 1500,
          plan: generatedPlan,
          circuit: generatedPlan.circuit,
          firmware: generatedPlan.firmware,
          bom: generatedPlan.bom,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSavedProjectId(data.project.id);
        alert(`Project "${data.project.title}" saved successfully!`);
      }
    } catch (err) {
      alert("Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open in Circuit Studio
  const handleOpenInStudio = () => {
    if (generatedPlan?.circuit) {
      try {
        sessionStorage.setItem(
          "circuitdoctor_temp_circuit",
          JSON.stringify({
            title: generatedPlan.title,
            circuit: generatedPlan.circuit,
          })
        );
      } catch (e) {
        console.warn("Could not cache circuit to sessionStorage:", e);
      }
    }

    if (savedProjectId) {
      router.push(`/projects/${savedProjectId}`);
    } else {
      router.push("/circuit-studio");
    }
  };

  const handleCopyCode = () => {
    if (generatedPlan?.firmware?.content) {
      navigator.clipboard.writeText(generatedPlan.firmware.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Project Builder</h1>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400">
                AI Hardware Architect
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Transform natural language project descriptions into structured hardware plans, schematics, and firmwares.
            </p>
          </div>

          {generatedPlan && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <Save className="h-3.5 w-3.5 text-cyan-600" />
                <span>{savedProjectId ? "Saved" : isSaving ? "Saving..." : "Save to My Projects"}</span>
              </button>

              <button
                onClick={handleOpenInStudio}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Open in Circuit Studio</span>
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Interface: Left Input, Right Generated Guide */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 flex-1">
          {/* Left Column: Requirements Form */}
          <div className="lg:col-span-4">
            <form
              onSubmit={handleGenerate}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4 text-xs"
            >
              <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Hardware Requirements
              </span>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Project Concept / Goal *
                </label>
                <textarea
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. Build an automated plant watering system using an ESP32 with moisture sensor and 5V mini water pump..."
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Target MCU</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="ESP32">ESP32 DevKit V1</option>
                    <option value="Arduino Uno">Arduino Uno R3</option>
                    <option value="Arduino Nano">Arduino Nano V3</option>
                    <option value="Raspberry Pi Pico">Raspberry Pi Pico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="IoT">IoT & Cloud</option>
                    <option value="Robotics">Robotics & Vehicles</option>
                    <option value="Sensors">Sensors & Weather</option>
                    <option value="Home Automation">Home Automation</option>
                    <option value="Audio & Displays">Audio & Displays</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Budget Target (INR ₹)</label>
                  <input
                    type="number"
                    value={budgetInr}
                    onChange={(e) => setBudgetInr(e.target.value)}
                    placeholder="1500"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Difficulty</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Available Components (Optional)
                </label>
                <input
                  type="text"
                  value={availableComponents}
                  onChange={(e) => setAvailableComponents(e.target.value)}
                  placeholder="e.g. DHT22, 0.96 OLED, Breadboard"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <button
                type="submit"
                disabled={!idea.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 font-semibold text-white shadow-md hover:bg-cyan-500 disabled:opacity-50 transition-all text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGenerating ? "Generating Hardware Project..." : "Generate Project Plan"}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Generated Plan View */}
          <div className="lg:col-span-8 flex flex-col">
            {isGenerating ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent mb-4" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Gemma AI Architecting Circuit Design...
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Calculating pin mappings, generating verifiable component connections, writing starter firmware, and structuring step-by-step build guidance.
                </p>
              </div>
            ) : generatedPlan ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex-1 flex flex-col space-y-4">
                {/* Title & Estimated Cost Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800 gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {generatedPlan.title}
                    </h2>
                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">
                      Target: {board} • Cost: {generatedPlan.estimatedCost}
                    </span>
                  </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("circuit")}
                    className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === "circuit"
                        ? "border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Circuit Diagram & Simulation</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "overview"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Overview & BOM
                  </button>
                  <button
                    onClick={() => setActiveTab("wiring")}
                    className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "wiring"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Wiring Table ({generatedPlan.wiringInstructions?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("firmware")}
                    className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "firmware"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Starter Firmware
                  </button>
                  <button
                    onClick={() => setActiveTab("steps")}
                    className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "steps"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Build Steps ({generatedPlan.buildSteps?.length || 0})
                  </button>
                </div>

                {/* Tab: Circuit Diagram & Live Simulation */}
                {activeTab === "circuit" && (
                  <div className="space-y-4">
                    {/* Header Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-cyan-50/70 p-3 border border-cyan-200/80 dark:bg-cyan-950/20 dark:border-cyan-900/60 text-xs">
                      <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200 font-medium">
                        <Activity className="h-4 w-4 text-cyan-600" />
                        <span>Interactive Visual Circuit Diagram & Hardware Simulation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleOpenInStudio}
                          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open in Full Circuit Studio</span>
                        </button>
                      </div>
                    </div>

                    {/* Embedded Circuit Canvas */}
                    <div className="h-[460px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative bg-zinc-50 dark:bg-zinc-950">
                      <CircuitStudioCanvas
                        initialCircuit={generatedPlan.circuit}
                        projectName={generatedPlan.title}
                      />
                    </div>

                    {/* How to Run Project Guidance Card */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                        <span>How to Run & Test Your Project in Circuit Studio:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">1. Connect Pins</span>
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                            Follow the colored jumper wires in the diagram above or check the Pin-to-Pin wiring table. Drag from pin handles to add custom connections.
                          </p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">2. Run Simulation</span>
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                            Click <strong>Run Simulation</strong> in the canvas toolbar. Observe the <strong>LED glow brightly</strong>, the <strong>servo motor rotate</strong>, and the <strong>OLED display stream telemetry</strong>!
                          </p>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">3. Flash Firmware</span>
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                            Open the <strong>Starter Firmware</strong> tab to copy compiled C++ / Arduino code. Flash it via USB with Arduino IDE or ESP-IDF.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Overview & BOM */}
                {activeTab === "overview" && (
                  <div className="space-y-4 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Project Overview
                      </span>
                      <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {generatedPlan.overview}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Problem Being Solved
                        </span>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{generatedPlan.problem}</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Technical Solution
                        </span>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{generatedPlan.solution}</p>
                      </div>
                    </div>

                    {/* BOM Table */}
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Bill of Materials (BOM)
                      </span>
                      <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                            <tr>
                              <th className="p-2">Ref</th>
                              <th className="p-2">Component</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Est. Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {generatedPlan.bom?.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2 text-cyan-600 font-bold">{item.ref}</td>
                                <td className="p-2 text-zinc-800 dark:text-zinc-200">{item.name}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">{item.unitPriceInr ? `₹${item.unitPriceInr}` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Wiring Table */}
                {activeTab === "wiring" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                          <tr>
                            <th className="p-2.5">Source Component & Pin</th>
                            <th className="p-2.5">Target Board & Pin</th>
                            <th className="p-2.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {generatedPlan.wiringInstructions?.map((wire: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-cyan-600">
                                {wire.from} ({wire.pinFrom})
                              </td>
                              <td className="p-2.5 font-bold text-emerald-600">
                                {wire.to} ({wire.pinTo})
                              </td>
                              <td className="p-2.5 text-zinc-500">{wire.note || "Standard jumper wire"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Firmware */}
                {activeTab === "firmware" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {generatedPlan.firmware?.filename || "main.ino"}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 rounded border border-zinc-300 px-2 py-1 text-[11px] font-mono hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>

                    <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-[11px] text-zinc-200 leading-relaxed border border-zinc-800">
                      <code>{generatedPlan.firmware?.content}</code>
                    </pre>

                    {generatedPlan.firmware?.explanation && (
                      <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-xs">
                        {generatedPlan.firmware.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Tab: Build Steps */}
                {activeTab === "steps" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    {generatedPlan.buildSteps?.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            Step {s.step}: {s.goal}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{s.instructions}</p>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Expected Outcome: {s.outcome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                <Sparkles className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Ready to Architect Your Hardware Project
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Enter your project requirements on the left to generate complete circuit schematics, pin mappings, and firmware.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
          <Navbar />
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-400">
            Loading Project Builder...
          </div>
        </div>
      }
    >
      <ProjectBuilderContent />
    </Suspense>
  );
}
