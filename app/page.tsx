"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import {
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Code2,
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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900/60 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-400 mb-6">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>AI Hardware Engineering Platform</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-zinc-900 dark:text-zinc-50">
            From an idea to a{" "}
            <span className="text-cyan-600 dark:text-cyan-400">working circuit.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Build hardware projects from scratch, design circuits visually, and troubleshoot
            real-world problems with an AI-powered engineering workspace.
          </p>

          {/* Prompt Input Form */}
          <form
            onSubmit={handleStartBuilding}
            className="mx-auto mt-8 max-w-2xl rounded-2xl border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800/90 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              placeholder="I want to build a smart irrigation system using an ESP32..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
            >
              <span>Start building</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <Link
              href="/discover"
              className="font-semibold text-zinc-600 hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-400 flex items-center gap-1"
            >
              <span>Explore sample projects</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Primary Pillars Showcase */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              The Three Core Experiences
            </h2>
            <p className="mt-2 text-xs text-zinc-500 max-w-lg mx-auto">
              CircuitDoctor unifies the entire embedded development cycle from ideation to diagnosis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Feature 1: Circuit Doctor */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Circuit Doctor
                </h3>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Upload a circuit photograph, inspect visible components, trace wires, and receive evidence-based diagnostic tests with expected multimeter readings.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/circuit-doctor"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400"
                >
                  <span>Launch Doctor</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Project Builder */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Project Builder
                </h3>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Describe a hardware project in natural language and receive a structured guide with BOM, pin-to-pin wiring instructions, compilable starter firmware, and step-by-step assembly steps.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                >
                  <span>Build with AI</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Circuit Studio */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Circuit Studio
                </h3>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Design, connect, and inspect circuits on an interactive canvas with custom component nodes, named pins, live wire validation, and automated design rule checks.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/circuit-studio"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400"
                >
                  <span>Open Studio Canvas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hardware Projects from Database */}
      <section className="py-16 bg-white dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Featured Hardware Projects
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Real, tested reference architectures seeded directly in PostgreSQL.
              </p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-500 flex items-center gap-1"
            >
              <span>View all projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-600">
                      {p.board}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">{p.difficulty}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                    ₹{p.budgetInr}
                  </span>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-500"
                  >
                    Open Workspace →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Bridge Section */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            How the CircuitDoctor Workflow Connects
          </h2>
          <p className="mt-2 text-xs text-zinc-500 max-w-md mx-auto">
            From initial prompt to physical hardware verification.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-cyan-600">01. Architecture</span>
              <h4 className="mt-1 font-bold text-xs text-zinc-800 dark:text-zinc-200">Project Builder</h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                Define idea, budget, and MCU to generate full wiring schematics and starter code.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-purple-600">02. Design</span>
              <h4 className="mt-1 font-bold text-xs text-zinc-800 dark:text-zinc-200">Circuit Studio</h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                Inspect node pins, adjust wire connections, and verify design warnings.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-emerald-600">03. Assembly</span>
              <h4 className="mt-1 font-bold text-xs text-zinc-800 dark:text-zinc-200">Physical Build</h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                Follow the step-by-step build guide and flash generated firmware.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="font-mono text-xs font-bold text-rose-600">04. Diagnosis</span>
              <h4 className="mt-1 font-bold text-xs text-zinc-800 dark:text-zinc-200">Circuit Doctor</h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                Photograph any malfunctioning board to pinpoint wiring errors or inverted rails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-900 text-center text-xs text-zinc-500">
        <p className="font-mono">
          CircuitDoctor • Build it. Debug it. Learn it. • Powered by Google AI Studio (Gemma & Gemini) & PostgreSQL.
        </p>
      </footer>
    </div>
  );
}
