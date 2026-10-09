"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { HardwareNode } from "./HardwareNode";
import { ComponentArtwork } from "./ComponentArtwork";
import { COMPONENT_DEFINITIONS, ComponentDefinition } from "@/lib/circuits/registry";
import {
  Cpu,
  Plus,
  Trash2,
  Save,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Zap,
  Info,
  Maximize2,
  ArrowRight,
  Play,
  Pause,
  Square,
  Terminal,
  Sliders,
  Activity,
  Sparkles,
  Radio,
  Search,
  X,
  Layers,
  ExternalLink,
} from "lucide-react";

interface CircuitStudioProps {
  initialCircuit?: {
    components: any[];
    connections: any[];
  };
  projectId?: string;
  projectName?: string;
  onSave?: (circuitData: { components: any[]; connections: any[] }) => Promise<void>;
  diagramOnly?: boolean;
  allowSimulation?: boolean;
  onOpenStudio?: () => void;
}

export function CircuitStudioCanvas({
  initialCircuit,
  projectId,
  projectName = "Untitled Circuit",
  onSave,
  diagramOnly = false,
  allowSimulation = true,
  onOpenStudio,
}: CircuitStudioProps) {
  const nodeTypes = useMemo(() => ({ hardwareNode: HardwareNode }), []);

  // Convert initial components to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!initialCircuit?.components || initialCircuit.components.length === 0) {
      // Default initial starter: ESP32 + DHT22
      const espDef = COMPONENT_DEFINITIONS.esp32;
      const dhtDef = COMPONENT_DEFINITIONS.dht22_sensor;
      return [
        {
          id: "esp32-1",
          type: "hardwareNode",
          position: { x: 300, y: 150 },
          data: {
            label: "ESP32 DevKit",
            type: "esp32",
            pins: espDef.pins,
          },
        },
        {
          id: "sensor-1",
          type: "hardwareNode",
          position: { x: 80, y: 150 },
          data: {
            label: "DHT22 Sensor",
            type: "dht22_sensor",
            pins: dhtDef.pins,
          },
        },
      ];
    }

    return initialCircuit.components.map((comp) => {
      const def = COMPONENT_DEFINITIONS[comp.type] || COMPONENT_DEFINITIONS.esp32;
      return {
        id: comp.id,
        type: "hardwareNode",
        position: { x: comp.x ?? 250, y: comp.y ?? 150 },
        data: {
          label: comp.label || def.name,
          type: comp.type,
          pins: def.pins,
          properties: comp.properties,
        },
      };
    });
  }, [initialCircuit]);

  // Helper for real-world hardware jumper wire colors based on pin semantics
  const getWireColor = (pinId?: string | null): string => {
    if (!pinId) return "#06b6d4";
    const p = pinId.toUpperCase();
    if (p.includes("VCC") || p.includes("5V") || p.includes("3V3") || p.includes("VIN") || p.includes("12V") || p.includes("9V") || p.includes("ANODE") || p.includes("POS")) {
      return "#ef4444"; // Red for Power rails
    }
    if (p.includes("GND") || p.includes("CATHODE") || p.includes("NEG")) {
      return "#3f3f46"; // Dark slate for Ground
    }
    if (p.includes("SDA") || p.includes("SCL")) {
      return "#a855f7"; // Purple for I2C data/clock
    }
    if (p.includes("A0") || p.includes("A1") || p.includes("ADC") || p.includes("AOUT") || p.includes("VOUT") || p.includes("SIG")) {
      return "#f59e0b"; // Amber for Analog inputs/outputs
    }
    if (p.includes("PWM") || p.includes("RED") || p.includes("GREEN") || p.includes("BLUE")) {
      return "#10b981"; // Emerald for PWM / RGB
    }
    if (p.includes("TX") || p.includes("RX")) {
      return "#3b82f6"; // Blue for UART serial communication
    }
    return "#06b6d4"; // Cyan for Digital signals
  };

  // Convert initial connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!initialCircuit?.connections) return [];
    return initialCircuit.connections.map((c) => {
      const wireColor = getWireColor(c.sourcePin);
      return {
        id: c.id,
        source: c.sourceComponentId,
        sourceHandle: c.sourcePin,
        target: c.targetComponentId,
        targetHandle: c.targetPin,
        type: "smoothstep",
        animated: c.status === "proposed",
        style: { stroke: wireColor, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: wireColor },
        data: { status: c.status || "confirmed", evidence: c.evidence || "User connected" },
      };
    });
  }, [initialCircuit]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "inspector" | "warnings">("library");

  // Component Library search and category filter state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");

  // Simulation Engine State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTick, setSimTick] = useState(0);
  const [simSensorValue, setSimSensorValue] = useState(65);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([
    "[SYSTEM] Ready. Click 'Run Simulation' to energize circuit and execute firmware logic.",
  ]);

  // Derived simulation states based on sensor and clock ticks
  const simLedOn = isSimulating && (simSensorValue > 50 || isButtonPressed || simTick % 2 === 0);
  const simServoAngle = isSimulating ? [30, 90, 150, 90][simTick % 4] : 0;
  const simBuzzerActive = isSimulating && (simSensorValue > 80 || isButtonPressed);
  const simRelayActive = isSimulating && (simSensorValue > 60);
  const simOledMsg = isSimulating
    ? `SOIL: ${simSensorValue}% | LED: ${simLedOn ? "ON" : "OFF"}`
    : "128x64 SSD1306";

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setSimTick((t) => {
        const nextTick = t + 1;
        const timestamp = (nextTick * 0.8).toFixed(1);
        const logEntries: string[] = [];

        if (nextTick === 1) {
          logEntries.push(`[${timestamp}s] [BOOT] Microcontroller initialized at 115200 baud`);
          logEntries.push(`[${timestamp}s] [POWER] 3.3V, 5.0V, and 9V voltage rails nominal`);
        }
        if (nextTick % 2 === 0) {
          logEntries.push(
            `[${timestamp}s] [SENSOR] ADC Read: ${Math.round(simSensorValue * 40.95)} (Scaled: ${simSensorValue}%)`
          );
        }
        if (nextTick % 4 === 0) {
          logEntries.push(
            `[${timestamp}s] [ACTUATOR] GPIO Status: LED=${simLedOn ? "HIGH" : "LOW"}, Relay=${simRelayActive ? "CLOSED" : "OPEN"}`
          );
        }
        if (nextTick % 5 === 0) {
          logEntries.push(
            `[${timestamp}s] [IMU] MPU-6050: Accel[X=0.03g, Y=-0.01g, Z=0.99g] Temp: 26.4°C`
          );
        }
        if (nextTick % 6 === 0) {
          logEntries.push(
            `[${timestamp}s] [BUS] I2C Bus @ 0x3C (OLED) & 0x27 (LCD1602) display update OK`
          );
        }
        if (simBuzzerActive && nextTick % 3 === 0) {
          logEntries.push(`[${timestamp}s] [WARN] High threshold trigger -> Buzzer active!`);
        }

        if (logEntries.length > 0) {
          setSerialLogs((prev) => [...prev.slice(-40), ...logEntries]);
        }
        return nextTick;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isSimulating, simSensorValue, isButtonPressed, simLedOn, simRelayActive, simBuzzerActive]);

  // Propagate simulation state to nodes
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSimulating,
          simState: {
            isLedOn: simLedOn,
            servoAngle: simServoAngle,
            oledMessage: simOledMsg,
            buzzerActive: simBuzzerActive,
            relayActive: simRelayActive,
            motorRunning: isSimulating,
            sensorReading: simSensorValue,
            tick: simTick,
          },
        },
      }))
    );
  }, [isSimulating, simTick, simLedOn, simServoAngle, simOledMsg, simBuzzerActive, simRelayActive, simSensorValue, setNodes]);

  // Animate wires when simulating
  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((e) => ({
        ...e,
        animated: isSimulating ? true : e.animated,
        style: {
          ...e.style,
          strokeWidth: isSimulating ? 3 : 2.5,
          filter: isSimulating ? "drop-shadow(0 0 5px rgba(6,182,212,0.6))" : undefined,
        },
      }))
    );
  }, [isSimulating, setEdges]);

  // On connect
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) {
        alert("Cannot connect a component pin to itself.");
        return;
      }

      const wireColor = getWireColor(params.sourceHandle);

      const newEdge: Edge = {
        ...params,
        id: `wire-${Date.now()}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: wireColor, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: wireColor },
        data: { status: "user confirmed", evidence: "Connected in Circuit Studio" },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add component to canvas
  const handleAddComponent = useCallback(
    (type: string) => {
      const def = COMPONENT_DEFINITIONS[type];
      if (!def) return;

      setNodes((nds) => {
        const newId = `${type}-${nds.length + 1}`;
        const newNode: Node = {
          id: newId,
          type: "hardwareNode",
          position: { x: 240 + (nds.length % 5) * 35, y: 140 + (nds.length % 5) * 35 },
          data: {
            label: def.name,
            type: def.type,
            pins: def.pins,
          },
        };
        return [...nds, newNode];
      });
    },
    [setNodes]
  );

  // Delete selected node
  const handleDeleteSelected = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  // Save handler
  const handleSave = async () => {
    setSaveStatus("Saving...");
    const components = nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      label: n.data.label,
      x: n.position.x,
      y: n.position.y,
    }));

    const connections = edges.map((e) => ({
      id: e.id,
      sourceComponentId: e.source,
      sourcePin: e.sourceHandle,
      targetComponentId: e.target,
      targetPin: e.targetHandle,
      status: e.data?.status || "confirmed",
      evidence: e.data?.evidence || "Studio wire",
    }));

    if (onSave) {
      await onSave({ components, connections });
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    if (projectId) {
      try {
        const res = await fetch(`/api/projects/${projectId}/circuit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ components, connections }),
        });
        if (res.ok) {
          setSaveStatus("Saved to Project!");
        } else {
          setSaveStatus("Save failed.");
        }
      } catch (err: any) {
        setSaveStatus("Error saving.");
      }
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      project: projectName,
      exportedAt: new Date().toISOString(),
      components: nodes.map((n) => ({
        id: n.id,
        type: n.data.type,
        label: n.data.label,
        x: n.position.x,
        y: n.position.y,
      })),
      connections: edges.map((e) => ({
        id: e.id,
        from: `${e.source}:${e.sourceHandle}`,
        to: `${e.target}:${e.targetHandle}`,
        status: e.data?.status,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `circuit-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Deterministic Circuit Design Warnings
  const designWarnings = useMemo(() => {
    const warnings: string[] = [];

    // Check each node
    nodes.forEach((node) => {
      const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);
      if (connectedEdges.length === 0) {
        warnings.push(`Component "${node.data.label}" (${node.id}) has no connected pins.`);
      }

      // Check if sensors/actuators have power & ground connected
      const pins: any[] = ((node.data as any)?.pins as any[]) || [];
      const hasVccPin = pins.some((p) => p.type === "power");
      const hasGndPin = pins.some((p) => p.type === "gnd");

      if (hasVccPin) {
        const vccConnected = connectedEdges.some(
          (e) =>
            (e.source === node.id && pins.find((p) => p.id === e.sourceHandle)?.type === "power") ||
            (e.target === node.id && pins.find((p) => p.id === e.targetHandle)?.type === "power")
        );
        if (!vccConnected) {
          warnings.push(`Power pin on "${node.data.label}" appears unconnected.`);
        }
      }

      if (hasGndPin) {
        const gndConnected = connectedEdges.some(
          (e) =>
            (e.source === node.id && pins.find((p) => p.id === e.sourceHandle)?.type === "gnd") ||
            (e.target === node.id && pins.find((p) => p.id === e.targetHandle)?.type === "gnd")
        );
        if (!gndConnected) {
          warnings.push(`Ground pin on "${node.data.label}" appears unconnected.`);
        }
      }
    });

    return warnings;
  }, [nodes, edges]);

  return (
    <div className="flex h-full w-full flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Studio Toolbar - Switch between Diagram Only minimal bar and Full Studio Toolbar */}
      {diagramOnly ? (
        <div className="flex h-11 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
              <Cpu className="h-3.5 w-3.5 text-zinc-500" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{projectName}</span>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {nodes.length} Components • {edges.length} Wires
            </span>
          </div>

          <div className="flex items-center gap-2">
            {allowSimulation && (
              <button
                onClick={() => {
                  setIsSimulating(!isSimulating);
                  if (!isSimulating) setIsTerminalOpen(true);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  isSimulating
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xs"
                }`}
                title="Test hardware logic simulation"
              >
                {isSimulating ? (
                  <>
                    <Pause className="h-3 w-3 fill-current" />
                    <span>Pause Sim</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Test Simulation</span>
                  </>
                )}
              </button>
            )}

            {onOpenStudio && (
              <button
                onClick={onOpenStudio}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
                title="Open in full Circuit Studio"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Open in Full Studio</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Full Studio Toolbar */
        <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {projectName}
              </span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="font-mono text-[11px] text-zinc-500">
              {nodes.length} Components • {edges.length} Wires
            </span>
            {designWarnings.length > 0 && (
              <span
                onClick={() => setActiveTab("warnings")}
                className="cursor-pointer flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              >
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>{designWarnings.length} Warnings</span>
              </span>
            )}
          </div>

          {/* Toolbar Buttons */}
          <div className="flex items-center gap-2">
            {/* Simulation Toggle */}
            {!isSimulating ? (
              <button
                onClick={() => {
                  setIsSimulating(true);
                  setIsTerminalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-all ring-1 ring-emerald-400/40 hover:scale-[1.02]"
                title="Run interactive hardware simulation with real-time animations"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run Simulation</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSimulating(false)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all ring-1 ring-amber-300/40"
                  title="Pause circuit simulation"
                >
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimTick(0);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
                  title="Reset simulation"
                >
                  <Square className="h-3 w-3 fill-current text-zinc-500" />
                  <span>Reset</span>
                </button>
                <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  5V / 3.3V Rails Active
                </span>
              </div>
            )}

            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isTerminalOpen
                  ? "border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-semibold"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
              title="Toggle Serial Monitor Terminal"
            >
              <Terminal className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden md:inline">Serial Monitor</span>
            </button>

            {(selectedNode || selectedEdge) && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-400 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                title="Delete selected item"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
              title="Export circuit data as JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all shadow-xs ${
                saveStatus
                  ? "bg-emerald-600 text-white ring-1 ring-emerald-400"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saveStatus || "Save Circuit"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Drawer / Canvas Sidebar - Hidden in Diagram Only mode */}
        {!diagramOnly && (
          <div className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors ${
                activeTab === "library"
                  ? "border-zinc-900 text-zinc-900 font-semibold dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Components
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors ${
                activeTab === "inspector"
                  ? "border-zinc-900 text-zinc-900 font-semibold dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Inspector
            </button>
            <button
              onClick={() => setActiveTab("warnings")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors flex items-center justify-center gap-1 ${
                activeTab === "warnings"
                  ? "border-amber-500 text-amber-700 dark:text-amber-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span>Warnings</span>
              {designWarnings.length > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 px-1.5 py-0.2 text-[10px] font-bold">
                  {designWarnings.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Component Library */}
          {activeTab === "library" && (
            <div className="flex-1 flex flex-col overflow-hidden text-xs">
              {/* Search Bar & Category Filter */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search 28+ components..."
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-7 text-xs text-zinc-900 placeholder-zinc-400 focus:border-cyan-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  {[
                    { id: "all", label: "All" },
                    { id: "microcontrollers", label: "MCUs" },
                    { id: "sensors", label: "Sensors" },
                    { id: "displays", label: "Displays" },
                    { id: "actuators", label: "Actuators" },
                    { id: "passives", label: "Passives" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCatalogCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium ${
                        catalogCategory === cat.id
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                          : "bg-zinc-200/60 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grouped Component List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {[
                  {
                    id: "microcontrollers",
                    title: "Microcontrollers & Boards",
                    items: ["esp32", "arduino_uno", "arduino_nano", "pico"],
                  },
                  {
                    id: "sensors",
                    title: "Sensors & Detectors",
                    items: [
                      "dht22_sensor",
                      "ultrasonic_sensor",
                      "soil_moisture_sensor",
                      "pir_sensor",
                      "mpu6050",
                      "mq2_gas_sensor",
                      "bmp280",
                      "ir_sensor",
                      "ldr_sensor",
                    ],
                  },
                  {
                    id: "displays",
                    title: "Displays & Visual Outputs",
                    items: ["oled_display", "lcd1602", "seven_segment", "rgb_led", "led"],
                  },
                  {
                    id: "actuators",
                    title: "Motors & Actuators",
                    items: [
                      "servo_motor",
                      "dc_motor",
                      "stepper_motor",
                      "motor_driver",
                      "relay_module",
                      "solenoid",
                      "buzzer",
                    ],
                  },
                  {
                    id: "passives",
                    title: "Passives, Inputs & Power",
                    items: [
                      "resistor",
                      "potentiometer",
                      "push_button",
                      "battery_9v",
                      "bluetooth_hc05",
                    ],
                  },
                ]
                  .filter((group) => catalogCategory === "all" || catalogCategory === group.id)
                  .map((group) => {
                    const filteredItems = group.items.filter((type) => {
                      const def = COMPONENT_DEFINITIONS[type];
                      if (!def) return false;
                      if (!catalogSearch) return true;
                      const q = catalogSearch.toLowerCase();
                      return (
                        def.name.toLowerCase().includes(q) ||
                        type.toLowerCase().includes(q) ||
                        def.pins.some((p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
                      );
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={group.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            {group.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {filteredItems.length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {filteredItems.map((type) => {
                            const def = COMPONENT_DEFINITIONS[type];
                            return (
                              <button
                                key={type}
                                onClick={() => handleAddComponent(type)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-left text-zinc-800 hover:border-cyan-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:border-cyan-600 dark:hover:bg-zinc-800 transition-all group shadow-2xs"
                                title={`Add ${def.name} to canvas`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white p-0.5 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-xs">
                                    <ComponentArtwork type={type} size="sm" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate text-xs">{def.name}</span>
                                    <span className="text-[9px] font-mono text-zinc-400 truncate">
                                      {def.pins.length} Pins • {def.category}
                                    </span>
                                  </div>
                                </div>
                                <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Tab 2: Inspector */}
          {activeTab === "inspector" && (
            <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
              {selectedNode ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                      Selected Component
                    </span>
                    <div className="mt-2 flex items-center gap-2.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
                        <ComponentArtwork type={(selectedNode.data as any)?.type || ""} size="md" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {String((selectedNode.data as any)?.label || "")}
                        </h4>
                        <span className="font-mono text-[10px] text-zinc-500 truncate">
                          ID: {selectedNode.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                      Available Pins
                    </span>
                    <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                      {(((selectedNode.data as any)?.pins as any[]) || []).map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded border border-zinc-200 px-2 py-1 font-mono text-[10px] dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        >
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {p.name}
                          </span>
                          <span className="text-zinc-400 uppercase text-[9px]">{p.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDeleteSelected}
                    className="w-full flex items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 py-1.5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Component</span>
                  </button>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                      Selected Connection
                    </span>
                    <div className="mt-2 flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedEdge.source}:{selectedEdge.sourceHandle}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedEdge.target}:{selectedEdge.targetHandle}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Status: {String((selectedEdge.data as any)?.status || "Confirmed")}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteSelected}
                    className="w-full flex items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 py-1.5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Wire</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                  <Info className="h-6 w-6 mb-2 opacity-50" />
                  <p>Click any component or wire on the canvas to inspect.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Design Warnings */}
          {activeTab === "warnings" && (
            <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2">
              {designWarnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8 mb-2" />
                  <p className="font-medium">No Design Issues Detected</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    All components have valid connections.
                  </p>
                </div>
              ) : (
                designWarnings.map((warn, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span className="text-[11px] leading-relaxed">{warn}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        )}

        {/* Center: The React Flow Canvas */}
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionMode={ConnectionMode.Loose}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: "#06b6d4", strokeWidth: 2.5 }}
            isValidConnection={(c) => c.source !== c.target}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { stroke: "#06b6d4", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
            }}
            onNodeClick={(_, node) => {
              setSelectedNode(node);
              setSelectedEdge(null);
              setActiveTab("inspector");
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdge(edge);
              setSelectedNode(null);
              setActiveTab("inspector");
            }}
            onPaneClick={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-50 dark:bg-zinc-950"
          >
            <Background gap={16} size={1} color="#71717a" className="opacity-20" />
            <Controls className="!bg-white !border-zinc-200 !shadow-sm dark:!bg-zinc-900 dark:!border-zinc-800" />
            {!diagramOnly && (
              <MiniMap
                className="!bg-white !border-zinc-200 dark:!bg-zinc-900 dark:!border-zinc-800 !rounded-lg"
                nodeStrokeColor="#06b6d4"
                nodeColor="#f4f4f5"
              />
            )}
          </ReactFlow>

          {/* Interactive Simulation Controls Overlay */}
          {isSimulating && (
            <div className="absolute top-4 right-4 z-20 w-72 rounded-xl border border-zinc-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Virtual Sensors & Inputs
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  LIVE
                </span>
              </div>

              {/* Sensor Slider */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Sensor Input (Moisture/Temp):</span>
                  <span className="font-bold text-emerald-600">{simSensorValue}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simSensorValue}
                  onChange={(e) => setSimSensorValue(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-emerald-600"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-400 pt-0.5">
                  <button onClick={() => setSimSensorValue(15)} className="hover:text-cyan-600">Dry (15%)</button>
                  <button onClick={() => setSimSensorValue(55)} className="hover:text-cyan-600">Optimal (55%)</button>
                  <button onClick={() => setSimSensorValue(85)} className="hover:text-rose-600 font-bold">Alarm (85%)</button>
                </div>
              </div>

              {/* Virtual Momentary Push Button */}
              <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-zinc-500">Virtual Tactile Switch:</span>
                <button
                  onMouseDown={() => setIsButtonPressed(true)}
                  onMouseUp={() => setIsButtonPressed(false)}
                  onTouchStart={() => setIsButtonPressed(true)}
                  onTouchEnd={() => setIsButtonPressed(false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition-all shadow-xs ${
                    isButtonPressed
                      ? "bg-cyan-600 text-white scale-95 shadow-inner"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {isButtonPressed ? "PRESSED (HIGH)" : "HOLD TO PRESS"}
                </button>
              </div>
            </div>
          )}

          {/* Embedded Monospace Serial Monitor Terminal Drawer */}
          {isTerminalOpen && (
            <div className="absolute bottom-14 left-4 right-4 z-20 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col font-mono text-xs max-h-48">
              <div className="flex items-center justify-between bg-zinc-900/90 px-3 py-1.5 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-bold text-[11px]">Serial Monitor • 115200 Baud (COM3 / /dev/ttyUSB0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSerialLogs([])}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsTerminalOpen(false)}
                    className="text-[11px] text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-[11px] text-emerald-400 selection:bg-emerald-900 selection:text-white">
                {serialLogs.map((log, idx) => (
                  <div key={idx} className="leading-tight">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canvas Floating Legend */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-[10px] font-mono shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Pin Legend:</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Power (3.3/5V)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-zinc-800 dark:bg-zinc-400" /> GND
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Digital
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Analog
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> I2C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
