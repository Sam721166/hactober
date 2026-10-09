"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  Cpu,
  ArrowRight,
  Sparkles,
  Zap,
  Tag,
  Activity,
  Compass,
  Loader2,
  X,
} from "lucide-react";

export default function DiscoverProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [board, setBoard] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // AI Idea Generator state
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [interests, setInterests] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (board !== "all") params.set("board", board);
        if (difficulty !== "all") params.set("difficulty", difficulty);
        if (search) params.set("search", search);

        const res = await fetch(`/api/projects?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, [category, board, difficulty, search]);

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingIdeas(true);
    try {
      const res = await fetch("/api/builder/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests }),
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedIdeas(data.ideas);
      }
    } catch (err) {
      alert("Failed to generate ideas.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950">
                <Compass className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Project Library
              </h1>
              <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                Seeded Reference Hardware
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Explore genuine open-source hardware architectures with verified wiring, pin mappings, and starter firmwares.
            </p>
          </div>

          <button
            onClick={() => setShowIdeaModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-violet-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-violet-100 transition-all self-start sm:self-auto ring-1 ring-violet-500/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-400 dark:text-violet-600" />
            <span>AI Idea Generator</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, sensor, actuator..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 font-mono"
            />
          </div>

          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 font-mono"
          >
            <option value="all">All Boards</option>
            <option value="ESP32">ESP32</option>
            <option value="Arduino Uno">Arduino Uno</option>
            <option value="Arduino Nano">Arduino Nano</option>
            <option value="Raspberry Pi Pico">Raspberry Pi Pico</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-xs text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-2" />
              <span>Loading verified projects from PostgreSQL...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center text-xs text-zinc-400 dark:border-zinc-800">
              No matching projects found.
            </div>
          ) : (
            projects.map((proj) => {
              const diffBadge =
                proj.difficulty === "Beginner"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : proj.difficulty === "Intermediate"
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";

              return (
                <div
                  key={proj.id}
                  className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                        {proj.board}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium ${diffBadge}`}>
                        {proj.difficulty}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      {proj.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Est: ₹{proj.budgetInr || "1200"}</span>
                      <span>•</span>
                      <span>{proj.circuit?.components?.length || 4} components</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-violet-700 dark:text-zinc-100 dark:hover:text-violet-300 transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <Link
                      href={`/circuit-studio`}
                      className="text-[11px] font-mono text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      Studio Canvas
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* AI Idea Generator Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  AI Hardware Idea Generator
                </h3>
              </div>
              <button
                onClick={() => setShowIdeaModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateIdeas} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  What domain or interests inspire you?
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Smart garden, robotics pet, drone sensors, audio synthesizer..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingIdeas}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all"
              >
                {isGeneratingIdeas ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Brainstorming with Gemma...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Ideas</span>
                  </>
                )}
              </button>
            </form>

            {generatedIdeas.length > 0 && (
              <div className="mt-4 max-h-72 overflow-y-auto space-y-2.5">
                {generatedIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-950 dark:text-zinc-100">{idea.title}</span>
                      <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">{idea.estimatedCost}</span>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{idea.solution}</p>
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400">{idea.board}</span>
                      <Link
                        href={`/builder?prompt=${encodeURIComponent(idea.title + ": " + idea.solution)}`}
                        className="text-[11px] font-semibold text-zinc-900 hover:underline dark:text-zinc-100 flex items-center gap-1"
                      >
                        Build this project <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
