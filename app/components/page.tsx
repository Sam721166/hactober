"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Package,
  Search,
  Cpu,
  Zap,
  Activity,
  Eye,
  Radio,
  ExternalLink,
  Tag,
  Sliders,
} from "lucide-react";

export default function ComponentsCataloguePage() {
  const [components, setComponents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComponents() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (search) params.set("search", search);

        const res = await fetch(`/api/components?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setComponents(data.components);
        }
      } catch (err) {
        console.error("Failed to load components:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadComponents();
  }, [category, search]);

  const categories = [
    "all",
    "Development Boards",
    "Sensors",
    "Motors & Actuators",
    "Displays",
    "Passives & Indicators",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
              <Package className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Component Catalogue</h1>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Verified Pinouts & Specs
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Database of microcontrollers, sensors, actuators, and passive components with verified voltage levels and pin mappings.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components by name, interface, voltage..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                }`}
              >
                {cat === "all" ? "All Components" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-xs text-zinc-400">
              Loading component catalogue...
            </div>
          ) : components.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-zinc-400">
              No components matching your filter.
            </div>
          ) : (
            components.map((comp) => {
              const specs =
                typeof comp.specifications === "string"
                  ? JSON.parse(comp.specifications)
                  : comp.specifications || {};

              return (
                <div
                  key={comp.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {comp.category}
                      </span>
                      {comp.approx_price_inr && (
                        <span className="font-mono text-xs font-bold text-cyan-600">
                          ₹{comp.approx_price_inr}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {comp.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                      {comp.description}
                    </p>

                    {comp.interfaces && (
                      <div className="mt-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                          Interface:{" "}
                        </span>
                        {comp.interfaces}
                      </div>
                    )}

                    {Object.keys(specs).length > 0 && (
                      <div className="mt-3 space-y-1 rounded-lg bg-zinc-50 p-2.5 font-mono text-[10px] dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        {Object.entries(specs).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-zinc-400 uppercase">{key}:</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
