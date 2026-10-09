"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Cpu, Zap, Activity, Eye, Radio, Sparkles } from "lucide-react";

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
  power: "bg-rose-500 border-rose-300",
  gnd: "bg-zinc-800 border-zinc-600",
  digital: "bg-cyan-500 border-cyan-300",
  analog: "bg-amber-500 border-amber-300",
  i2c: "bg-purple-500 border-purple-300",
  pwm: "bg-emerald-500 border-emerald-300",
};

export const HardwareNode = memo(({ id, data, selected }: { id: string; data: any; selected?: boolean }) => {
  const pins: HardwarePin[] = data.pins || [];
  const leftPins = pins.filter((p) => p.side === "left");
  const rightPins = pins.filter((p) => p.side === "right");
  const topPins = pins.filter((p) => p.side === "top");
  const bottomPins = pins.filter((p) => p.side === "bottom");

  const getIcon = () => {
    switch (data.type) {
      case "esp32":
      case "arduino_uno":
      case "arduino_nano":
      case "pico":
        return <Cpu className="h-4 w-4 text-cyan-600" />;
      case "dht22_sensor":
      case "ultrasonic_sensor":
      case "soil_moisture_sensor":
      case "ldr_sensor":
        return <Activity className="h-4 w-4 text-amber-600" />;
      case "oled_display":
        return <Eye className="h-4 w-4 text-purple-600" />;
      default:
        return <Zap className="h-4 w-4 text-emerald-600" />;
    }
  };

  return (
    <div
      className={`min-w-[170px] rounded-xl border bg-white p-3 shadow-md transition-all dark:bg-zinc-900 ${
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
            className={`!h-3 !w-3 !rounded-full border-2 ${PIN_COLORS[pin.type] || "bg-zinc-400"}`}
            style={{ left: `${((i + 1) / (topPins.length + 1)) * 100}%` }}
          />
        </div>
      ))}

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {getIcon()}
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {data.label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
            {data.type?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Pin Layout Body */}
      <div className="mt-2.5 flex justify-between gap-3 text-[10px] font-mono">
        {/* Left pins */}
        <div className="flex flex-col gap-2">
          {leftPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-1.5">
              <Handle
                type="source"
                position={Position.Left}
                id={pin.id}
                className={`!h-2.5 !w-2.5 !-left-4 !rounded-full border ${PIN_COLORS[pin.type]}`}
              />
              <span className="text-zinc-600 dark:text-zinc-400">{pin.name}</span>
            </div>
          ))}
        </div>

        {/* Right pins */}
        <div className="flex flex-col gap-2 items-end">
          {rightPins.map((pin) => (
            <div key={pin.id} className="relative flex items-center gap-1.5">
              <span className="text-zinc-600 dark:text-zinc-400">{pin.name}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={pin.id}
                className={`!h-2.5 !w-2.5 !-right-4 !rounded-full border ${PIN_COLORS[pin.type]}`}
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
            className={`!h-3 !w-3 !rounded-full border-2 ${PIN_COLORS[pin.type] || "bg-zinc-400"}`}
            style={{ left: `${((i + 1) / (bottomPins.length + 1)) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
});

HardwareNode.displayName = "HardwareNode";
