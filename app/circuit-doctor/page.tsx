"use client";

import React, { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Activity,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  FileCode,
  Sparkles,
  ClipboardCheck,
  Save,
  ArrowRight,
  RotateCcw,
  Plus,
} from "lucide-react";

export default function CircuitDoctorPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [boardType, setBoardType] = useState("ESP32");
  const [knownComponents, setKnownComponents] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [firmwareCode, setFirmwareCode] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"hypotheses" | "observations" | "tests">("hypotheses");
  const [testNotes, setTestNotes] = useState<Record<string, string>>({});
  const [testOutcomes, setTestOutcomes] = useState<Record<string, string>>({});
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop / select
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB.");
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setAnalysis(null);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Analysis
  const handleAnalyze = async () => {
    if (!selectedImage) {
      alert("Please upload a circuit photograph first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/doctor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          boardType,
          knownComponents,
          expectedBehavior,
          actualBehavior,
          errorLogs,
          firmwareCode,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setAnalysis(data.analysis);
        setAnalysisError(null);
      } else {
        setAnalysisError(data.error || "Analysis request failed.");
      }
    } catch (err: any) {
      setAnalysisError(`Network error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Record test result for a hypothesis
  const handleRecordTest = (faultId: string, outcome: "Passed" | "Failed" | "Inconclusive") => {
    setTestOutcomes((prev) => ({ ...prev, [faultId]: outcome }));
  };

  // Save investigation to database
  const handleSaveSession = async () => {
    if (!analysis) return;
    try {
      const res = await fetch("/api/doctor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Investigation: ${boardType} - ${new Date().toLocaleDateString()}`,
          boardType,
          imageFileName,
          expectedBehavior,
          actualBehavior,
          errorLogs,
          observations: analysis.visibleObservations,
          hypotheses: analysis.potentialFaults,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedSessionId(data.session.id);
        alert("Diagnostic investigation session saved to database!");
      }
    } catch (err: any) {
      alert("Failed to save session.");
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
                <Activity className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Circuit Doctor</h1>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400">
                Multimodal Hardware Diagnostics
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Upload physical circuit photographs, provide electrical symptoms, and execute evidence-based diagnostic procedures.
            </p>
          </div>

          {analysis && (
            <button
              onClick={handleSaveSession}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <Save className="h-3.5 w-3.5 text-cyan-600" />
              <span>{savedSessionId ? "Saved (#" + savedSessionId.slice(-4) + ")" : "Save Investigation"}</span>
            </button>
          )}
        </div>

        {/* 2-Column Diagnostic Workbench */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 flex-1">
          {/* Left Column: Upload & Context Setup */}
          <div className="lg:col-span-5 space-y-5">
            {/* Image Upload Box */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                1. Circuit Photograph
              </span>

              {selectedImage ? (
                <div className="mt-3 relative rounded-lg border border-zinc-200 overflow-hidden bg-zinc-950 dark:border-zinc-800">
                  <img
                    src={selectedImage}
                    alt="Circuit preview"
                    className="max-h-64 w-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded bg-black/70 px-2 py-1 text-[11px] text-white hover:bg-black"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setAnalysis(null);
                      }}
                      className="rounded bg-rose-600/80 px-2 py-1 text-[11px] text-white hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleImageSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:border-cyan-500 hover:bg-cyan-50/20 dark:border-zinc-700 dark:hover:border-cyan-500"
                >
                  <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Click to upload or drag circuit photo here
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    Supports high-resolution JPEG, PNG, WebP (Max 10MB)
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
                }}
              />
            </div>

            {/* Circuit Technical Context */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3 text-xs">
              <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                2. Technical Context (Optional but Recommended)
              </span>

              <div>
                <label className="text-[11px] font-medium text-zinc-500">Board / Microcontroller</label>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="ESP32">ESP32 DevKit V1 (3.3V Logic)</option>
                  <option value="Arduino Uno">Arduino Uno R3 (5V Logic)</option>
                  <option value="Arduino Nano">Arduino Nano V3 (5V Logic)</option>
                  <option value="Raspberry Pi Pico">Raspberry Pi Pico (3.3V Logic)</option>
                  <option value="Custom Board">Other / Custom Prototype</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-500">Known Connected Components</label>
                <input
                  type="text"
                  value={knownComponents}
                  onChange={(e) => setKnownComponents(e.target.value)}
                  placeholder="e.g. DHT22 sensor on GPIO 4, SSD1306 OLED, 5V Relay"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500">Expected Behavior</label>
                  <textarea
                    rows={2}
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    placeholder="e.g. OLED shows temperature"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-500">Actual Behavior / Failure</label>
                  <textarea
                    rows={2}
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    placeholder="e.g. Screen blank, board runs hot"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-500">Firmware Code or Serial Error Log</label>
                <textarea
                  rows={3}
                  value={firmwareCode}
                  onChange={(e) => setFirmwareCode(e.target.value)}
                  placeholder="Paste snippet of setup(), pinMode(), or terminal error logs..."
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2 font-mono text-[11px] dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 font-semibold text-white shadow-md hover:bg-cyan-500 disabled:opacity-50 transition-all text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isAnalyzing ? "Analyzing Circuit Photograph..." : "Run Circuit Doctor Diagnostics"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Evidence-Based Analysis & Diagnostic Procedure */}
          <div className="lg:col-span-7 flex flex-col">
            {isAnalyzing ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent mb-4" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Gemini Vision Analyzing Circuit Topology...
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Detecting components, tracing visible wire routes, identifying power rails, and formulating testable hypotheses.
                </p>
              </div>
            ) : analysis ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex-1 flex flex-col space-y-4">
                {/* Summary Banner */}
                <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3.5 text-xs dark:border-cyan-900/60 dark:bg-cyan-950/30">
                  <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold">
                    <Activity className="h-4 w-4" />
                    <span>Diagnostic Overview</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {analysis.summary}
                  </p>
                </div>

                {/* Safety Warning if present */}
                {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Hardware Safety Precaution:</span>
                      <p className="mt-0.5">{analysis.safetyWarnings[0]}</p>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs">
                  <button
                    onClick={() => setActiveTab("hypotheses")}
                    className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
                      activeTab === "hypotheses"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Potential Faults & Tests ({analysis.potentialFaults?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("observations")}
                    className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
                      activeTab === "observations"
                        ? "border-cyan-600 text-cyan-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    Visible Observations ({analysis.visibleObservations?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Potential Faults with Interactive Tests */}
                {activeTab === "hypotheses" && (
                  <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                    {analysis.potentialFaults.map((fault: any, index: number) => {
                      const outcome = testOutcomes[fault.id];
                      return (
                        <div
                          key={fault.id || index}
                          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {fault.title}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                fault.confidence === "High"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                  : fault.confidence === "Medium"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                              }`}
                            >
                              {fault.confidence} Confidence
                            </span>
                          </div>

                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {fault.explanation}
                          </p>

                          <div className="rounded-lg bg-white p-2.5 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 space-y-1.5 font-mono text-[11px]">
                            <div>
                              <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                                Recommended Diagnostic Test:
                              </span>
                              <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
                                {fault.recommendedTest}
                              </p>
                            </div>
                            <div>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                Expected Result:
                              </span>
                              <p className="text-zinc-800 dark:text-zinc-200 mt-0.5">
                                {fault.expectedResult}
                              </p>
                            </div>
                          </div>

                          {/* Interactive User Test Result Recorder */}
                          <div className="border-t border-zinc-200 pt-2.5 dark:border-zinc-800 flex items-center justify-between">
                            <span className="font-mono text-[11px] text-zinc-500 font-medium">
                              Record Multimeter / Test Result:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRecordTest(fault.id, "Passed")}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                                  outcome === "Passed"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                Passed
                              </button>
                              <button
                                onClick={() => handleRecordTest(fault.id, "Failed")}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                                  outcome === "Failed"
                                    ? "bg-rose-600 text-white border-rose-600"
                                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                Failed
                              </button>
                              <button
                                onClick={() => handleRecordTest(fault.id, "Inconclusive")}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                                  outcome === "Inconclusive"
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                Inconclusive
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: Visible Observations */}
                {activeTab === "observations" && (
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {analysis.visibleObservations?.map((obs: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {obs.description}
                          </span>
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[9px] font-mono text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                            {obs.confidence} Evidence
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500 font-mono">
                          Evidence: {obs.evidence}
                        </p>
                      </div>
                    ))}

                    <div className="pt-2">
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Identified Components
                      </span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {analysis.identifiedComponents?.map((comp: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded border border-zinc-200 bg-white p-2 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {comp.name}
                            </span>
                            <span className="block text-[10px] text-cyan-600 mt-0.5">
                              Status: {comp.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : analysisError ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/50 p-8 text-center text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400 mb-3" />
                <h3 className="text-sm font-bold tracking-tight">AI Vision Service Notice</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-1.5 max-w-md leading-relaxed">
                  {analysisError}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Analysis</span>
                  </button>
                  <button
                    onClick={() => setAnalysisError(null)}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Ready for Circuit Diagnosis
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Upload a photo of your hardware setup on the left to begin an evidence-based troubleshooting investigation.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
