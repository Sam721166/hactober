"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  Layers,
  Search,
  Filter,
  Cpu,
  ArrowRight,
  Sparkles,
  Zap,
  Tag,
  DollarSign,
  Activity,
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
                <Layers className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight">Project Library</h1>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Seeded Reference Hardware
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Explore genuine open-source hardware architectures with verified wiring, pin mappings, and starter firmwares.
            </p>
          </div>

          <button
            onClick={() => setShowIdeaModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Idea Generator</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, sensor, actuator..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
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
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Project Grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-xs text-zinc-400">
              Loading verified projects from PostgreSQL...
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-zinc-400">
              No matching projects found.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-cyan-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/60">
                      {proj.board}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {proj.difficulty}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 transition-colors">
                    {proj.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span>Est: ₹{proj.budgetInr || "1200"}</span>
                    <span>•</span>
                    <span>{proj.circuit?.components?.length || 4} components</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <Link
                    href={`/projects/${proj.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-500"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href={`/circuit-studio`}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  >
                    Studio Canvas
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* AI Idea Generator Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <h3 className="text-sm font-bold">AI Hardware Idea Generator</h3>
              </div>
              <button
                onClick={() => setShowIdeaModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleGenerateIdeas} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  What domain or interests inspire you?
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Smart garden, robotics pet, drone sensors, audio synthesizer..."
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingIdeas}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isGeneratingIdeas ? "Brainstorming with Gemma..." : "Generate Ideas"}</span>
              </button>
            </form>

            {generatedIdeas.length > 0 && (
              <div className="mt-4 max-h-72 overflow-y-auto space-y-2.5">
                {generatedIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{idea.title}</span>
                      <span className="font-mono text-[10px] text-cyan-600">{idea.estimatedCost}</span>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{idea.solution}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-zinc-400">{idea.board}</span>
                      <Link
                        href={`/builder?prompt=${encodeURIComponent(idea.title + ": " + idea.solution)}`}
                        className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-500 flex items-center gap-1"
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
