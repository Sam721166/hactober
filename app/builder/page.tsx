"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Save,
  Activity,
  Code2,
  Copy,
  Check,
  Play,
  ExternalLink,
  ShieldCheck,
  Loader2,
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
        alert(`Project "${data.project.title}" saved successfully to your workspaces!`);
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
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Page Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Project Builder
              </h1>
              <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                AI Hardware Architect
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Transform natural language project descriptions into structured BOM, pin-to-pin wiring, and starter firmware.
            </p>
          </div>

          {generatedPlan && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <Save className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>{savedProjectId ? "Saved" : isSaving ? "Saving..." : "Save to Workspaces"}</span>
              </button>

              <button
                onClick={handleOpenInStudio}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Open in Circuit Studio</span>
              </button>
            </div>
          )}
        </div>

        {/* 2-Column Interface: Left Input, Right Generated Guide */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Requirements Form */}
          <div className="lg:col-span-4">
            <form
              onSubmit={handleGenerate}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Project Parameters
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Gemma 4</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Project Concept / Goal *
                </label>
                <textarea
                  required
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. Build an automated plant watering system using an ESP32 with moisture sensor and 5V mini water pump..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 p-2.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Target MCU</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="ESP32">ESP32 DevKit V1</option>
                    <option value="Arduino Uno">Arduino Uno R3</option>
                    <option value="Arduino Nano">Arduino Nano V3</option>
                    <option value="Raspberry Pi Pico">Raspberry Pi Pico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Budget Target (INR ₹)</label>
                  <input
                    type="number"
                    value={budgetInr}
                    onChange={(e) => setBudgetInr(e.target.value)}
                    placeholder="1500"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Difficulty</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Available Components (Optional)
                </label>
                <input
                  type="text"
                  value={availableComponents}
                  onChange={(e) => setAvailableComponents(e.target.value)}
                  placeholder="e.g. DHT22, 0.96 OLED, Breadboard"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={!idea.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all text-xs dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Architecting Circuit...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Project Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Generated Plan View */}
          <div className="lg:col-span-8 flex flex-col">
            {isGenerating ? (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-100 mb-4" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Gemma AI Architecting Circuit Design...
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Calculating pin mappings, generating verified component connections, writing starter firmware, and structuring step-by-step build guidance.
                </p>
              </div>
            ) : generatedPlan ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex-1 flex flex-col space-y-4">
                {/* Title & Estimated Cost Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
                      {generatedPlan.title}
                    </h2>
                    <span className="font-mono text-xs text-zinc-500">
                      Target: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{board}</span> • Cost: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{generatedPlan.estimatedCost}</span>
                    </span>
                  </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs overflow-x-auto gap-1">
                  <button
                    onClick={() => setActiveTab("circuit")}
                    className={`py-2 px-3 font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === "circuit"
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Circuit Diagram & Simulation</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`py-2 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "overview"
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Overview & BOM
                  </button>
                  <button
                    onClick={() => setActiveTab("wiring")}
                    className={`py-2 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "wiring"
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Wiring Table ({generatedPlan.wiringInstructions?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("firmware")}
                    className={`py-2 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "firmware"
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Starter Firmware
                  </button>
                  <button
                    onClick={() => setActiveTab("steps")}
                    className={`py-2 px-3 font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === "steps"
                        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Build Steps ({generatedPlan.buildSteps?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Circuit Diagram & Live Simulation */}
                {activeTab === "circuit" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2.5 border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Interactive Visual Circuit Diagram & Hardware Simulation</span>
                      </div>
                      <button
                        onClick={handleOpenInStudio}
                        className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all self-start sm:self-auto"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Full Studio Canvas</span>
                      </button>
                    </div>

                    <div className="h-[460px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-50 dark:bg-zinc-950">
                      <CircuitStudioCanvas
                        initialCircuit={generatedPlan.circuit}
                        projectName={generatedPlan.title}
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Overview & BOM */}
                {activeTab === "overview" && (
                  <div className="space-y-4 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Project Overview
                      </span>
                      <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {generatedPlan.overview}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Problem Being Solved
                        </span>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">{generatedPlan.problem}</p>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Technical Solution
                        </span>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">{generatedPlan.solution}</p>
                      </div>
                    </div>

                    {/* BOM Table */}
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Bill of Materials (BOM)
                      </span>
                      <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                            <tr>
                              <th className="p-2.5 text-zinc-500">Ref</th>
                              <th className="p-2.5 text-zinc-500">Component</th>
                              <th className="p-2.5 text-zinc-500">Qty</th>
                              <th className="p-2.5 text-zinc-500">Est. Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {generatedPlan.bom?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{item.ref}</td>
                                <td className="p-2.5 text-zinc-700 dark:text-zinc-300">{item.name}</td>
                                <td className="p-2.5 text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                                <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">{item.unitPriceInr ? `₹${item.unitPriceInr}` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Wiring Table */}
                {activeTab === "wiring" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                          <tr>
                            <th className="p-2.5 text-zinc-500">Source Component & Pin</th>
                            <th className="p-2.5 text-zinc-500">Target Board & Pin</th>
                            <th className="p-2.5 text-zinc-500">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {generatedPlan.wiringInstructions?.map((wire: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                              <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                                {wire.from} ({wire.pinFrom})
                              </td>
                              <td className="p-2.5 font-bold text-zinc-700 dark:text-zinc-300">
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

                {/* Tab 4: Firmware */}
                {activeTab === "firmware" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {generatedPlan.firmware?.filename || "main.ino"}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-mono hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>

                    <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-[11px] text-zinc-200 leading-relaxed border border-zinc-800">
                      <code>{generatedPlan.firmware?.content}</code>
                    </pre>

                    {generatedPlan.firmware?.explanation && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                        {generatedPlan.firmware.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 5: Build Steps */}
                {activeTab === "steps" && (
                  <div className="space-y-3 text-xs overflow-y-auto max-h-[600px] pr-1">
                    {generatedPlan.buildSteps?.map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-zinc-950 dark:text-zinc-100 font-mono">
                            STEP {s.step}: {s.goal}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{s.instructions}</p>
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] pt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                          <span>Expected Outcome: {s.outcome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                <Sparkles className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Ready to Architect Your Hardware Project
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Enter your requirements on the left to generate complete circuit schematics, pin mappings, and firmware.
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
