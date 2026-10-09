"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ComponentArtwork } from "@/components/circuits/ComponentArtwork";
import {
  Package,
  Search,
  Cpu,
  Zap,
  Activity,
  Sliders,
  Tag,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function getComponentArtworkType(comp: any): string {
  const slug = (comp.slug || "").toLowerCase();
  const name = (comp.name || "").toLowerCase();

  if (slug.includes("esp32") || name.includes("esp32")) return "esp32";
  if (slug.includes("uno") || name.includes("uno")) return "arduino_uno";
  if (slug.includes("nano") || name.includes("nano")) return "arduino_nano";
  if (slug.includes("pico") || name.includes("pico")) return "pico";
  if (slug.includes("ultrasonic") || name.includes("hc-sr04") || name.includes("ultrasonic"))
    return "ultrasonic_sensor";
  if (slug.includes("dht22") || slug.includes("temperature") || name.includes("dht"))
    return "dht22_sensor";
  if (slug.includes("soil") || slug.includes("moisture") || name.includes("soil"))
    return "soil_moisture_sensor";
  if (slug.includes("oled") || slug.includes("ssd1306") || name.includes("oled") || name.includes("display"))
    return "oled_display";
  if (slug.includes("servo") || slug.includes("sg90") || name.includes("servo"))
    return "servo_motor";
  if (slug.includes("motor") || slug.includes("l298n") || name.includes("driver"))
    return "motor_driver";
  if (slug.includes("relay") || name.includes("relay")) return "relay_module";
  if (slug.includes("led") || name.includes("led")) return "led";
  if (slug.includes("resistor") || name.includes("resistor")) return "resistor";
  if (slug.includes("ldr") || name.includes("photoresistor") || name.includes("light"))
    return "ldr_sensor";
  if (slug.includes("button") || name.includes("button") || name.includes("switch"))
    return "push_button";
  if (slug.includes("buzzer") || name.includes("buzzer")) return "buzzer";

  return "esp32";
}

export default function ComponentsCataloguePage() {
  const [components, setComponents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);

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
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 space-y-6">
        {/* Title Header */}
        <div className="pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950">
              <Package className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Component Catalogue
            </h1>
            <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Verified Pinouts & DRC Rules
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Database of microcontrollers, sensors, actuators, and passive components with visual illustrations, verified voltage levels, and pin mappings.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components by name, interface, voltage..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {cat === "all" ? "All Components" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-xs text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-2" />
              <span>Loading component catalogue...</span>
            </div>
          ) : components.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center text-xs text-zinc-400 dark:border-zinc-800">
              No components matching your filter.
            </div>
          ) : (
            components.map((comp) => {
              const specs =
                typeof comp.specifications === "string"
                  ? JSON.parse(comp.specifications)
                  : comp.specifications || {};

              const artworkType = getComponentArtworkType(comp);
              const isHovered = hoveredCompId === comp.id;

              return (
                <div
                  key={comp.id}
                  onMouseEnter={() => setHoveredCompId(comp.id)}
                  onMouseLeave={() => setHoveredCompId(null)}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Visual Component Image / Artwork Container */}
                    <div className="relative h-40 w-full rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-4 overflow-hidden transition-colors group-hover:bg-zinc-100/70 dark:group-hover:bg-zinc-800/70">
                      {comp.image_url ? (
                        <img
                          src={comp.image_url}
                          alt={comp.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center transition-transform group-hover:scale-105 duration-200">
                          <ComponentArtwork
                            type={artworkType}
                            size="xl"
                            isSimulating={isHovered}
                            simState={{
                              isLedOn: true,
                              servoAngle: isHovered ? 135 : 45,
                              motorRunning: true,
                              relayActive: true,
                              buzzerActive: true,
                              tick: isHovered ? 1 : 0,
                            }}
                          />
                        </div>
                      )}

                      {/* Live Interactive Cue on Hover */}
                      <span className="absolute top-2 right-2 rounded-full border border-zinc-200/60 bg-white/80 px-2 py-0.5 text-[9px] font-mono text-zinc-500 backdrop-blur-xs dark:border-zinc-700/60 dark:bg-zinc-900/80 dark:text-zinc-400">
                        {isHovered ? "⚡ Active" : "Schematic"}
                      </span>
                    </div>

                    {/* Metadata Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                          {comp.category}
                        </span>
                        {comp.approx_price_inr && (
                          <span className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100">
                            ₹{comp.approx_price_inr}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 text-sm font-bold text-zinc-950 dark:text-zinc-100 font-mono">
                        {comp.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {comp.description}
                      </p>
                    </div>

                    {/* Interfaces */}
                    {comp.interfaces && (
                      <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Interface:{" "}
                        </span>
                        {comp.interfaces}
                      </div>
                    )}

                    {/* Technical Specifications */}
                    {Object.keys(specs).length > 0 && (
                      <div className="space-y-1 rounded-lg bg-zinc-50 p-2.5 font-mono text-[10px] dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                        {Object.entries(specs).slice(0, 4).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="text-zinc-400 uppercase truncate">{key}:</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Link
                      href={`/builder?prompt=${encodeURIComponent("Build a project using " + comp.name)}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      <Sparkles className="h-3 w-3 text-zinc-500" />
                      <span>Build Project</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    <Link
                      href="/circuit-studio"
                      className="text-[11px] font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
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
    </div>
  );
}
