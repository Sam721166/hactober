"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileCode,
  Play,
  Save,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Plus,
  Trash2,
  Code2,
  ChevronDown,
  Sparkles,
  Zap,
  Radio,
  FileCheck,
  Maximize2,
  Minimize2,
  Terminal,
  Layers,
  Info,
  Clock,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  analyzeFirmware,
  extractPinsFromCode,
  generatePinHeader,
  generatePlatformIoIni,
  ExtractedPin,
  FirmwareAnalysisResult,
} from "@/lib/analysis/firmware";

interface FirmwareIDEProps {
  projectId: string;
  projectName?: string;
  initialCode: string;
  circuitConnections?: any[];
  onSave: (filename: string, code: string) => Promise<boolean | void>;
  onSwitchToCircuitTab?: () => void;
  className?: string;
}

interface IDEFile {
  name: string;
  content: string;
  isReadOnly?: boolean;
}

const SNIPPET_TEMPLATES = [
  {
    title: "Heartbeat / Blink LED",
    description: "Classic blinking heartbeat LED on standard pin 13",
    code: `// Heartbeat LED
const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(100);
  digitalWrite(LED_PIN, LOW);
  delay(900);
}
`,
  },
  {
    title: "Non-Blocking Millis() Timer",
    description: "Multi-tasking loop execution without blocking delays",
    code: `// Non-blocking timer task using millis()
unsigned long lastHeartbeat = 0;
const unsigned long INTERVAL_MS = 1000;
bool ledState = false;

void setup() {
  Serial.begin(115200);
  pinMode(13, OUTPUT);
  Serial.println("Non-blocking scheduler initialized.");
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastHeartbeat >= INTERVAL_MS) {
    lastHeartbeat = currentMillis;
    ledState = !ledState;
    digitalWrite(13, ledState ? HIGH : LOW);
    Serial.print("Tick at ms: ");
    Serial.println(currentMillis);
  }

  // Other sensors can execute here without being blocked!
}
`,
  },
  {
    title: "Analog Sensor Smoother (Moving Average)",
    description: "Reads ADC pin A0 and averages samples to filter noise",
    code: `// Analog Sensor with 10-sample moving average filter
const int SENSOR_PIN = A0;
const int NUM_READINGS = 10;
int readings[NUM_READINGS];
int readIndex = 0;
long total = 0;

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);
  for (int i = 0; i < NUM_READINGS; i++) readings[i] = 0;
}

void loop() {
  total = total - readings[readIndex];
  readings[readIndex] = analogRead(SENSOR_PIN);
  total = total + readings[readIndex];
  readIndex = (readIndex + 1) % NUM_READINGS;

  int average = total / NUM_READINGS;
  Serial.print("Smoothed Value: ");
  Serial.println(average);
  delay(50);
}
`,
  },
  {
    title: "I2C Bus Scanner",
    description: "Scans standard Wire I2C addresses (0x01 to 0x7E)",
    code: `#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(115200);
  while (!Serial);
  Serial.println("\\n--- I2C Bus Scanner ---");
}

void loop() {
  byte count = 0;
  for (byte address = 1; address < 127; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      count++;
    }
  }
  if (count == 0) Serial.println("No I2C devices attached.\\n");
  delay(5000);
}
`,
  },
  {
    title: "ESP32 WiFi Station Boilerplate",
    description: "Connects to WiFi network and prints assigned IP",
    code: `#include <WiFi.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Application telemetry payload
  delay(1000);
}
`,
  },
];

const BOARD_OPTIONS = [
  { id: "esp32", label: "ESP32 DevKit (WROOM-32)" },
  { id: "uno", label: "Arduino Uno (ATmega328P)" },
  { id: "nano", label: "Arduino Nano (ATmega328P)" },
  { id: "pico", label: "Raspberry Pi Pico (RP2040)" },
  { id: "nodemcu", label: "ESP8266 NodeMCU" },
];

export function FirmwareIDE({
  projectId,
  projectName,
  initialCode,
  circuitConnections = [],
  onSave,
  onSwitchToCircuitTab,
  className = "",
}: FirmwareIDEProps) {
  // Multi-file state
  const [files, setFiles] = useState<IDEFile[]>([
    {
      name: "main.ino",
      content: initialCode || `// CircuitDoctor Firmware Project
void setup() {
  Serial.begin(115200);
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`,
    },
    {
      name: "config.h",
      content: generatePinHeader(circuitConnections),
    },
    {
      name: "secrets.h",
      content: `// Hardware credentials & network configuration
#ifndef SECRETS_H
#define SECRETS_H

#define WIFI_SSID     "WIFI_NETWORK_NAME"
#define WIFI_PASS     "SUPER_SECRET_KEY"
#define TELEMETRY_KEY "cd_live_token_default"

#endif
`,
    },
  ]);

  const [activeFileName, setActiveFileName] = useState<string>("main.ino");
  const [selectedBoard, setSelectedBoard] = useState("esp32");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"diagnostics" | "pins" | "platformio">("diagnostics");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showSnippetsMenu, setShowSnippetsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Active file pointer
  const activeFile = useMemo(() => {
    return files.find((f) => f.name === activeFileName) || files[0];
  }, [files, activeFileName]);

  // Main code for static analysis
  const mainFile = useMemo(() => {
    return files.find((f) => f.name === "main.ino") || files[0];
  }, [files]);

  // Perform static firmware analysis
  const analysis: FirmwareAnalysisResult = useMemo(() => {
    return analyzeFirmware(mainFile.content);
  }, [mainFile.content]);

  // Sync initialCode prop updates if received from parent
  useEffect(() => {
    if (initialCode && files[0].name === "main.ino" && !files[0].content.trim()) {
      setFiles((prev) =>
        prev.map((f) => (f.name === "main.ino" ? { ...f, content: initialCode } : f))
      );
    }
  }, [initialCode]);

  // Handle textarea text change
  const handleContentChange = (newVal: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newVal } : f))
    );
    setSaveSuccess(false);
  };

  // Synchronize scroll between gutter and textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Track cursor position
  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    const { selectionStart, value } = textareaRef.current;
    const textUpToCursor = value.substring(0, selectionStart);
    const lines = textUpToCursor.split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Keyboard shortcut & indentation handling (Tab = 2 spaces)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      // Insert 2 spaces
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      handleContentChange(newVal);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  // Save active firmware code
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(activeFile.name, activeFile.content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download active file
  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Download platformio.ini
  const handleDownloadPlatformIo = () => {
    const iniContent = generatePlatformIoIni(selectedBoard, analysis.baudRate || 115200);
    const blob = new Blob([iniContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platformio.ini";
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Insert code snippet
  const handleInsertSnippet = (snippetCode: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const newVal = val.substring(0, start) + "\n" + snippetCode + "\n" + val.substring(end);
    handleContentChange(newVal);
    setShowSnippetsMenu(false);
  };

  // Sync pins from circuit connections
  const handleSyncPinsFromCircuit = () => {
    const pinHeader = generatePinHeader(circuitConnections);
    // Update config.h or insert into active file
    setFiles((prev) => {
      const hasConfig = prev.some((f) => f.name === "config.h");
      if (hasConfig) {
        return prev.map((f) => (f.name === "config.h" ? { ...f, content: pinHeader } : f));
      }
      return [...prev, { name: "config.h", content: pinHeader }];
    });
    setActiveFileName("config.h");
  };

  // Add new file tab
  const handleAddNewFile = () => {
    const filename = prompt("Enter new file name (e.g., sensors.h):", "hardware.h");
    if (!filename) return;
    const cleanName = filename.trim();
    if (files.some((f) => f.name === cleanName)) {
      alert("A file with this name already exists.");
      return;
    }
    const newFile: IDEFile = {
      name: cleanName,
      content: `// ${cleanName}\n#ifndef ${cleanName.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}\n#define ${cleanName.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}\n\n// Add module declarations\n\n#endif\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileName(cleanName);
  };

  // Close custom file tab
  const handleCloseFile = (fileNameToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileNameToClose === "main.ino") return; // cannot close primary file
    setFiles((prev) => prev.filter((f) => f.name !== fileNameToClose));
    if (activeFileName === fileNameToClose) {
      setActiveFileName("main.ino");
    }
  };

  // Compute line count for gutter
  const activeLines = useMemo(() => {
    return activeFile.content.split("\n");
  }, [activeFile.content]);

  // Warning lines map for gutter markers
  const warningLinesSet = useMemo(() => {
    const set = new Set<number>();
    if (activeFileName === "main.ino") {
      analysis.blockingDelays.forEach((d) => set.add(d.line));
    }
    return set;
  }, [analysis.blockingDelays, activeFileName]);

  return (
    <div className={`flex flex-col h-full w-full bg-[#0d0f14] text-zinc-100 select-none overflow-hidden ${className}`}>
      {/* Top IDE Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-[#12151d] px-3 py-1.5 gap-2 shrink-0">
        {/* Left: File Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 no-scrollbar">
          {files.map((file) => {
            const isActive = file.name === activeFileName;
            return (
              <div
                key={file.name}
                onClick={() => setActiveFileName(file.name)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#1b202c] text-cyan-300 border-cyan-800/60 shadow-xs font-semibold"
                    : "text-zinc-400 border-transparent hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <FileCode className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                <span>{file.name}</span>
                {file.name !== "main.ino" && (
                  <button
                    onClick={(e) => handleCloseFile(file.name, e)}
                    className="opacity-0 group-hover:opacity-100 ml-1 hover:text-rose-400 text-zinc-500 rounded p-0.5"
                    title="Close file"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleAddNewFile}
            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded transition-colors"
            title="Create new header file"
          >
            <Plus className="h-3 w-3" />
            <span className="text-[11px] font-mono">New File</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Board Profile Selector */}
          <div className="relative">
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 rounded px-2.5 py-1 pr-6 text-[11px] font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {BOARD_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 absolute right-1.5 top-2 pointer-events-none text-zinc-500" />
          </div>

          {/* Sync Pins from Circuit Button */}
          <button
            onClick={handleSyncPinsFromCircuit}
            className="flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Auto-generate C #define pin constants from Circuit Studio wires"
          >
            <Layers className="h-3 w-3 text-cyan-400" />
            <span className="hidden sm:inline">Sync Circuit Pins</span>
          </button>

          {/* Snippets Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSnippetsMenu(!showSnippetsMenu)}
              className="flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Code2 className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Snippets</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {showSnippetsMenu && (
              <div className="absolute right-0 mt-1 w-72 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50 p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                  Insert Firmware Boilerplate
                </div>
                {SNIPPET_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsertSnippet(tmpl.code)}
                    className="w-full text-left p-2 rounded hover:bg-zinc-800/80 text-zinc-200 transition-colors group"
                  >
                    <div className="font-mono text-xs font-semibold text-cyan-300 group-hover:text-cyan-200">
                      {tmpl.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 rounded border border-zinc-700/70 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Download className="h-3 w-3 text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-52 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50 p-1 space-y-0.5 font-mono text-xs">
                <button
                  onClick={handleDownloadFile}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Download {activeFileName}</span>
                </button>
                <button
                  onClick={handleDownloadPlatformIo}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Settings className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download platformio.ini</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copy Code to Clipboard</span>
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-mono font-semibold transition-all ${
              saveSuccess
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600"
            }`}
          >
            {saveSuccess ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : (
              <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            )}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}</span>
          </button>

          {/* Run in Circuit Studio Simulation */}
          {onSwitchToCircuitTab && (
            <button
              onClick={onSwitchToCircuitTab}
              className="flex items-center gap-1.5 rounded bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-3 py-1 text-[11px] font-mono font-bold text-white shadow-sm transition-all"
              title="Test this firmware live in Circuit Studio simulator"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>Run in Simulator</span>
            </button>
          )}

          {/* Toggle Inspector Pane */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors ${
              isInspectorOpen ? "bg-zinc-800 text-zinc-200" : ""
            }`}
            title={isInspectorOpen ? "Collapse Inspector" : "Expand Inspector"}
          >
            {isInspectorOpen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Surface */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0f14] overflow-hidden">
          <div className="flex-1 flex overflow-hidden relative">
            {/* Synchronized Gutter Line Numbers */}
            <div
              ref={gutterRef}
              className="w-12 bg-[#0a0c10] text-zinc-600 text-[11px] font-mono select-none py-3 px-2 text-right border-r border-zinc-800/80 overflow-hidden shrink-0 space-y-0 leading-6"
            >
              {activeLines.map((_, index) => {
                const lineNum = index + 1;
                const isCurrent = cursorPos.line === lineNum;
                const hasWarning = warningLinesSet.has(lineNum);

                return (
                  <div
                    key={lineNum}
                    className={`flex items-center justify-end gap-1 ${
                      isCurrent ? "text-cyan-400 font-bold" : ""
                    }`}
                  >
                    {hasWarning && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={activeFile.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onScroll={handleScroll}
              onKeyUp={handleCursorMove}
              onClick={handleCursorMove}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="flex-1 h-full w-full bg-[#0d0f14] text-zinc-100 p-3 font-mono text-xs sm:text-[13px] leading-6 resize-none focus:outline-none selection:bg-cyan-900/50 selection:text-white overflow-auto no-scrollbar whitespace-pre tab-2"
              placeholder="// Write Arduino C++ firmware code here..."
            />
          </div>

          {/* Editor Status Bar */}
          <div className="flex items-center justify-between border-t border-zinc-800/80 bg-[#0a0c10] px-3 py-1 text-[11px] font-mono text-zinc-400 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-zinc-300">
                <FileCode className="h-3 w-3 text-cyan-400" />
                {activeFile.name}
              </span>
              <span>•</span>
              <span>C++ (Arduino)</span>
              <span>•</span>
              <span>Spaces: 2</span>
              <span>•</span>
              <span>UTF-8</span>
            </div>

            <div className="flex items-center gap-3">
              {analysis.baudRate && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Radio className="h-3 w-3" />
                  {analysis.baudRate} Baud
                </span>
              )}
              {analysis.blockingDelays.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {analysis.blockingDelays.length} Blocking Delay{analysis.blockingDelays.length > 1 ? "s" : ""}
                </span>
              )}
              <span>
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
              <span className="text-zinc-500">
                {activeLines.length} lines • {activeFile.content.length} chars
              </span>
            </div>
          </div>
        </div>

        {/* Right Collapsible Inspector */}
        {isInspectorOpen && (
          <div className="w-80 md:w-96 border-l border-zinc-800 bg-[#12151d] flex flex-col shrink-0 overflow-hidden text-xs font-mono">
            {/* Inspector Navigation Tabs */}
            <div className="flex items-center border-b border-zinc-800 bg-[#0e1118] px-2 pt-2 gap-1 shrink-0">
              <button
                onClick={() => setInspectorTab("diagnostics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs transition-colors border-b-2 ${
                  inspectorTab === "diagnostics"
                    ? "border-cyan-400 text-cyan-300 bg-[#12151d] font-bold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Linter</span>
                {analysis.diagnostics.filter((d) => d.type === "warning").length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[10px]">
                    {analysis.diagnostics.filter((d) => d.type === "warning").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setInspectorTab("pins")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs transition-colors border-b-2 ${
                  inspectorTab === "pins"
                    ? "border-cyan-400 text-cyan-300 bg-[#12151d] font-bold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Pins ({analysis.extractedPins.length})</span>
              </button>

              <button
                onClick={() => setInspectorTab("platformio")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs transition-colors border-b-2 ${
                  inspectorTab === "platformio"
                    ? "border-cyan-400 text-cyan-300 bg-[#12151d] font-bold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>PlatformIO</span>
              </button>
            </div>

            {/* Inspector Body Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Tab 1: Static Linter & Diagnostics */}
              {inspectorTab === "diagnostics" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-zinc-200">Firmware Diagnostics</span>
                    <span className="text-[10px] text-zinc-500">Real-time static check</span>
                  </div>

                  {/* Diagnostic Badges */}
                  <div className="space-y-2">
                    {analysis.diagnostics.map((diag) => {
                      const isWarning = diag.type === "warning";
                      const isSuccess = diag.type === "success";

                      return (
                        <div
                          key={diag.id}
                          className={`rounded-lg border p-2.5 space-y-1 ${
                            isWarning
                              ? "border-amber-900/60 bg-amber-950/20 text-amber-200"
                              : isSuccess
                              ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-200"
                              : "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              {isWarning ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              ) : isSuccess ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              )}
                              <span>{diag.title}</span>
                            </div>
                            {diag.line && (
                              <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 shrink-0">
                                Line {diag.line}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-normal pl-5">
                            {diag.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detected Libraries */}
                  {analysis.detectedLibraries.length > 0 && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-1.5">
                      <div className="text-zinc-300 font-bold text-[11px] flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Included Libraries ({analysis.detectedLibraries.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.detectedLibraries.map((lib, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 font-mono border border-zinc-700/60"
                          >
                            &lt;{lib}&gt;
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
                      <div className="text-zinc-500">Sketch Lines</div>
                      <div className="text-sm font-bold text-zinc-200 mt-0.5">{analysis.stats.lineCount}</div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
                      <div className="text-zinc-500">Hardware Pins</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">{analysis.stats.pinCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Hardware Pin Analysis */}
              {inspectorTab === "pins" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-zinc-200">Hardware Pin Mapping</span>
                    <span className="text-[10px] text-zinc-500">Circuit cross-referenced</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Matches pins declared in code against wire connections in Circuit Studio.
                  </p>

                  <div className="space-y-2 mt-2">
                    {analysis.extractedPins.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-4 text-center text-zinc-500 text-xs">
                        No GPIO pin references found in code.
                      </div>
                    ) : (
                      analysis.extractedPins.map((p, idx) => {
                        // Check if circuit connection exists
                        const matchingConn = circuitConnections.find(
                          (c: any) =>
                            c.targetPin?.toLowerCase() === p.pin.toLowerCase() ||
                            c.sourcePin?.toLowerCase() === p.pin.toLowerCase() ||
                            p.pin.toLowerCase().includes((c.targetPin || "").toLowerCase())
                        );

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 text-xs">Pin {p.pin}</span>
                              <span className="text-[10px] text-zinc-500">
                                Line {p.lineNumbers.join(", ")}
                              </span>
                            </div>

                            <div className="text-[10px] text-zinc-400">
                              Operations: <span className="text-zinc-300">{p.operations.join(" • ")}</span>
                            </div>

                            <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
                              {matchingConn ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Wired to {matchingConn.sourceComponentId || matchingConn.targetComponentId}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-zinc-500">
                                  <Info className="h-3 w-3" />
                                  Not wired in Circuit Studio
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: PlatformIO Config */}
              {inspectorTab === "platformio" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-zinc-200">platformio.ini Preview</span>
                    <button
                      onClick={handleDownloadPlatformIo}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Ready-to-use configuration for VS Code PlatformIO extension with telemetry baud rate configured.
                  </p>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 overflow-x-auto text-[11px] text-cyan-200 font-mono leading-relaxed whitespace-pre">
                    {generatePlatformIoIni(selectedBoard, analysis.baudRate || 115200)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Activity icon helper for Inspector tabs
function Activity({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
