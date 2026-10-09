"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Cpu,
  Activity,
  ArrowRight,
  Layers,
  CheckCircle2,
  Package,
  FolderKanban,
  Zap,
  Terminal,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [projectInput, setProjectInput] = useState("");
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSamples() {
      try {
        const res = await fetch("/api/projects?isSample=true");
        const data = await res.json();
        if (data.ok && data.projects) {
          setFeaturedProjects(data.projects.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch sample projects:", err);
      }
    }
    fetchSamples();
  }, []);

  const handleStartBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectInput.trim()) {
      router.push(`/builder?prompt=${encodeURIComponent(projectInput.trim())}`);
    } else {
      router.push("/builder");
    }
  };

  const samplePrompts = [
    "ESP32 Smart Irrigation with soil moisture sensor & relay pump",
    "Arduino Uno OLED weather station with DHT22 & I2C display",
    "Raspberry Pi Pico robotic arm with servo controllers",
  ];

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        {/* Top Hero Section */}
        <section className="space-y-6 pt-4">
          <div className="flex flex-col space-y-2">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-mono font-medium text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <span>CIRCUITDOCTOR • AI HARDWARE WORKSPACE</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-zinc-950 dark:text-zinc-50">
              From an idea to a working circuit.
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Design embedded systems, simulate circuits visually, and troubleshoot real-world physical electronics with an AI engineering suite powered by Google Gemma open models.
            </p>
          </div>

          {/* Quick Natural Language Prompt Bar */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <form onSubmit={handleStartBuilding} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  placeholder="Describe your project: e.g. Build an ESP32 soil moisture monitor with OLED..."
                  className="w-full rounded-lg bg-zinc-50 py-2.5 pl-10 pr-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100 dark:focus:ring-zinc-100"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all shrink-0"
              >
                <span>Build with AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500">
              <span className="font-mono text-zinc-400">Try prompts:</span>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setProjectInput(p)}
                  className="rounded-md border border-zinc-200 bg-zinc-50/70 px-2 py-0.5 text-left text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  {p.split(" with ")[0]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Metric Insights Strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Core Engines
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              3 Tools
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Builder, Studio & Doctor
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Verification
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              Pin DRC
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Automated electrical rule checks
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Diagnostics
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              Vision AI
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Multimeter test predictions
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Storage Layer
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              PostgreSQL
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Persistent workspaces & sessions
            </p>
          </div>
        </section>

        {/* Three Core Pillars Cards */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              The Three Core Engineering Experiences
            </h2>
            <p className="text-xs text-zinc-500">
              Everything needed to take embedded hardware from concept to functional reality.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Feature 1: Project Builder */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 mb-4">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    Project Builder
                  </h3>
                  <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    AI Architect
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Provide an idea, budget, and MCU to generate complete Bill of Materials, pin-to-pin wiring schematics, and compilable starter firmware.
                </p>

                <div className="mt-4 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Cost-optimized BOM (INR ₹)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Firmware with pin assignments</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/builder"
                  className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all"
                >
                  <span>Launch Builder</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Circuit Studio */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 mb-4">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    Circuit Studio
                  </h3>
                  <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Visual Canvas
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Design node schematics, connect verified pins, monitor live rail voltages, and run circuit simulations with real-time serial monitor outputs.
                </p>

                <div className="mt-4 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Named pins & electrical DRC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Real-time hardware simulation</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/circuit-studio"
                  className="flex items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <span>Open Studio Canvas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Circuit Doctor */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 mb-4">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    Circuit Doctor
                  </h3>
                  <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    Diagnostics
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Upload a photo of your malfunctioning breadboard or PCB. Receive hypothesis test steps with expected multimeter readings to isolate faults.
                </p>

                <div className="mt-4 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Visual wiring error detection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-zinc-900 dark:text-zinc-100" />
                    <span>Multimeter expected DC voltages</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/circuit-doctor"
                  className="flex items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <span>Run Circuit Doctor</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Tested Hardware Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
                Featured Reference Projects
              </h2>
              <p className="text-xs text-zinc-500">
                Tested hardware architectures stored directly in PostgreSQL.
              </p>
            </div>
            <Link
              href="/discover"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
            >
              <span>View all projects</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featuredProjects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {p.board}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {p.difficulty}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-950 dark:text-zinc-100">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{p.budgetInr}
                  </span>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Roadmap */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              Four-Phase Engineering Lifecycle
            </h2>
            <p className="text-xs text-zinc-500">
              How the tools integrate to support your embedded development journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                01. Architecture
              </span>
              <h4 className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Project Builder
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Define idea, budget & MCU to generate pin-to-pin wiring and starter firmware.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                02. Design
              </span>
              <h4 className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Circuit Studio
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Connect node pins visually, verify DRC warnings, and simulate firmware logic.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                03. Assembly
              </span>
              <h4 className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Physical Build
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Follow step-by-step instructions and flash generated firmware to physical MCU.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                04. Diagnosis
              </span>
              <h4 className="mt-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Circuit Doctor
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Photograph malfunctioning hardware to isolate faulty wires or rail inversions.
              </p>
            </div>
          </div>
        </section>

        {/* Clean Footer */}
        <footer className="pt-6 pb-4 border-t border-zinc-200 text-center text-xs text-zinc-400 font-mono dark:border-zinc-800">
          CircuitDoctor AI Suite • Engineered with Google Gemma & PostgreSQL • Clean Minimal System
        </footer>
      </main>
    </div>
  );
}
