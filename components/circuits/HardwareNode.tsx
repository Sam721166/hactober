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

  return (
    <div
      className={`min-w-[190px] rounded-xl border bg-white p-3 shadow-md transition-all dark:bg-zinc-900 ${
        selected
          ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-500/10"
          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
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

      {/* Header with Small Component Image Diagram */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 p-1 border border-zinc-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
          <ComponentArtwork type={data.type} size="sm" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate" title={data.label}>
            {data.label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 truncate">
            {data.type?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Pin Layout Body */}
      <div className="mt-3 flex justify-between gap-4 text-[10px] font-mono">
        {/* Left pins */}
        <div className="flex flex-col gap-2">
          {leftPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-2">
              <Handle
                type="source"
                position={Position.Left}
                id={pin.id}
                isConnectable={true}
                className={`!h-3 !w-3 !-left-4.5 !rounded-full !border-2 ${PIN_COLORS[pin.type] || "!bg-zinc-400"} hover:!scale-125 transition-transform !cursor-crosshair shadow-sm`}
                title={`${pin.name} (${pin.type.toUpperCase()})`}
              />
              <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">{pin.name}</span>
            </div>
          ))}
        </div>

        {/* Right pins */}
        <div className="flex flex-col gap-2 items-end">
          {rightPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-2">
              <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">{pin.name}</span>
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
