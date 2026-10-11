"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Activity,
  Calendar,
  ExternalLink,
  Loader2,
  Search,
  SlidersHorizontal,
  FileCode,
  Radio,
  Trash2,
  Copy,
  Edit2,
  MoreVertical,
  CheckCircle2,
  Package,
  Wrench,
  Check,
  X,
} from "lucide-react";

export default function WorkspacesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "components">("recent");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Rename modal state
  const [renamingProject, setRenamingProject] = useState<any | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  // Template creation state
  const [isCreatingTemplate, setIsCreatingTemplate] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Filter & Sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.board?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedBoard !== "all") {
      result = result.filter((p) => p.board?.toLowerCase() === selectedBoard.toLowerCase());
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "components") {
      result.sort(
        (a, b) =>
          (b.circuit?.components?.length || 0) - (a.circuit?.components?.length || 0)
      );
    }

    return result;
  }, [projects, searchQuery, selectedBoard, selectedCategory, sortBy]);

  // Total stats metrics
  const stats = useMemo(() => {
    const totalComponents = projects.reduce(
      (acc, p) => acc + (p.circuit?.components?.length || 0),
      0
    );
    const totalWires = projects.reduce(
      (acc, p) => acc + (p.circuit?.connections?.length || 0),
      0
    );
    const boards = new Set(projects.map((p) => p.board).filter(Boolean));
    return {
      totalProjects: projects.length,
      totalComponents,
      totalWires,
      uniqueBoards: boards.size,
    };
  }, [projects]);

  // Delete project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workspace project?")) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(`Failed to delete project: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeletingId(null);
      setActionMenuId(null);
    }
  };

  // Duplicate project
  const handleDuplicateProject = async (proj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMenuId(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${proj.title} (Copy)`,
          description: proj.description,
          board: proj.board,
          category: proj.category,
          difficulty: proj.difficulty,
          budgetInr: proj.budgetInr,
          plan: proj.plan,
          circuit: proj.circuit,
          firmware: proj.firmware,
          bom: proj.bom,
        }),
      });
      const data = await res.json();
      if (data.ok && data.project) {
        setProjects((prev) => [data.project, ...prev]);
      }
    } catch (err: any) {
      alert("Failed to duplicate project.");
    }
  };

  // Submit rename
  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProject || !newTitle.trim()) return;
    setIsSubmittingRename(true);
    try {
      const res = await fetch(`/api/projects/${renamingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === renamingProject.id ? { ...p, title: data.project.title } : p))
        );
        setRenamingProject(null);
      }
    } catch (err: any) {
      alert("Failed to rename project.");
    } finally {
      setIsSubmittingRename(false);
    }
  };

  // Quick Starter Templates
  const handleCreateFromTemplate = async (template: {
    title: string;
    description: string;
    board: string;
    category: string;
    components: any[];
    connections: any[];
  }) => {
    setIsCreatingTemplate(template.title);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          board: template.board,
          category: template.category,
          difficulty: "Beginner",
          budgetInr: 1200,
          circuit: {
            components: template.components,
            connections: template.connections,
          },
          firmware: {
            filename: "main.ino",
            language: "arduino",
            content: `// Auto-generated firmware for ${template.title}\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("${template.title} Initialized");\n}\n\nvoid loop() {\n  delay(1000);\n}`,
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.project) {
        router.push(`/projects/${data.project.id}`);
      }
    } catch (err: any) {
      alert("Failed to create template project.");
    } finally {
      setIsCreatingTemplate(null);
    }
  };

  const starterTemplates = [
    {
      title: "ESP32 IoT Climate Station",
      description: "Environmental monitoring station with ESP32 WiFi and DHT22 temperature sensor.",
      board: "ESP32",
      category: "IoT",
      components: [
        { id: "esp32-1", type: "esp32", label: "ESP32 DevKit V1", x: 420, y: 150 },
        { id: "dht-1", type: "dht22_sensor", label: "DHT22 Climate Sensor", x: 120, y: 150 },
      ],
      connections: [
        { id: "c1", sourceComponentId: "esp32-1", sourcePin: "3V3", targetComponentId: "dht-1", targetPin: "VCC", status: "confirmed" },
        { id: "c2", sourceComponentId: "esp32-1", sourcePin: "GND", targetComponentId: "dht-1", targetPin: "GND", status: "confirmed" },
        { id: "c3", sourceComponentId: "esp32-1", sourcePin: "GPIO4", targetComponentId: "dht-1", targetPin: "DATA", status: "confirmed" },
      ],
    },
    {
      title: "Arduino Smart Rover",
      description: "Autonomous vehicle chassis using ultrasonic obstacle avoidance.",
      board: "Arduino Uno",
      category: "Robotics",
      components: [
        { id: "uno-1", type: "arduino_uno", label: "Arduino Uno R3", x: 420, y: 150 },
        { id: "sonar-1", type: "ultrasonic_sensor", label: "HC-SR04 Sonar", x: 120, y: 150 },
      ],
      connections: [
        { id: "c1", sourceComponentId: "uno-1", sourcePin: "5V", targetComponentId: "sonar-1", targetPin: "VCC", status: "confirmed" },
        { id: "c2", sourceComponentId: "uno-1", sourcePin: "GND", targetComponentId: "sonar-1", targetPin: "GND", status: "confirmed" },
        { id: "c3", sourceComponentId: "uno-1", sourcePin: "GPIO9", targetComponentId: "sonar-1", targetPin: "TRIG", status: "confirmed" },
        { id: "c4", sourceComponentId: "uno-1", sourcePin: "GPIO10", targetComponentId: "sonar-1", targetPin: "ECHO", status: "confirmed" },
      ],
    },
    {
      title: "Pico Gas & Alarm Monitor",
      description: "Safety telemetry monitor using Raspberry Pi Pico and gas detection.",
      board: "Raspberry Pi Pico",
      category: "Sensors",
      components: [
        { id: "pico-1", type: "pico", label: "Raspberry Pi Pico", x: 420, y: 150 },
        { id: "mq2-1", type: "mq2_sensor", label: "MQ-2 Gas Sensor", x: 120, y: 150 },
      ],
      connections: [
        { id: "c1", sourceComponentId: "pico-1", sourcePin: "3V3", targetComponentId: "mq2-1", targetPin: "VCC", status: "confirmed" },
        { id: "c2", sourceComponentId: "pico-1", sourcePin: "GND", targetComponentId: "mq2-1", targetPin: "GND", status: "confirmed" },
        { id: "c3", sourceComponentId: "pico-1", sourcePin: "ADC0", targetComponentId: "mq2-1", targetPin: "AOUT", status: "confirmed" },
      ],
    },
  ];

  const getBoardBadgeClass = (boardName: string) => {
    const b = (boardName || "").toLowerCase();
    if (b.includes("esp32")) {
      return "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
    }
    if (b.includes("uno") || b.includes("nano") || b.includes("arduino")) {
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    }
    if (b.includes("pico") || b.includes("raspberry")) {
      return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300";
    }
    return "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950">
                <FolderKanban className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Project Workspaces
              </h1>
              <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                Hardware Hub
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Manage your hardware workspaces, circuits, firmware IDE files, pin maps, and diagnostic sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/circuit-studio"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              <Cpu className="h-3.5 w-3.5 text-sky-500" />
              <span>Circuit Studio</span>
            </Link>

            <Link
              href="/builder"
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-all ring-1 ring-zinc-700/30"
            >
              <Plus className="h-3.5 w-3.5 text-sky-400" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* Workspace Quick Metrics Overview Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Total Workspaces
              </span>
              <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50 font-mono mt-0.5">
                {stats.totalProjects}
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                MCU Targets
              </span>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {stats.uniqueBoards} Active
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
              <Cpu className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Circuit Parts
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {stats.totalComponents} Items
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
              <Package className="h-4 w-4" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Wiring Connections
              </span>
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                {stats.totalWires} Wires
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-500">
              <Radio className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Filter, Search & Controls Strip */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, microcontroller, sensor, or category..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-200 transition-colors"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Board select */}
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Boards</option>
              <option value="esp32">ESP32</option>
              <option value="arduino uno">Arduino Uno</option>
              <option value="raspberry pi pico">Raspberry Pi Pico</option>
            </select>

            {/* Category select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="iot">IoT & Cloud</option>
              <option value="robotics">Robotics</option>
              <option value="sensors">Sensors</option>
              <option value="home automation">Home Automation</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="components">Most Components</option>
            </select>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-2" />
              <span>Loading workspaces from database...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400 dark:border-zinc-800">
              <FolderKanban className="h-8 w-8 mx-auto mb-3 opacity-40 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {searchQuery || selectedBoard !== "all" || selectedCategory !== "all"
                  ? "No matching workspaces found"
                  : "No Workspaces Yet"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedBoard !== "all"
                  ? "Try clearing your search query or filters to view all workspaces."
                  : "Select a starter hardware template below or use Project Builder to architect a custom circuit."}
              </p>
              {(searchQuery || selectedBoard !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBoard("all");
                    setSelectedCategory("all");
                  }}
                  className="mt-3 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="group relative rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 flex flex-col justify-between hover:shadow-md"
                >
                  {/* Card Top Row: Board, Category, Actions Menu */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${getBoardBadgeClass(
                            proj.board
                          )}`}
                        >
                          {proj.board}
                        </span>
                        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                          {proj.category || "Hardware"}
                        </span>
                      </div>

                      {/* 3-Dot Action Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(actionMenuId === proj.id ? null : proj.id);
                          }}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Workspace actions"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {actionMenuId === proj.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 z-20 text-xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingProject(proj);
                                setNewTitle(proj.title);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
                            >
                              <Edit2 className="h-3 w-3 text-zinc-500" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={(e) => handleDuplicateProject(proj, e)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
                            >
                              <Copy className="h-3 w-3 text-zinc-500" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, e)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3 w-3 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <Link href={`/projects/${proj.id}`} className="block mt-2.5">
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {proj.description || "Interactive hardware design workspace."}
                      </p>
                    </Link>

                    {/* Stats pills */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5">
                        <Package className="h-3 w-3 text-zinc-400" />
                        <span>{proj.circuit?.components?.length || 0} parts</span>
                      </span>
                      <span className="flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5">
                        <Radio className="h-3 w-3 text-zinc-400" />
                        <span>{proj.circuit?.connections?.length || 0} wires</span>
                      </span>
                      {proj.budgetInr ? (
                        <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-semibold text-[10px]">
                          ₹{proj.budgetInr}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Quick Direct Launch Action Strip */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* 1. Direct to Circuit Studio */}
                      <Link
                        href={`/circuit-studio?projectId=${proj.id}`}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40 transition-colors"
                        title="Open directly in Circuit Studio"
                      >
                        <Cpu className="h-3 w-3" />
                        <span>Studio</span>
                      </Link>

                      {/* 2. Direct to Firmware IDE */}
                      <Link
                        href={`/projects/${proj.id}?tab=firmware`}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40 transition-colors"
                        title="Open directly in Firmware IDE"
                      >
                        <FileCode className="h-3 w-3" />
                        <span>Firmware</span>
                      </Link>

                      {/* 3. Direct to Doctor */}
                      <Link
                        href={`/circuit-doctor?board=${encodeURIComponent(proj.board || "ESP32")}`}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                        title="Diagnose this board with Circuit Doctor"
                      >
                        <Activity className="h-3 w-3" />
                        <span>Doctor</span>
                      </Link>
                    </div>

                    {/* 4. Full Workspace Link */}
                    <Link
                      href={`/projects/${proj.id}`}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Open full workspace"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Starter Templates Hub */}
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                  Quick Starter Hardware Templates
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Spin up a pre-configured hardware workspace in 1 click with verified schematics & starter firmware.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {starterTemplates.map((t, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${getBoardBadgeClass(
                        t.board
                      )}`}
                    >
                      {t.board}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{t.category}</span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {t.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <button
                  onClick={() => handleCreateFromTemplate(t)}
                  disabled={isCreatingTemplate === t.title}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-all disabled:opacity-50"
                >
                  {isCreatingTemplate === t.title ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>Launch Template</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Rename Modal */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                Rename Workspace
              </h3>
              <button
                onClick={() => setRenamingProject(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 p-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingProject(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRename}
                  className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {isSubmittingRename ? "Saving..." : "Save Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
