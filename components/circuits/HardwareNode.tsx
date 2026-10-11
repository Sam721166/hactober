"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ComponentArtwork } from "./ComponentArtwork";
import { Zap, AlertTriangle, Flame, Sliders } from "lucide-react";

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
  onToggleSwitch?: (id: string) => void;
  onUpdateProperty?: (id: string, key: string, value: any) => void;
  onProbePin?: (nodeId: string, pinId: string) => void;
  multimeterActive?: boolean;
  simStatus?: {
    isPowered?: boolean;
    powerVoltage?: number;
    isGndConnected?: boolean;
    isShortCircuited?: boolean;
    isBurnedOut?: boolean;
    burnedReason?: string;
    operatingState?: string;
    actuatorActive?: boolean;
    customBadge?: string;
    pinVoltages?: Record<string, number>;
    pinLogic?: Record<string, "HIGH" | "LOW" | "POWER" | "GND" | "FLOAT">;
  };
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
  const simStatus = data.simStatus;
  const isBurnedOut = Boolean(simStatus?.isBurnedOut);
  const isShortCircuited = Boolean(simStatus?.isShortCircuited);
  const isActuatorActive = Boolean(simStatus?.actuatorActive);
  const multimeterActive = Boolean(data.multimeterActive);

  const getSimBadge = () => {
    if (!isSimulating) return null;

    if (simStatus?.customBadge) {
      if (isBurnedOut) {
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-500 px-1.5 py-0.5 text-[8px] font-bold text-red-600 dark:text-red-400 animate-bounce">
            <Flame className="h-2.5 w-2.5 text-red-600" />
            {simStatus.customBadge}
          </span>
        );
      }
      if (isShortCircuited) {
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-500 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
            {simStatus.customBadge}
          </span>
        );
      }
      return (
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
          {simStatus.customBadge}
        </span>
      );
    }

    return (
      <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-800 px-1.5 py-0.2 text-[8px] font-bold text-cyan-700 dark:text-cyan-400">
        ⚡ Active
      </span>
    );
  };

  const handlePinClick = (e: React.MouseEvent, pinId: string) => {
    if (data.onProbePin) {
      e.stopPropagation();
      data.onProbePin(id, pinId);
    }
  };

  return (
    <div
      className={`min-w-[210px] rounded-xl border bg-white p-3 shadow-md transition-all dark:bg-zinc-900 ${
        isBurnedOut
          ? "border-red-600 ring-4 ring-red-500/30 bg-red-50/40 dark:bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          : isShortCircuited
          ? "border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/10"
          : isSimulating && data.type === "led" && isActuatorActive
          ? "border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
          : isSimulating && isActuatorActive
          ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-cyan-500/10"
          : isSimulating
          ? "border-emerald-500/80 ring-1 ring-emerald-500/20 shadow-emerald-500/5"
          : selected
          ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100 dark:ring-zinc-100/20"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      }`}
    >
      {/* Top handles */}
      {topPins.map((pin, i) => {
        const v = simStatus?.pinVoltages?.[pin.id];
        return (
          <div key={pin.id} className="relative">
            <Handle
              type="source"
              position={Position.Top}
              id={pin.id}
              isConnectable={true}
              onClick={(e) => handlePinClick(e, pin.id)}
              className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
                PIN_COLORS[pin.type] || "!bg-zinc-400 !border-zinc-200"
              } hover:!scale-150 transition-transform !cursor-crosshair shadow-sm`}
              style={{ left: `${((i + 1) / (topPins.length + 1)) * 100}%` }}
              title={`${pin.name} (${pin.type.toUpperCase()})${
                typeof v === "number" ? ` • ${v.toFixed(2)}V` : ""
              }${multimeterActive ? " [Click to probe with Multimeter]" : ""}`}
            />
          </div>
        );
      })}

      {/* Header with Component Image Diagram & Simulation Badge */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 p-1 border border-zinc-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
          <ComponentArtwork
            type={data.type}
            size="sm"
            isSimulating={isSimulating}
            simState={{
              isLedOn: isActuatorActive && !isBurnedOut,
              servoAngle: data.simState?.servoAngle,
              oledMessage: data.simState?.oledMessage,
              buzzerActive: isActuatorActive,
              relayActive: isActuatorActive,
              motorRunning: isActuatorActive,
              sensorReading: data.simState?.sensorReading,
              tick: data.simState?.tick,
            }}
          />
          {isBurnedOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg text-lg animate-pulse" title="Component destroyed!">
              💥
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate"
              title={data.label}
            >
              {data.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 truncate">
              {data.type?.replace(/_/g, " ")}
            </span>
            {getSimBadge()}
          </div>
        </div>
      </div>

      {/* Interactive Controls directly on the node */}
      {data.type === "push_button" && (
        <div className="my-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">Tactile Switch</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleSwitch) data.onToggleSwitch(id);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              data.properties?.isPressed
                ? "bg-cyan-600 text-white shadow-xs"
                : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
            }`}
          >
            {data.properties?.isPressed ? "PRESSED (ON)" : "RELEASED (OFF)"}
          </button>
        </div>
      )}

      {data.type === "potentiometer" && (
        <div className="my-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
            <span>Wiper Position</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {data.properties?.wiperPct ?? 50}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={data.properties?.wiperPct ?? 50}
            onChange={(e) => {
              e.stopPropagation();
              if (data.onUpdateProperty) {
                data.onUpdateProperty(id, "wiperPct", Number(e.target.value));
              }
            }}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      )}

      {data.type === "resistor" && (
        <div className="my-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">Resistance</span>
          <select
            value={data.properties?.resistance ?? 220}
            onChange={(e) => {
              e.stopPropagation();
              if (data.onUpdateProperty) {
                data.onUpdateProperty(id, "resistance", Number(e.target.value));
              }
            }}
            className="px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200"
          >
            <option value={100}>100 Ω</option>
            <option value={220}>220 Ω (LED)</option>
            <option value={330}>330 Ω</option>
            <option value={1000}>1 kΩ</option>
            <option value={4700}>4.7 kΩ</option>
            <option value={10000}>10 kΩ (Pull-up)</option>
          </select>
        </div>
      )}

      {/* Pin Layout Body */}
      <div className="mt-2.5 flex justify-between gap-4 text-[10px] font-mono">
        {/* Left pins */}
        <div className="flex flex-col gap-2">
          {leftPins.map((pin) => {
            const v = simStatus?.pinVoltages?.[pin.id];
            const logic = simStatus?.pinLogic?.[pin.id];
            return (
              <div
                key={pin.id}
                onClick={(e) => handlePinClick(e, pin.id)}
                className={`relative flex items-center gap-1.5 ${
                  multimeterActive ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-0.5 rounded" : ""
                }`}
                title={
                  multimeterActive
                    ? `Click to probe Pin ${pin.name} with Multimeter`
                    : `${pin.name} (${pin.type.toUpperCase()})`
                }
              >
                <Handle
                  type="source"
                  position={Position.Left}
                  id={pin.id}
                  isConnectable={true}
                  className={`!h-3.5 !w-3.5 !-left-4.5 !rounded-full !border-2 ${
                    PIN_COLORS[pin.type] || "!bg-zinc-400"
                  } hover:!scale-150 transition-transform !cursor-crosshair shadow-sm`}
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
                <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">
                  {pin.name}
                </span>
                {isSimulating && typeof v === "number" && (
                  <span
                    className={`ml-1 px-1 py-0.2 rounded text-[8px] font-mono ${
                      logic === "GND"
                        ? "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                        : v >= 2.5
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold"
                        : "text-zinc-500"
                    }`}
                  >
                    {v.toFixed(1)}V
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right pins */}
        <div className="flex flex-col gap-2 items-end">
          {rightPins.map((pin) => {
            const v = simStatus?.pinVoltages?.[pin.id];
            const logic = simStatus?.pinLogic?.[pin.id];
            return (
              <div
                key={pin.id}
                onClick={(e) => handlePinClick(e, pin.id)}
                className={`relative flex items-center gap-1.5 ${
                  multimeterActive ? "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-0.5 rounded" : ""
                }`}
                title={
                  multimeterActive
                    ? `Click to probe Pin ${pin.name} with Multimeter`
                    : `${pin.name} (${pin.type.toUpperCase()})`
                }
              >
                {isSimulating && typeof v === "number" && (
                  <span
                    className={`mr-1 px-1 py-0.2 rounded text-[8px] font-mono ${
                      logic === "GND"
                        ? "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                        : v >= 2.5
                        ? "text-rose-600 bg-rose-50 dark:bg-rose-950/60 font-bold"
                        : "text-zinc-500"
                    }`}
                  >
                    {v.toFixed(1)}V
                  </span>
                )}
                <span className="text-zinc-700 dark:text-zinc-300 select-none font-medium text-[10px]">
                  {pin.name}
                </span>
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
                  className={`!h-3.5 !w-3.5 !-right-4.5 !rounded-full !border-2 ${
                    PIN_COLORS[pin.type] || "!bg-zinc-400"
                  } hover:!scale-150 transition-transform !cursor-crosshair shadow-sm`}
                  title={`${pin.name} (${pin.type.toUpperCase()})`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom handles */}
      {bottomPins.map((pin, i) => {
        const v = simStatus?.pinVoltages?.[pin.id];
        return (
          <div key={pin.id} className="relative">
            <Handle
              type="source"
              position={Position.Bottom}
              id={pin.id}
              isConnectable={true}
              onClick={(e) => handlePinClick(e, pin.id)}
              className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
                PIN_COLORS[pin.type] || "!bg-zinc-400 !border-zinc-200"
              } hover:!scale-150 transition-transform !cursor-crosshair shadow-sm`}
              style={{ left: `${((i + 1) / (bottomPins.length + 1)) * 100}%` }}
              title={`${pin.name} (${pin.type.toUpperCase()})${
                typeof v === "number" ? ` • ${v.toFixed(2)}V` : ""
              }${multimeterActive ? " [Click to probe with Multimeter]" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
});

HardwareNode.displayName = "HardwareNode";
