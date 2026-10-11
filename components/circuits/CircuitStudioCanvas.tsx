"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { HardwareNode } from "./HardwareNode";
import { ComponentArtwork } from "./ComponentArtwork";
import { VirtualSensorsPanel, VirtualSensorValues } from "./VirtualSensorsPanel";
import { SerialMonitorDrawer, SerialLogEntry, TelemetryPoint } from "./SerialMonitorDrawer";
import { COMPONENT_DEFINITIONS, ComponentDefinition } from "@/lib/circuits/registry";
import {
  evaluateCircuitState,
  probePinMultimeter,
  generateBillOfMaterials,
  exportKiCadNetlist,
  CircuitComponent,
  CircuitConnection,
  MultimeterReading,
  DesignRuleIssue,
  BomItem,
} from "@/lib/circuits/engine";
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
  Undo2,
  Redo2,
  Gauge,
  FileCode,
  FileSpreadsheet,
  Flame,
  Wrench,
  ShieldAlert,
  ChevronDown,
  PanelLeft,
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
  projects?: Array<{ id: string; title: string; board?: string }>;
  onSelectProject?: (id: string) => void;
}

interface CircuitSnapshot {
  nodes: Node[];
  edges: Edge[];
}

// Helper function to arrange components in an intuitive 3-column schematic layout:
// Sensors/Inputs on left, Microcontroller in center, Displays/Actuators on right
export function computeAutoLayout(
  components: { id: string; type: string }[]
): Record<string, { x: number; y: number }> {
  const leftCol: string[] = []; // inputs, sensors, passives
  const centerCol: string[] = []; // microcontrollers, power
  const rightCol: string[] = []; // displays, actuators

  components.forEach((c) => {
    const def = COMPONENT_DEFINITIONS[c.type];
    const cat = def?.category;
    if (cat === "microcontrollers") {
      centerCol.push(c.id);
    } else if (cat === "displays" || cat === "actuators") {
      rightCol.push(c.id);
    } else {
      leftCol.push(c.id);
    }
  });

  // If no MCU found, place the first component in center
  if (centerCol.length === 0 && leftCol.length > 0) {
    centerCol.push(leftCol.shift()!);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const X_LEFT = 60;
  const X_CENTER = 420;
  const X_RIGHT = 780;
  const Y_GAP = 260;
  const Y_START = 60;

  leftCol.forEach((id, idx) => {
    positions[id] = { x: X_LEFT, y: Y_START + idx * Y_GAP };
  });

  const maxRows = Math.max(leftCol.length, rightCol.length, 1);
  const centerOffsetY = Math.max(
    Y_START,
    Y_START + ((maxRows - centerCol.length) * Y_GAP) / 2
  );
  centerCol.forEach((id, idx) => {
    positions[id] = { x: X_CENTER, y: centerOffsetY + idx * (Y_GAP + 20) };
  });

  rightCol.forEach((id, idx) => {
    positions[id] = { x: X_RIGHT, y: Y_START + idx * Y_GAP };
  });

  return positions;
}

const emptySubscribe = () => () => {};

export function CircuitStudioCanvas({
  initialCircuit,
  projectId,
  projectName = "Untitled Circuit",
  onSave,
  diagramOnly = false,
  allowSimulation = true,
  onOpenStudio,
  projects,
  onSelectProject,
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
          position: { x: 420, y: 150 },
          data: {
            label: "ESP32 DevKit",
            type: "esp32",
            pins: espDef.pins,
          },
        },
        {
          id: "sensor-1",
          type: "hardwareNode",
          position: { x: 60, y: 150 },
          data: {
            label: "DHT22 Sensor",
            type: "dht22_sensor",
            pins: dhtDef.pins,
          },
        },
      ];
    }

    const comps = initialCircuit.components;
    const hasPositions = comps.every(
      (c) => typeof c.x === "number" && typeof c.y === "number"
    );
    let needsAutoLayout = !hasPositions || diagramOnly;

    if (hasPositions && !needsAutoLayout) {
      for (let i = 0; i < comps.length; i++) {
        for (let j = i + 1; j < comps.length; j++) {
          const dx = Math.abs(comps[i].x - comps[j].x);
          const dy = Math.abs(comps[i].y - comps[j].y);
          if (dx < 260 && dy < 200) {
            needsAutoLayout = true;
            break;
          }
        }
        if (needsAutoLayout) break;
      }
    }

    const autoPositions = needsAutoLayout ? computeAutoLayout(comps) : null;

    return comps.map((comp) => {
      const def = COMPONENT_DEFINITIONS[comp.type] || COMPONENT_DEFINITIONS.esp32;
      const pos = autoPositions?.[comp.id] || { x: comp.x ?? 250, y: comp.y ?? 150 };
      return {
        id: comp.id,
        type: "hardwareNode",
        position: pos,
        data: {
          label: comp.label || def.name,
          type: comp.type,
          pins: def.pins,
          properties: comp.properties,
        },
      };
    });
  }, [initialCircuit, diagramOnly]);

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

  // Convert initial connections to React Flow edges with pin handle sanitization
  const initialEdges: Edge[] = useMemo(() => {
    if (!initialCircuit?.connections) return [];

    const resolvePinHandle = (nodeId: string, requestedPin: string): string => {
      const node = initialNodes.find((n) => n.id === nodeId);
      if (!node || !(node.data as any)?.pins) return requestedPin;
      const pins: any[] = (node.data as any).pins || [];
      if (pins.length === 0) return requestedPin;

      // 1. Exact pin.id match
      if (pins.some((p) => p.id === requestedPin)) return requestedPin;

      // 2. Case-insensitive or pin.name match
      const lower = requestedPin.trim().toLowerCase();
      const match = pins.find(
        (p) => p.id.toLowerCase() === lower || p.name.toLowerCase() === lower || p.name.toLowerCase().startsWith(lower)
      );
      if (match) return match.id;

      // 3. Handle D<n> <-> GPIO<n> mapping (common with ESP32/Arduino)
      if (requestedPin.toUpperCase().startsWith("D")) {
        const num = requestedPin.slice(1);
        const gpio = pins.find((p) => p.id.toUpperCase() === `GPIO${num}` || p.name.toUpperCase().startsWith(`D${num}`));
        if (gpio) return gpio.id;
      }
      if (requestedPin.toUpperCase().startsWith("GPIO")) {
        const num = requestedPin.slice(4);
        const d = pins.find((p) => p.id.toUpperCase() === `D${num}` || p.name.toUpperCase().startsWith(`D${num}`));
        if (d) return d.id;
      }

      // 4. Power & Ground aliases
      if (lower === "vcc" || lower === "vin" || lower === "5v" || lower === "3v3" || lower === "power") {
        const pwr = pins.find((p) => p.type === "power");
        if (pwr) return pwr.id;
      }
      if (lower.includes("gnd") || lower.includes("ground")) {
        const gnd = pins.find((p) => p.type === "gnd");
        if (gnd) return gnd.id;
      }

      // 5. Fallback to first matching type or first available pin to prevent ReactFlow handle error #008
      const digital = pins.find((p) => p.type === "digital" || p.type === "analog" || p.type === "pwm" || p.type === "i2c");
      return digital ? digital.id : pins[0].id;
    };

    return initialCircuit.connections.map((c) => {
      const sourceHandle = resolvePinHandle(c.sourceComponentId, c.sourcePin);
      const targetHandle = resolvePinHandle(c.targetComponentId, c.targetPin);
      const wireColor = getWireColor(sourceHandle);
      return {
        id: c.id,
        source: c.sourceComponentId,
        sourceHandle,
        target: c.targetComponentId,
        targetHandle,
        type: "smoothstep",
        animated: c.status === "proposed",
        style: { stroke: wireColor, strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: wireColor },
        data: { status: c.status || "confirmed", evidence: c.evidence || "User connected" },
      };
    });
  }, [initialCircuit, initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "inspector" | "warnings" | "bom">("library");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as any)) {
        setIsExportOpen(false);
      }
    }
    if (isExportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExportOpen]);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [showLegend, setShowLegend] = useState(false);
  const reactFlowInstance = useRef<any>(null);

  // Undo / Redo History State
  const [history, setHistory] = useState<{
    past: CircuitSnapshot[];
    future: CircuitSnapshot[];
  }>({
    past: [],
    future: [],
  });

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const dragStartSnapshotRef = useRef<CircuitSnapshot | null>(null);

  // Push an immutable snapshot before any modifying action
  const pushSnapshot = useCallback(() => {
    if (!nodesRef.current || !edgesRef.current) return;
    const snap: CircuitSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    };
    setHistory((prev) => ({
      past: [
        ...(prev.past || [])
          .filter(
            (s): s is CircuitSnapshot =>
              Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
          )
          .slice(-29),
        snap,
      ],
      future: [],
    }));
  }, []);

  const canUndo = (history.past || []).some(
    (s) => Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
  );
  const canRedo = (history.future || []).some(
    (s) => Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
  );

  const handleUndo = useCallback(() => {
    const validPast = (history.past || []).filter(
      (s): s is CircuitSnapshot =>
        Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
    );
    if (validPast.length === 0) return;

    const previous = validPast[validPast.length - 1];
    if (!previous || !previous.nodes || !previous.edges) return;

    const newPast = validPast.slice(0, validPast.length - 1);
    const currentSnapshot: CircuitSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current || [])),
      edges: JSON.parse(JSON.stringify(edgesRef.current || [])),
    };

    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNode(null);
    setSelectedEdge(null);

    setHistory({
      past: newPast,
      future: [
        currentSnapshot,
        ...(history.future || []).filter(
          (s): s is CircuitSnapshot =>
            Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
        ),
      ],
    });
  }, [history, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const validFuture = (history.future || []).filter(
      (s): s is CircuitSnapshot =>
        Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
    );
    if (validFuture.length === 0) return;

    const next = validFuture[0];
    if (!next || !next.nodes || !next.edges) return;

    const newFuture = validFuture.slice(1);
    const currentSnapshot: CircuitSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current || [])),
      edges: JSON.parse(JSON.stringify(edgesRef.current || [])),
    };

    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
    setSelectedEdge(null);

    setHistory({
      past: [
        ...(history.past || []).filter(
          (s): s is CircuitSnapshot =>
            Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
        ),
        currentSnapshot,
      ],
      future: newFuture,
    });
  }, [history, setNodes, setEdges]);

  // Global Keyboard shortcuts: Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac =
        typeof window !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && !e.altKey) {
        if (e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (
          (e.key.toLowerCase() === "z" && e.shiftKey) ||
          (e.key.toLowerCase() === "y" && !e.shiftKey)
        ) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Diagram-only auto layout handler
  const handleAutoLayout = useCallback(() => {
    pushSnapshot();
    const layoutPositions = computeAutoLayout(
      nodes.map((n) => ({ id: n.id, type: (n.data as any)?.type || "" }))
    );
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const pos = layoutPositions[node.id];
        return pos ? { ...node, position: pos } : node;
      })
    );
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.25, duration: 300 });
      }
    }, 50);
  }, [nodes, setNodes, pushSnapshot]);

  // Diagram-only fit view handler
  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.25, duration: 300 });
    }
  }, []);

  // Intercept node deletions to capture undo snapshot
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((c) => c.type === "remove")) {
        pushSnapshot();
      }
      onNodesChange(changes);
    },
    [onNodesChange, pushSnapshot]
  );

  // Intercept edge deletions to capture undo snapshot
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some((c) => c.type === "remove")) {
        pushSnapshot();
      }
      onEdgesChange(changes);
    },
    [onEdgesChange, pushSnapshot]
  );

  // Drag handlers to capture component movement in history
  const handleNodeDragStart = useCallback(() => {
    if (!nodesRef.current || !edgesRef.current) return;
    dragStartSnapshotRef.current = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    };
  }, []);

  const handleNodeDragStop = useCallback(() => {
    const startSnapshot = dragStartSnapshotRef.current;
    dragStartSnapshotRef.current = null;
    if (!startSnapshot || !startSnapshot.nodes) return;

    const prevNodes = startSnapshot.nodes;
    const changed = (nodesRef.current || []).some((node) => {
      const prev = prevNodes.find((p) => p.id === node.id);
      return (
        prev &&
        (prev.position.x !== node.position.x ||
          prev.position.y !== node.position.y)
      );
    });

    if (changed) {
      setHistory((prev) => ({
        past: [
          ...(prev.past || [])
            .filter(
              (s): s is CircuitSnapshot =>
                Boolean(s && Array.isArray(s.nodes) && Array.isArray(s.edges))
            )
            .slice(-29),
          startSnapshot,
        ],
        future: [],
      }));
    }
  }, []);

  // Component Library search and category filter state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("all");

  // Simulation Engine State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTick, setSimTick] = useState(0);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [baudRate, setBaudRate] = useState<number>(115200);

  // Rich Virtual Sensors & Inputs state
  const [virtualSensors, setVirtualSensors] = useState<VirtualSensorValues>({
    soilMoisture: 65,
    temperature: 24.5,
    humidity: 55,
    distanceCm: 110,
    lightLux: 420,
    potentiometerVal: 512,
    gasPpm: 120,
    isButtonPressed: false,
    isSwitchLatching: false,
    isMotionTriggered: false,
    isAutoFluctuate: false,
  });

  // Actuator manual overrides & timers via Serial CLI
  const [manualLedOverride, setManualLedOverride] = useState<boolean | null>(null);
  const [manualRelayOverride, setManualRelayOverride] = useState<boolean | null>(null);
  const [buzzerBeepTimer, setBuzzerBeepTimer] = useState<number>(0);

  // Multimeter & interactive circuit physics state
  const [multimeterActive, setMultimeterActive] = useState<boolean>(false);
  const [probedMeasurement, setProbedMeasurement] = useState<MultimeterReading | null>(null);
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const [componentProperties, setComponentProperties] = useState<Record<string, Record<string, any>>>({});

  // Structured Serial Logs & Live Telemetry History for Plotter
  const [structuredLogs, setStructuredLogs] = useState<SerialLogEntry[]>([
    {
      id: "boot-init",
      timestamp: "0.0s",
      tag: "BOOT",
      text: "System Ready. Click 'Run Simulation' to energize circuit and execute real-world firmware logic.",
      raw: "[0.0s] [BOOT] System Ready. Click 'Run Simulation' to energize circuit and execute real-world firmware logic.",
    },
  ]);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Interactive controls
  const handleToggleSwitch = useCallback((nodeId: string) => {
    pushSnapshot();
    setSwitchStates((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, [pushSnapshot]);

  const handleUpdateProperty = useCallback((nodeId: string, key: string, value: any) => {
    setComponentProperties((prev) => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || {}),
        [key]: value,
      },
    }));
  }, []);

  // Adapt nodes and edges to physics engine format
  const circuitComponents: CircuitComponent[] = useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      type: (n.data as any)?.type || "",
      label: (n.data as any)?.label || "",
      x: n.position.x,
      y: n.position.y,
      properties: {
        ...((n.data as any)?.properties || {}),
        ...(componentProperties[n.id] || {}),
        isPressed: Boolean(switchStates[n.id]),
      },
    }));
  }, [nodes, componentProperties, switchStates]);

  const circuitConnections: CircuitConnection[] = useMemo(() => {
    return edges.map((e) => ({
      id: e.id,
      sourceComponentId: e.source,
      sourcePin: e.sourceHandle || "",
      targetComponentId: e.target,
      targetPin: e.targetHandle || "",
      status: (e.data as any)?.status,
      evidence: (e.data as any)?.evidence,
    }));
  }, [edges]);

  // Compute live physics & electrical design state
  const circuitEvaluation = useMemo(() => {
    return evaluateCircuitState(circuitComponents, circuitConnections, {
      virtualSensors,
      gpioOutputs: {
        ...(manualLedOverride !== null
          ? {
              "esp32-1:GPIO4": manualLedOverride,
              "arduino_uno-1:D13": manualLedOverride,
              "arduino_nano-1:D13": manualLedOverride,
            }
          : {}),
      },
      switchStates,
      simTick,
    });
  }, [circuitComponents, circuitConnections, virtualSensors, manualLedOverride, switchStates, simTick]);

  // Actuator active states derived directly from circuit evaluation
  const anyLedActive = useMemo(() => {
    return Object.entries(circuitEvaluation.componentStatuses).some(
      ([id, st]) => id.startsWith("led") && st.actuatorActive && !st.isBurnedOut
    );
  }, [circuitEvaluation]);

  const anyBuzzerActive = useMemo(() => {
    return Object.entries(circuitEvaluation.componentStatuses).some(
      ([id, st]) => id.startsWith("buzzer") && st.actuatorActive
    );
  }, [circuitEvaluation]);

  const anyRelayActive = useMemo(() => {
    return Object.entries(circuitEvaluation.componentStatuses).some(
      ([id, st]) => id.startsWith("relay") && st.actuatorActive
    );
  }, [circuitEvaluation]);

  const simLedOn = anyLedActive;
  const simBuzzerActive = buzzerBeepTimer > 0 || anyBuzzerActive;
  const simRelayActive = anyRelayActive;
  const simServoAngle = Math.round((virtualSensors.potentiometerVal / 1023) * 180);
  const simOledMsg = `SOIL: ${virtualSensors.soilMoisture}% | ${virtualSensors.temperature}°C`;

  // Multimeter pin probe handler
  const handleProbePin = useCallback(
    (nodeId: string, pinId: string) => {
      const reading = probePinMultimeter(
        nodeId,
        pinId,
        circuitComponents,
        circuitEvaluation.pinToNet,
        circuitEvaluation.componentStatuses
      );
      setProbedMeasurement(reading);
    },
    [circuitComponents, circuitEvaluation]
  );

  // Industry-standard KiCad Netlist & Bill of Materials export
  const handleExportKiCad = useCallback(() => {
    const netlistContent = exportKiCadNetlist(projectName, circuitComponents, circuitConnections);
    const blob = new Blob([netlistContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-schematic.net`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectName, circuitComponents, circuitConnections]);

  const handleExportBom = useCallback(() => {
    const bomItems = generateBillOfMaterials(circuitComponents);
    const headers = [
      "Reference",
      "Component Name",
      "Category",
      "Quantity",
      "Specifications",
      "Footprint",
      "Estimated Cost",
    ];
    const rows = bomItems.map((b) => [
      `"${b.refDes}"`,
      `"${b.name}"`,
      `"${b.category}"`,
      b.quantity,
      `"${b.specs}"`,
      `"${b.footprint}"`,
      `"${b.estimatedCost}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-BOM.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectName, circuitComponents]);

  // Virtual Firmware Command Parser (TX interactive terminal)
  const handleSendCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const upper = trimmed.toUpperCase();
    const timestamp = `${(simTick * 0.8).toFixed(1)}s`;

    const newLogs: SerialLogEntry[] = [
      {
        id: `cmd-${Date.now()}-${Math.random()}`,
        timestamp,
        tag: "CMD",
        text: `> ${trimmed}`,
        raw: `[${timestamp}] [CMD] > ${trimmed}`,
      },
    ];

    if (upper === "HELP") {
      newLogs.push({
        id: `reply-${Date.now()}-1`,
        timestamp,
        tag: "INFO",
        text: "Firmware CLI Commands: STATUS, READ SENSORS, LED ON, LED OFF, RELAY ON, RELAY OFF, BEEP, RESET",
        raw: `[${timestamp}] [INFO] Firmware CLI Commands: STATUS, READ SENSORS, LED ON, LED OFF, RELAY ON, RELAY OFF, BEEP, RESET`,
      });
    } else if (upper === "STATUS") {
      newLogs.push({
        id: `reply-${Date.now()}-2`,
        timestamp,
        tag: "INFO",
        text: `Uptime: ${(simTick * 0.8).toFixed(1)}s | Rails: 3.3V=3.29V, 5V=4.98V | Heap: 284KB Free | Clock: 240MHz`,
        raw: `[${timestamp}] [INFO] Uptime: ${(simTick * 0.8).toFixed(1)}s | Rails: 3.3V=3.29V, 5V=4.98V | Heap: 284KB Free | Clock: 240MHz`,
      });
    } else if (upper === "LED ON") {
      setManualLedOverride(true);
      newLogs.push({
        id: `reply-${Date.now()}-3`,
        timestamp,
        tag: "ACTUATOR",
        text: "GPIO Output -> LED Driven HIGH (State = 1)",
        raw: `[${timestamp}] [ACTUATOR] GPIO Output -> LED Driven HIGH (State = 1)`,
      });
    } else if (upper === "LED OFF") {
      setManualLedOverride(false);
      newLogs.push({
        id: `reply-${Date.now()}-4`,
        timestamp,
        tag: "ACTUATOR",
        text: "GPIO Output -> LED Driven LOW (State = 0)",
        raw: `[${timestamp}] [ACTUATOR] GPIO Output -> LED Driven LOW (State = 0)`,
      });
    } else if (upper === "RELAY ON") {
      setManualRelayOverride(true);
      newLogs.push({
        id: `reply-${Date.now()}-5`,
        timestamp,
        tag: "ACTUATOR",
        text: "Relay Coil ENERGIZED -> NO Contact Closed",
        raw: `[${timestamp}] [ACTUATOR] Relay Coil ENERGIZED -> NO Contact Closed`,
      });
    } else if (upper === "RELAY OFF") {
      setManualRelayOverride(false);
      newLogs.push({
        id: `reply-${Date.now()}-6`,
        timestamp,
        tag: "ACTUATOR",
        text: "Relay Coil DE-ENERGIZED -> Contact Open",
        raw: `[${timestamp}] [ACTUATOR] Relay Coil DE-ENERGIZED -> Contact Open`,
      });
    } else if (upper.includes("READ") || upper.includes("SENSORS")) {
      newLogs.push({
        id: `reply-${Date.now()}-7`,
        timestamp,
        tag: "SENSOR",
        text: `Telemetry: Soil=${virtualSensors.soilMoisture}%, Temp=${virtualSensors.temperature}°C, Dist=${virtualSensors.distanceCm}cm, LDR=${virtualSensors.lightLux}lx, Gas=${virtualSensors.gasPpm}ppm, Pot=${virtualSensors.potentiometerVal}`,
        raw: `[${timestamp}] [SENSOR] Telemetry: Soil=${virtualSensors.soilMoisture}%, Temp=${virtualSensors.temperature}°C, Dist=${virtualSensors.distanceCm}cm, LDR=${virtualSensors.lightLux}lx, Gas=${virtualSensors.gasPpm}ppm, Pot=${virtualSensors.potentiometerVal}`,
      });
    } else if (upper === "BEEP" || upper === "BUZZER BEEP") {
      setBuzzerBeepTimer(3);
      newLogs.push({
        id: `reply-${Date.now()}-8`,
        timestamp,
        tag: "ACTUATOR",
        text: "Piezo Buzzer: 2.7kHz PWM tone pulse triggered for 3s",
        raw: `[${timestamp}] [ACTUATOR] Piezo Buzzer: 2.7kHz PWM tone pulse triggered for 3s`,
      });
    } else if (upper === "RESET") {
      setManualLedOverride(null);
      setManualRelayOverride(null);
      newLogs.push({
        id: `reply-${Date.now()}-9`,
        timestamp,
        tag: "BOOT",
        text: "System soft reset executed. Restoring default automated control logic.",
        raw: `[${timestamp}] [BOOT] System soft reset executed. Restoring default automated control logic.`,
      });
    } else {
      newLogs.push({
        id: `reply-${Date.now()}-err`,
        timestamp,
        tag: "WARN",
        text: `Unknown command: '${trimmed}'. Type 'HELP' for supported commands.`,
        raw: `[${timestamp}] [WARN] Unknown command: '${trimmed}'. Type 'HELP' for supported commands.`,
      });
    }

    setStructuredLogs((prev) => [...prev.slice(-100), ...newLogs]);
  }, [simTick, virtualSensors]);

  // Monotonic log ID generator and tick tracking refs
  const simTickRef = useRef(0);
  const logCounterRef = useRef(0);
  const simParamsRef = useRef<{
    virtualSensors: typeof virtualSensors;
    simLedOn: boolean;
    simRelayActive: boolean;
    simBuzzerActive: boolean;
    baudRate: number;
    circuitComponents?: CircuitComponent[];
  }>({
    virtualSensors,
    simLedOn,
    simRelayActive,
    simBuzzerActive,
    baudRate,
    circuitComponents,
  });

  useEffect(() => {
    simParamsRef.current = {
      virtualSensors,
      simLedOn,
      simRelayActive,
      simBuzzerActive,
      baudRate,
      circuitComponents,
    };
  }, [virtualSensors, simLedOn, simRelayActive, simBuzzerActive, baudRate, circuitComponents]);

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (!isSimulating) {
      simTickRef.current = 0;
      return;
    }

    const timer = setInterval(() => {
      const nextTick = simTickRef.current + 1;
      simTickRef.current = nextTick;
      setSimTick(nextTick);

      const {
        virtualSensors: curSensors,
        simLedOn: curLed,
        simRelayActive: curRelay,
        simBuzzerActive: curBuzzer,
        baudRate: curBaud,
        circuitComponents: curComps = [],
      } = simParamsRef.current as any;

      const compTypes = new Set((curComps || []).map((c: any) => (c.type || "").toLowerCase()));
      const hasMcu = compTypes.has("esp32") || compTypes.has("arduino_uno") || compTypes.has("arduino_nano") || compTypes.has("pico") || curComps.length === 0;
      const hasAdc = compTypes.has("soil_moisture_sensor") || compTypes.has("dht22_sensor") || compTypes.has("potentiometer") || compTypes.has("ldr_sensor") || curComps.length === 0;
      const hasActuator = compTypes.has("led") || compTypes.has("relay_module") || compTypes.has("servo_motor") || compTypes.has("dc_motor") || curComps.length === 0;
      const hasImu = compTypes.has("mpu6050");
      const hasI2cBus = compTypes.has("oled_display") || compTypes.has("lcd1602");
      const hasGas = compTypes.has("mq2_gas_sensor");
      const hasSonar = compTypes.has("ultrasonic_sensor");
      const hasBuzzer = compTypes.has("buzzer");

      const timestamp = `${(nextTick * 0.8).toFixed(1)}s`;
      const logEntries: SerialLogEntry[] = [];
      const createId = (prefix: string) => `${prefix}-${++logCounterRef.current}-${nextTick}`;

      if (nextTick === 1 && hasMcu) {
        logEntries.push({
          id: createId("boot"),
          timestamp,
          tag: "BOOT",
          text: `Microcontroller initialized at ${curBaud} baud`,
          raw: `[${timestamp}] [BOOT] Microcontroller initialized at ${curBaud} baud`,
        });
        logEntries.push({
          id: createId("pwr"),
          timestamp,
          tag: "POWER",
          text: "3.3V, 5.0V, and 9V voltage rails nominal",
          raw: `[${timestamp}] [POWER] 3.3V, 5.0V, and 9V voltage rails nominal`,
        });
      }
      if (hasAdc && nextTick % 2 === 0) {
        logEntries.push({
          id: createId("adc"),
          timestamp,
          tag: "SENSOR",
          text: `ADC Read: ${Math.round(curSensors.soilMoisture * 40.95)} (Soil: ${curSensors.soilMoisture}%, Temp: ${curSensors.temperature}°C)`,
          raw: `[${timestamp}] [SENSOR] ADC Read: ${Math.round(curSensors.soilMoisture * 40.95)} (Soil: ${curSensors.soilMoisture}%, Temp: ${curSensors.temperature}°C)`,
        });
      }
      if (hasActuator && nextTick % 4 === 0) {
        logEntries.push({
          id: createId("act"),
          timestamp,
          tag: "ACTUATOR",
          text: `GPIO Status: LED=${curLed ? "HIGH" : "LOW"}, Relay=${curRelay ? "CLOSED" : "OPEN"}`,
          raw: `[${timestamp}] [ACTUATOR] GPIO Status: LED=${curLed ? "HIGH" : "LOW"}, Relay=${curRelay ? "CLOSED" : "OPEN"}`,
        });
      }
      if (hasImu && nextTick % 5 === 0) {
        logEntries.push({
          id: createId("imu"),
          timestamp,
          tag: "IMU",
          text: `MPU-6050: Accel[X=0.03g, Y=-0.01g, Z=0.99g] Temp: ${curSensors.temperature}°C`,
          raw: `[${timestamp}] [IMU] MPU-6050: Accel[X=0.03g, Y=-0.01g, Z=0.99g] Temp: ${curSensors.temperature}°C`,
        });
      }
      if (hasI2cBus && nextTick % 6 === 0) {
        logEntries.push({
          id: createId("bus"),
          timestamp,
          tag: "BUS",
          text: "I2C Bus @ 0x3C (OLED) & 0x27 (LCD1602) display update OK",
          raw: `[${timestamp}] [BUS] I2C Bus @ 0x3C (OLED) & 0x27 (LCD1602) display update OK`,
        });
      }
      if (hasGas && curSensors.gasPpm > 600 && nextTick % 3 === 0) {
        logEntries.push({
          id: createId("warn-gas"),
          timestamp,
          tag: "WARN",
          text: `MQ-2 High gas concentration alert: ${curSensors.gasPpm} PPM!`,
          raw: `[${timestamp}] [WARN] MQ-2 High gas concentration alert: ${curSensors.gasPpm} PPM!`,
        });
      }
      if (hasSonar && curSensors.distanceCm < 25 && nextTick % 3 === 0) {
        logEntries.push({
          id: createId("warn-dist"),
          timestamp,
          tag: "WARN",
          text: `HC-SR04 Proximity warning: Target closer than 25cm (${curSensors.distanceCm}cm)!`,
          raw: `[${timestamp}] [WARN] HC-SR04 Proximity warning: Target closer than 25cm (${curSensors.distanceCm}cm)!`,
        });
      }
      if (hasBuzzer && curBuzzer && nextTick % 3 === 0) {
        logEntries.push({
          id: createId("warn-buzz"),
          timestamp,
          tag: "WARN",
          text: "High threshold trigger -> Buzzer active!",
          raw: `[${timestamp}] [WARN] High threshold trigger -> Buzzer active!`,
        });
      }

      if (logEntries.length > 0) {
        setStructuredLogs((prev) => [...prev.slice(-60), ...logEntries]);
      }

      // Add telemetry point for real-time serial plotter graph
      setTelemetryHistory((prev) => [
        ...prev.slice(-45),
        {
          time: nextTick,
          sensor: curSensors.soilMoisture,
          temp: curSensors.temperature,
          pot: Math.round((curSensors.potentiometerVal / 1023) * 100),
        },
      ]);

      // Decrement buzzer beep timer if active
      if (buzzerBeepTimer > 0) {
        setBuzzerBeepTimer((b) => Math.max(0, b - 1));
      }
    }, 800);

    return () => clearInterval(timer);
  }, [isSimulating]);

  // Derived presentation nodes for React Flow with physics status and interactive handlers
  const displayNodes = useMemo(() => {
    return nodes.map((n) => {
      const status = circuitEvaluation.componentStatuses[n.id];
      return {
        ...n,
        data: {
          ...n.data,
          isSimulating,
          multimeterActive,
          onToggleSwitch: handleToggleSwitch,
          onUpdateProperty: handleUpdateProperty,
          onProbePin: handleProbePin,
          properties: {
            ...((n.data as any)?.properties || {}),
            ...(componentProperties[n.id] || {}),
            isPressed: Boolean(switchStates[n.id]),
          },
          simStatus: status,
          simState: {
            isLedOn: Boolean(status?.actuatorActive && !status?.isBurnedOut),
            servoAngle: simServoAngle,
            oledMessage: status?.operatingState === "displaying" ? simOledMsg : "SSD1306 Disconnected",
            buzzerActive: Boolean(status?.actuatorActive),
            relayActive: Boolean(status?.actuatorActive),
            motorRunning: Boolean(status?.actuatorActive),
            sensorReading: virtualSensors.soilMoisture,
            tick: simTick,
          },
        },
      };
    });
  }, [
    nodes,
    circuitEvaluation,
    isSimulating,
    multimeterActive,
    handleToggleSwitch,
    handleUpdateProperty,
    handleProbePin,
    componentProperties,
    switchStates,
    simServoAngle,
    simOledMsg,
    virtualSensors.soilMoisture,
    simTick,
  ]);

  // Derived presentation edges for React Flow with live wire colors and current animations
  const displayEdges = useMemo(() => {
    return edges.map((e) => {
      const net = circuitEvaluation.pinToNet.get(`${e.source}:${e.sourceHandle}`);
      const isShort = Boolean(net?.isShortCircuit);
      const isLivePower = Boolean(net && net.voltage >= 2.5);
      const wireColor = isShort ? "#ef4444" : getWireColor(e.sourceHandle);

      return {
        ...e,
        animated: isSimulating ? (isShort || isLivePower || Boolean(net?.isDriven)) : e.animated,
        style: {
          ...e.style,
          stroke: wireColor,
          strokeWidth: isShort ? 4 : isSimulating && isLivePower ? 3.5 : 2.5,
          strokeDasharray: isShort ? "5 5" : undefined,
          filter:
            isSimulating && isShort
              ? "drop-shadow(0 0 8px rgba(239,68,68,0.9))"
              : isSimulating && isLivePower
              ? "drop-shadow(0 0 6px rgba(245,158,11,0.7))"
              : undefined,
        },
      };
    });
  }, [edges, circuitEvaluation, isSimulating]);

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

      pushSnapshot();
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, pushSnapshot]
  );

  // Add component to canvas
  const handleAddComponent = useCallback(
    (type: string) => {
      const def = COMPONENT_DEFINITIONS[type];
      if (!def) return;

      pushSnapshot();
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
    [setNodes, pushSnapshot]
  );

  // Delete selected node
  const handleDeleteSelected = () => {
    if (selectedNode || selectedEdge) {
      pushSnapshot();
      if (selectedNode) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
      } else if (selectedEdge) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        setSelectedEdge(null);
      }
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

    if (projectId && projectId !== "temp-builder") {
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
    } else {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: projectName || "Circuit Studio Design",
            description: "Custom circuit designed in Circuit Studio",
            board: "ESP32",
            circuit: { components, connections },
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setSaveStatus("Saved to Workspaces!");
          if (onSelectProject && data.project?.id) {
            onSelectProject(data.project.id);
          }
        } else {
          setSaveStatus("Save failed.");
        }
      } catch (err) {
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

  // Deterministic Real Circuit Design Rule Checks (DRC)
  const designRules: DesignRuleIssue[] = circuitEvaluation.designRules;
  const designWarnings = useMemo(() => {
    return designRules.map((r) => r.message);
  }, [designRules]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
          Initializing Circuit Canvas...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      {/* Studio Toolbar - Switch between Diagram Only minimal bar and Full Studio Toolbar */}
      {diagramOnly ? (
        <div className="flex h-11 items-center justify-between border-b border-zinc-200 bg-white/95 px-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur shrink-0 z-10 gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 sm:px-2.5 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate min-w-0 shrink">
              <Cpu className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px] whitespace-nowrap" title={projectName}>{projectName}</span>
            </div>
            <span className="hidden xl:inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap shrink-0">
              {nodes.length} parts · {edges.length} wires
            </span>
            {isSimulating && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/20 dark:text-emerald-300 shrink-0 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Signals Flowing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Undo / Redo */}
            <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 p-0.5 shrink-0">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1 rounded text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-25 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                title="Undo circuit change (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1 rounded text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-25 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                title="Redo circuit change (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {allowSimulation && (
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold shadow-xs transition-all shrink-0 whitespace-nowrap ${
                  isSimulating
                    ? "bg-amber-500 hover:bg-amber-400 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
                title={isSimulating ? "Pause circuit simulation" : "Run interactive live simulation"}
              >
                {isSimulating ? (
                  <>
                    <Pause className="h-3 w-3 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Simulate</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors shrink-0 whitespace-nowrap"
              title="Auto-organize components to avoid overlapping"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline">Layout</span>
            </button>

            <button
              onClick={handleFitView}
              className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shrink-0"
              title="Fit diagram to canvas"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${
                showLegend
                  ? "border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-semibold"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
              title="Show wire color & pin semantics legend"
            >
              <Info className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden lg:inline">Legend</span>
            </button>

            {onOpenStudio && (
              <button
                onClick={onOpenStudio}
                className="flex items-center gap-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white px-2.5 py-1 text-xs font-semibold transition-all shadow-xs shrink-0 whitespace-nowrap"
                title="Open in full Circuit Studio to edit and simulate"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Full Studio Toolbar */
        <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-white px-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-900 shrink-0 gap-2 min-w-0">
          {/* Left: Sidebar toggle, Workspace / Title, Net Stats, Warnings */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
            {!diagramOnly && (
              <button
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={`p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 ${
                  !isSidebarOpen ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
                }`}
                title={isSidebarOpen ? "Collapse sidebar drawer" : "Expand sidebar drawer"}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            {projects && onSelectProject ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <Cpu className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <select
                  value={projectId}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 max-w-[130px] sm:max-w-[200px] truncate"
                  title="Switch workspace"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.board ? `(${p.board})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <Cpu className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span
                  className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] sm:max-w-[180px] whitespace-nowrap"
                  title={projectName}
                >
                  {projectName}
                </span>
              </div>
            )}

            <span className="hidden xl:inline text-zinc-300 dark:text-zinc-700">|</span>
            <span className="hidden xl:inline font-mono text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
              {nodes.length} parts · {edges.length} wires
            </span>

            {/* Undo / Redo */}
            <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 p-0.5 shrink-0">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1 rounded text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-25 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1 rounded text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-25 disabled:cursor-not-allowed dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Warnings Pill */}
            {designWarnings.length > 0 && (
              <button
                onClick={() => {
                  setIsSidebarOpen(true);
                  setActiveTab("warnings");
                }}
                className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-500/20 hover:bg-amber-500/20 dark:text-amber-300 transition-colors shrink-0 whitespace-nowrap"
                title="View design rule check warnings"
              >
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span>{designWarnings.length}</span>
              </button>
            )}

            {/* Rails Live Badge */}
            {isSimulating && (
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-500/20 dark:text-emerald-300 shrink-0 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Rails Live
              </span>
            )}
          </div>

          {/* Right: Simulation, Diagnostic tools, Delete, Export Dropdown, Save */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Simulation Controls */}
            {!isSimulating ? (
              <button
                onClick={() => {
                  setIsSimulating(true);
                  setIsTerminalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition-all shrink-0 whitespace-nowrap"
                title="Run interactive hardware simulation"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Simulate</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsSimulating(false)}
                  className="flex items-center gap-1 rounded-md bg-amber-500 hover:bg-amber-400 px-2 py-1 text-xs font-semibold text-white shadow-xs transition-all whitespace-nowrap"
                  title="Pause circuit simulation"
                >
                  <Pause className="h-3 w-3 fill-current" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSimTick(0);
                  }}
                  className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors whitespace-nowrap"
                  title="Reset simulation"
                >
                  <Square className="h-3 w-3 fill-current text-zinc-500" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            )}

            {/* Multimeter */}
            <button
              onClick={() => setMultimeterActive(!multimeterActive)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${
                multimeterActive
                  ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold ring-1 ring-amber-500"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
              title="Toggle Virtual Multimeter / Logic Probe"
            >
              <Gauge className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline">Meter</span>
            </button>

            {/* Serial Monitor */}
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${
                isTerminalOpen
                  ? "border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 font-semibold"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
              title="Toggle Serial Monitor & Telemetry Drawer"
            >
              <Terminal className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden md:inline">Serial</span>
            </button>

            {/* Delete Selected */}
            {(selectedNode || selectedEdge) && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-1 text-xs font-medium transition-colors shrink-0 whitespace-nowrap"
                title="Delete selected item (Delete key)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Delete</span>
              </button>
            )}

            {/* Consolidated Export Dropdown */}
            <div className="relative shrink-0" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors whitespace-nowrap"
                title="Export circuit schematics and BOM"
              >
                <Download className="h-3.5 w-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => {
                      handleExportKiCad();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <FileCode className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="font-medium">KiCad Netlist</div>
                      <div className="text-[10px] text-zinc-400">PCB layout (.net)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleExportBom();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-sky-500" />
                    <div>
                      <div className="font-medium">Bill of Materials</div>
                      <div className="text-[10px] text-zinc-400">Part list (.csv)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      handleExportJson();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <Download className="h-4 w-4 text-amber-500" />
                    <div>
                      <div className="font-medium">Circuit JSON</div>
                      <div className="text-[10px] text-zinc-400">Raw data (.json)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all shadow-xs shrink-0 whitespace-nowrap ${
                saveStatus
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saveStatus || "Save"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Drawer / Canvas Sidebar - Hidden in Diagram Only mode or when collapsed */}
        {!diagramOnly && isSidebarOpen && (
          <div className="w-68 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col shrink-0">
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
              Parts
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors ${
                activeTab === "inspector"
                  ? "border-zinc-900 text-zinc-900 font-semibold dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Inspect
            </button>
            <button
              onClick={() => setActiveTab("warnings")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors flex items-center justify-center gap-1 ${
                activeTab === "warnings"
                  ? "border-amber-500 text-amber-700 dark:text-amber-400 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span>DRC</span>
              {designRules.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  designRules.some(r => r.severity === "critical")
                    ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/60 dark:text-red-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
                }`}>
                  {designRules.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("bom")}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-colors ${
                activeTab === "bom"
                  ? "border-zinc-900 text-zinc-900 font-semibold dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              BOM
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

          {/* Tab 3: Design Rules & Electrical Checks (DRC) */}
          {activeTab === "warnings" && (
            <div className="flex-1 overflow-y-auto p-3 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                  Design Rule Check (DRC)
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {designRules.length} {designRules.length === 1 ? "rule flagged" : "rules flagged"}
                </span>
              </div>

              {designRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8 mb-2" />
                  <p className="font-medium">All Design Rules Passed</p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    No short-circuits, overcurrent, or voltage violations detected.
                  </p>
                </div>
              ) : (
                designRules.map((rule) => {
                  const isCritical = rule.severity === "critical";
                  const isWarning = rule.severity === "warning";
                  return (
                    <div
                      key={rule.id}
                      className={`rounded-lg border p-2.5 space-y-1.5 transition-all ${
                        isCritical
                          ? "border-red-300 bg-red-50/70 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 shadow-2xs"
                          : isWarning
                          ? "border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-2xs"
                          : "border-sky-300 bg-sky-50/70 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            isCritical
                              ? "bg-red-600 text-white"
                              : isWarning
                              ? "bg-amber-600 text-white"
                              : "bg-sky-600 text-white"
                          }`}
                        >
                          {rule.severity}
                        </span>
                        <span className="font-semibold text-xs truncate flex-1 ml-1">{rule.title}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{rule.message}</p>
                      {rule.fixRecommendation && (
                        <div className="pt-1 mt-1 border-t border-black/10 dark:border-white/10 text-[10px] flex items-start gap-1 font-mono">
                          <Wrench className="h-3 w-3 shrink-0 mt-0.5 text-zinc-500" />
                          <span>Fix: {rule.fixRecommendation}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 4: Bill of Materials (BOM) */}
          {activeTab === "bom" && (
            <div className="flex-1 overflow-y-auto p-3 text-xs flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                  Bill of Materials (BOM)
                </span>
                <button
                  onClick={handleExportBom}
                  className="flex items-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300"
                  title="Download BOM as CSV"
                >
                  <Download className="h-3 w-3" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="mt-2 space-y-2 flex-1 overflow-y-auto">
                {generateBillOfMaterials(circuitComponents).map((item) => (
                  <div
                    key={item.refDes}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                        {item.refDes}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.estimatedCost}
                      </span>
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono leading-tight">
                      {item.specs}
                    </div>
                    <div className="text-[9px] text-zinc-400 font-mono flex items-center justify-between pt-0.5">
                      <span>Pkg: {item.footprint}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Center: The React Flow Canvas */}
        <div className="flex-1 h-full w-full relative">
          {/* Floating Digital Multimeter (DMM) HUD */}
          {multimeterActive && (
            <div className="absolute top-4 right-4 z-30 w-84 rounded-xl border border-amber-500/80 bg-zinc-950/95 p-3.5 text-zinc-100 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="flex items-center gap-1.5 font-bold text-amber-400 text-xs tracking-wider">
                  <Gauge className="h-4 w-4" />
                  DIGITAL MULTIMETER (DMM)
                </span>
                <button
                  onClick={() => setMultimeterActive(false)}
                  className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Close Multimeter HUD"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 7-Segment style LCD Readout */}
              <div className="my-2.5 rounded-lg border border-zinc-800 bg-black/80 p-2.5 shadow-inner">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">DC VOLTAGE</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      probedMeasurement?.logicState === "POWER"
                        ? "bg-rose-950 text-rose-400 border border-rose-800"
                        : probedMeasurement?.logicState === "GND"
                        ? "bg-zinc-800 text-zinc-300"
                        : probedMeasurement?.logicState === "HIGH"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {probedMeasurement?.logicState || "READY"}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="font-mono text-3xl font-extrabold tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    {probedMeasurement ? probedMeasurement.voltageDisplay : "0.00 V"}
                  </div>
                  <div className="text-right text-[11px] font-semibold text-amber-300">
                    {probedMeasurement ? `${probedMeasurement.currentMa.toFixed(1)} mA` : "0.0 mA"}
                  </div>
                </div>
              </div>

              {/* Probe Lead Point Info */}
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Probed Target:</span>
                  <span className="font-bold text-zinc-200 truncate max-w-[170px]" title={probedMeasurement?.label || ""}>
                    {probedMeasurement?.label || "None (Click pin on canvas)"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Electrical Net:</span>
                  <span className="text-cyan-400 truncate max-w-[170px]">
                    {probedMeasurement?.netName || "--"}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-1.5">
                Tip: Click any pin handle or component pin on the canvas to probe live voltage & signal.
              </p>
            </div>
          )}

          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
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
            fitViewOptions={{ padding: 0.25 }}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
              setTimeout(() => {
                instance.fitView({ padding: 0.25 });
              }, 80);
            }}
            colorMode="system"
            className="bg-zinc-50 dark:bg-zinc-950"
          >
            <Background gap={16} size={1} color="#71717a" className="opacity-20" />
            <Controls
              position={diagramOnly ? "bottom-left" : "top-left"}
              className="!bg-white !border-zinc-200 !shadow-xs dark:!bg-zinc-900 dark:!border-zinc-800 rounded-lg overflow-hidden [&_button]:!bg-white [&_button]:!border-b-zinc-200 [&_button]:!text-zinc-900 [&_button_svg]:!fill-zinc-900 hover:[&_button]:!bg-zinc-100 hover:[&_button_svg]:!fill-black dark:[&_button]:!bg-zinc-900 dark:[&_button]:!border-b-zinc-800 dark:[&_button]:!text-zinc-100 dark:[&_button_svg]:!fill-zinc-100 dark:hover:[&_button]:!bg-zinc-800 dark:hover:[&_button_svg]:!fill-white [&_button:last-child]:!border-b-0"
            >
              <ControlButton
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
                className="disabled:!opacity-30 disabled:!cursor-not-allowed !flex !items-center !justify-center"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </ControlButton>
              <ControlButton
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
                className="disabled:!opacity-30 disabled:!cursor-not-allowed !flex !items-center !justify-center"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </ControlButton>
            </Controls>
            {!diagramOnly && (
              <MiniMap
                position="bottom-right"
                className={`!bg-white !border-zinc-200 dark:!bg-zinc-900 dark:!border-zinc-800 !rounded-lg transition-all ${
                  isTerminalOpen ? "hidden md:block !bottom-76" : ""
                }`}
                nodeStrokeColor="#06b6d4"
                nodeColor="#f4f4f5"
              />
            )}
          </ReactFlow>

          {/* Floating Wire & Pin Semantics Legend in Diagram Only mode */}
          {diagramOnly && showLegend && (
            <div className="absolute top-3 right-3 z-20 w-64 rounded-xl border border-zinc-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-sky-500" />
                  Wire & Pin Semantics
                </span>
                <button
                  onClick={() => setShowLegend(false)}
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  title="Close legend"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Power Rails
                  </span>
                  <span className="text-zinc-400">3.3V / 5V / VIN</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-zinc-800 dark:bg-zinc-400" /> Ground
                  </span>
                  <span className="text-zinc-400">GND</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" /> Digital I/O
                  </span>
                  <span className="text-zinc-400">GPIO / Signals</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Analog
                  </span>
                  <span className="text-zinc-400">ADC / Sensors</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-purple-500" /> I2C Bus
                  </span>
                  <span className="text-zinc-400">SDA / SCL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> PWM / Motor
                  </span>
                  <span className="text-zinc-400">Speed / Angle</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Simulation Controls Overlay */}
          {!diagramOnly && (
            <VirtualSensorsPanel
              isSimulating={isSimulating}
              values={virtualSensors}
              onChange={setVirtualSensors}
              activeComponentTypes={nodes.map((n) => (n.data as any)?.type || "")}
            />
          )}

          {/* Embedded Monospace Serial Monitor & Waveform Plotter Drawer */}
          {!diagramOnly && (
            <SerialMonitorDrawer
              isOpen={isTerminalOpen}
              onClose={() => setIsTerminalOpen(false)}
              logs={structuredLogs}
              onClearLogs={() => setStructuredLogs([])}
              onSendCommand={handleSendCommand}
              baudRate={baudRate}
              onBaudRateChange={setBaudRate}
              telemetryHistory={telemetryHistory}
              isSimulating={isSimulating}
            />
          )}

          {/* Canvas Floating Legend - automatically hides when terminal drawer is open or diagramOnly */}
          {!diagramOnly && !isTerminalOpen && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/90 px-3 py-1.5 text-[10px] font-mono shadow-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400">
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
          )}
        </div>
      </div>
    </div>
  );
}
