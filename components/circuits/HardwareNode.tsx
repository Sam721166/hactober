"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ComponentArtwork } from "./ComponentArtwork";

export interface HardwarePin {
  id: string;
  name: string;
  type: "power" | "gnd" | "digital" | "analog" | "i2c" | "pwm";
  side: "left" | "right" | "top" | "bottom";
}

export interface HardwareNodeData {
  label: string;
  type: string;
  pins: HardwarePin[];
  properties?: Record<string, any>;
  onSelectNode?: (id: string) => void;
}

const PIN_COLORS: Record<string, string> = {
  power: "!bg-rose-500 !border-rose-200",
  gnd: "!bg-zinc-800 !border-zinc-500",
  digital: "!bg-cyan-500 !border-cyan-200",
  analog: "!bg-amber-500 !border-amber-200",
  i2c: "!bg-purple-500 !border-purple-200",
  pwm: "!bg-emerald-500 !border-emerald-200",
};

export const HardwareNode = memo(({ id, data, selected }: { id: string; data: any; selected?: boolean }) => {
  const pins: HardwarePin[] = data.pins || [];
  const leftPins = pins.filter((p) => p.side === "left");
  const rightPins = pins.filter((p) => p.side === "right");
  const topPins = pins.filter((p) => p.side === "top");
  const bottomPins = pins.filter((p) => p.side === "bottom");

  const isSimulating = Boolean(data.isSimulating);
  const simState = data.simState;

  const getSimBadge = () => {
    if (!isSimulating) return null;
    switch (data.type) {
      case "led":
        return (
          <span className="rounded-full bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 px-1.5 py-0.2 text-[8px] font-bold text-rose-700 dark:text-rose-400 animate-pulse">
            ✨ Glowing HIGH
          </span>
        );
      case "servo_motor":
        return (
          <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-800 px-1.5 py-0.2 text-[8px] font-bold text-cyan-700 dark:text-cyan-400">
            🔄 {simState?.servoAngle ?? 45}° Angle
          </span>
        );
      case "oled_display":
        return (
          <span className="rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 px-1.5 py-0.2 text-[8px] font-bold text-purple-700 dark:text-purple-400">
            📺 Live Display
          </span>
        );
      case "buzzer":
        return (
          <span className="rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 text-[8px] font-bold text-amber-700 dark:text-amber-400 animate-bounce">
            🔔 Tone Active
          </span>
        );
      case "relay_module":
        return (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 text-[8px] font-bold text-emerald-700 dark:text-emerald-400">
            🔌 COM-NO Contact
          </span>
        );
      case "esp32":
      case "arduino_uno":
      case "arduino_nano":
      case "pico":
        return (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 text-[8px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" /> MCU Running
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-800 px-1.5 py-0.2 text-[8px] font-bold text-cyan-700 dark:text-cyan-400">
            ⚡ Energized
          </span>
        );
    }
  };

  return (
    <div
      className={`min-w-[195px] rounded-xl border bg-white p-3 shadow-md transition-all dark:bg-zinc-900 ${
        isSimulating && data.type === "led" && (simState?.isLedOn ?? true)
          ? "border-rose-500 ring-4 ring-rose-500/20 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
          : isSimulating
          ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-emerald-500/5"
          : selected
          ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100 dark:ring-zinc-100/20"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      }`}
    >
      {/* Top handles */}
      {topPins.map((pin, i) => (
        <div key={pin.id} className="relative">
          <Handle
            type="source"
            position={Position.Top}
            id={pin.id}
            isConnectable={true}
            className={`!h-3 !w-3 !rounded-full !border-2 ${PIN_COLORS[pin.type] || "!bg-zinc-400 !border-zinc-200"} hover:!scale-125 transition-transform !cursor-crosshair shadow-sm`}
            style={{ left: `${((i + 1) / (topPins.length + 1)) * 100}%` }}
            title={`${pin.name} (${pin.type.toUpperCase()})`}
          />
        </div>
      ))}

      {/* Header with Small Component Image Diagram & Simulation Badge */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 p-1 border border-zinc-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
          <ComponentArtwork type={data.type} size="sm" isSimulating={isSimulating} simState={simState} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate" title={data.label}>
              {data.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 truncate">
              {data.type?.replace(/_/g, " ")}
            </span>
            {getSimBadge()}
          </div>
        </div>
      </div>

      {/* Pin Layout Body */}
      <div className="mt-3 flex justify-between gap-4 text-[10px] font-mono">
        {/* Left pins */}
        <div className="flex flex-col gap-2">
          {leftPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-1.5">
              <Handle
                type="source"
                position={Position.Left}
                id={pin.id}
                isConnectable={true}
                className={`!h-3 !w-3 !-left-4.5 !rounded-full !border-2 ${PIN_COLORS[pin.type] || "!bg-zinc-400"} hover:!scale-125 transition-transform !cursor-crosshair shadow-sm`}
                title={`${pin.name} (${pin.type.toUpperCase()})`}
              />
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  pin.type === "power"
                    ? "bg-rose-500"
                    : pin.type === "gnd"
                    ? "bg-zinc-800 dark:bg-zinc-300"
                    : pin.type === "analog"
                    ? "bg-amber-500"
                    : pin.type === "pwm"
                    ? "bg-emerald-500"
                    : pin.type === "i2c"
                    ? "bg-purple-500"
                    : "bg-cyan-500"
                }`}
              />
              <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">{pin.name}</span>
            </div>
          ))}
        </div>

        {/* Right pins */}
        <div className="flex flex-col gap-2 items-end">
          {rightPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-1.5">
              <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">{pin.name}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  pin.type === "power"
                    ? "bg-rose-500"
                    : pin.type === "gnd"
                    ? "bg-zinc-800 dark:bg-zinc-300"
                    : pin.type === "analog"
                    ? "bg-amber-500"
                    : pin.type === "pwm"
                    ? "bg-emerald-500"
                    : pin.type === "i2c"
                    ? "bg-purple-500"
                    : "bg-cyan-500"
                }`}
              />
              <Handle
                type="source"
                position={Position.Right}
                id={pin.id}
                isConnectable={true}
                className={`!h-3 !w-3 !-right-4.5 !rounded-full !border-2 ${PIN_COLORS[pin.type] || "!bg-zinc-400"} hover:!scale-125 transition-transform !cursor-crosshair shadow-sm`}
                title={`${pin.name} (${pin.type.toUpperCase()})`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom handles */}
      {bottomPins.map((pin, i) => (
        <div key={pin.id} className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id={pin.id}
            isConnectable={true}
            className={`!h-3 !w-3 !rounded-full !border-2 ${PIN_COLORS[pin.type] || "!bg-zinc-400 !border-zinc-200"} hover:!scale-125 transition-transform !cursor-crosshair shadow-sm`}
            style={{ left: `${((i + 1) / (bottomPins.length + 1)) * 100}%` }}
            title={`${pin.name} (${pin.type.toUpperCase()})`}
          />
        </div>
      ))}
    </div>
  );
});

HardwareNode.displayName = "HardwareNode";
