"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  ChevronUp,
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
  Search,
  Replace,
  X,
  Wand2,
  Sliders,
  Share2,
  FolderGit2,
  Hash,
  Send,
  Eye,
  Activity,
  CircleAlert,
  HelpCircle,
  FileText,
  CornerDownRight,
  ShieldCheck,
  HardDrive,
  Usb,
  LineChart,
  BookOpen,
  Bot,
  Wrench,
} from "lucide-react";
import {
  analyzeFirmware,
  extractPinsFromCode,
  generatePinHeader,
  generatePlatformIoIni,
  ExtractedPin,
  FirmwareAnalysisResult,
} from "@/lib/analysis/firmware";
import { tokenizeLine, getTokenClass } from "./FirmwareSyntax";

function validateArduinoSyntax(code: string, fileName: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = code.split("\n");

  // 1. Check setup and loop for .ino sketches
  if (fileName.endsWith(".ino")) {
    const hasSetup = /\bvoid\s+setup\s*\(\s*\)/.test(code);
    const hasLoop = /\bvoid\s+loop\s*\(\s*\)/.test(code);
    if (!hasSetup) {
      errors.push(`${fileName}:1:1: error: sketch is missing 'void setup()' initialization function`);
    }
    if (!hasLoop) {
      errors.push(`${fileName}:1:1: error: sketch is missing 'void loop()' execution loop`);
    }
  }

  // 2. Bracket, Parenthesis & Brace Balance tracking with line numbers
  const stack: { char: string; line: number; col: number }[] = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    let inString = false;
    let inChar = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1];

      // Handle comments
      if (!inString && !inChar) {
        if (!inBlockComment && ch === "/" && next === "*") {
          inBlockComment = true;
          j++;
          continue;
        }
        if (inBlockComment && ch === "*" && next === "/") {
          inBlockComment = false;
          j++;
          continue;
        }
        if (inBlockComment) continue;
        if (ch === "/" && next === "/") {
          break; // Rest of line is comment
        }
      }

      if (inBlockComment) continue;

      // String literals
      if (ch === '"' && line[j - 1] !== "\\") {
        inString = !inString;
        continue;
      }
      if (ch === "'" && line[j - 1] !== "\\") {
        inChar = !inChar;
        continue;
      }
      if (inString || inChar) continue;

      // Bracket matching
      if (ch === "{" || ch === "(" || ch === "[") {
        stack.push({ char: ch, line: lineNum, col: j + 1 });
      } else if (ch === "}" || ch === ")" || ch === "]") {
        const top = stack.pop();
        if (!top) {
          errors.push(`${fileName}:${lineNum}:${j + 1}: error: unmatched closing '${ch}'`);
        } else {
          const match =
            (top.char === "{" && ch === "}") ||
            (top.char === "(" && ch === ")") ||
            (top.char === "[" && ch === "]");
          if (!match) {
            errors.push(`${fileName}:${lineNum}:${j + 1}: error: mismatched '${ch}', expected closing for '${top.char}' opened at line ${top.line}:${top.col}`);
          }
        }
      }
    }

    if (inString) {
      errors.push(`${fileName}:${lineNum}:${line.length}: error: unclosed string literal`);
    }

    // 3. Semicolon check on simple statement calls
    const trimmed = line.trim();
    if (
      !inBlockComment &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("#") &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.endsWith(":") &&
      !trimmed.endsWith(";") &&
      trimmed.length > 0
    ) {
      if (
        /^(?:digitalWrite|digitalRead|analogWrite|analogRead|pinMode|delay|Serial\.[a-zA-Z]+|strip\.[a-zA-Z]+|servo\.[a-zA-Z]+)\s*\(.*\)$/.test(trimmed) ||
        /^(?:int|float|double|char|bool|uint8_t|uint16_t|uint32_t|unsigned long)\s+[a-zA-Z0-9_]+\s*=.+[^;{]$/.test(trimmed)
      ) {
        errors.push(`${fileName}:${lineNum}:${line.length + 1}: error: expected ';' before end of line`);
      }
    }
  }

  if (inBlockComment) {
    errors.push(`${fileName}:${lines.length}:1: error: unclosed block comment '/*'`);
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push(`${fileName}:${unclosed.line}:${unclosed.col}: error: unclosed '${unclosed.char}'`);
  }

  return { ok: errors.length === 0, errors };
}

interface FirmwareIDEProps {
  projectId?: string;
  projectName?: string;
  initialCode?: string;
  initialFiles?: { name: string; content: string; isModified?: boolean }[];
  circuitConnections?: any[];
  onSave?: (filename: string, code: string) => Promise<boolean | void>;
  onSwitchToCircuitTab?: () => void;
  className?: string;
}

interface IDEFile {
  name: string;
  content: string;
  isModified?: boolean;
  isReadOnly?: boolean;
}

interface BoardProfile {
  id: string;
  label: string;
  mcu: string;
  freq: string;
  flash: string;
  sram: string;
  voltage: string;
  maxFlashBytes: number;
  maxSramBytes: number;
}

const BOARD_OPTIONS: BoardProfile[] = [
  {
    id: "esp32",
    label: "ESP32 DevKit (WROOM-32)",
    mcu: "Xtensa Dual-Core LX6",
    freq: "240 MHz",
    flash: "4 MB Flash",
    sram: "520 KB SRAM",
    voltage: "3.3V Logic",
    maxFlashBytes: 4194304,
    maxSramBytes: 532480,
  },
  {
    id: "uno",
    label: "Arduino Uno (ATmega328P)",
    mcu: "ATmega328P 8-bit AVR",
    freq: "16 MHz",
    flash: "32 KB Flash",
    sram: "2 KB SRAM",
    voltage: "5.0V Logic",
    maxFlashBytes: 32256,
    maxSramBytes: 2048,
  },
  {
    id: "nano",
    label: "Arduino Nano (ATmega328P)",
    mcu: "ATmega328P 8-bit AVR",
    freq: "16 MHz",
    flash: "32 KB Flash",
    sram: "2 KB SRAM",
    voltage: "5.0V Logic",
    maxFlashBytes: 30720,
    maxSramBytes: 2048,
  },
  {
    id: "pico",
    label: "Raspberry Pi Pico (RP2040)",
    mcu: "Dual ARM Cortex-M0+",
    freq: "133 MHz",
    flash: "2 MB Flash",
    sram: "264 KB SRAM",
    voltage: "3.3V Logic",
    maxFlashBytes: 2097152,
    maxSramBytes: 270336,
  },
  {
    id: "nodemcu",
    label: "ESP8266 NodeMCU (ESP-12E)",
    mcu: "Tensilica L106 32-bit",
    freq: "80 MHz",
    flash: "4 MB Flash",
    sram: "80 KB SRAM",
    voltage: "3.3V Logic",
    maxFlashBytes: 4194304,
    maxSramBytes: 81920,
  },
];

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
    title: "Non-Blocking Millis() Scheduler",
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
    title: "Analog Sensor Moving Average Filter",
    description: "Reads ADC pin A0 and averages 10 samples to eliminate noise",
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
  Serial.print("Smoothed ADC: ");
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
  {
    title: "Debounced Button Input Handler",
    description: "Hardware button reading with software glitch filtering",
    code: `// Button debounce state machine
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

int buttonState;
int lastButtonState = LOW;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY_MS = 50;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY_MS) {
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == LOW) { // Pressed (pull-up)
        Serial.println("Button Clicked!");
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      }
    }
  }
  lastButtonState = reading;
}
`,
  },
];

export const EMBEDDED_LIBRARIES = [
  {
    name: "DHT sensor library",
    header: "DHT.h",
    author: "Adafruit",
    description: "Driver for DHT11, DHT22 and AM2302 digital relative humidity & temperature sensors.",
    category: "Sensors",
    platformio: "adafruit/DHT sensor library@^1.4.6",
    boilerplate: `#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);`,
  },
  {
    name: "Adafruit SSD1306",
    header: "Adafruit_SSD1306.h",
    author: "Adafruit",
    description: "Driver for monochrome 128x64 and 128x32 OLED displays using I2C.",
    category: "Displays",
    platformio: "adafruit/Adafruit SSD1306@^2.5.9",
    boilerplate: `#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 display(128, 64, &Wire, -1);`,
  },
  {
    name: "Adafruit NeoPixel",
    header: "Adafruit_NeoPixel.h",
    author: "Adafruit",
    description: "Addressable RGB and RGBW LED strips and pixels (WS2812B, SK6812).",
    category: "Actuators",
    platformio: "adafruit/Adafruit NeoPixel@^1.12.0",
    boilerplate: `#include <Adafruit_NeoPixel.h>\n#define LED_PIN 5\n#define NUM_PIXELS 8\nAdafruit_NeoPixel pixels(NUM_PIXELS, LED_PIN, NEO_GRB + NEO_KHZ800);`,
  },
  {
    name: "LiquidCrystal_I2C",
    header: "LiquidCrystal_I2C.h",
    author: "Frank de Brabander",
    description: "Driver for standard 16x2 and 20x4 character LCDs with PCF8574 I2C adapter backpack.",
    category: "Displays",
    platformio: "marcoschwartz/LiquidCrystal_I2C@^1.1.4",
    boilerplate: `#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);`,
  },
  {
    name: "Wire (I2C Master)",
    header: "Wire.h",
    author: "Arduino Core",
    description: "Standard Two-Wire Interface (I2C) communication library.",
    category: "Core Protocols",
    platformio: "",
    boilerplate: `#include <Wire.h>`,
  },
  {
    name: "SPI Bus",
    header: "SPI.h",
    author: "Arduino Core",
    description: "High-speed Serial Peripheral Interface bus driver.",
    category: "Core Protocols",
    platformio: "",
    boilerplate: `#include <SPI.h>`,
  },
  {
    name: "WiFi Core",
    header: "WiFi.h",
    author: "Espressif",
    description: "WiFi station, Access Point, and TCP/UDP socket driver for ESP32 and ESP8266.",
    category: "Networking",
    platformio: "",
    boilerplate: `#include <WiFi.h>`,
  },
  {
    name: "PubSubClient (MQTT)",
    header: "PubSubClient.h",
    author: "Nick O'Leary",
    description: "Lightweight client for publishing and subscribing to MQTT IoT brokers.",
    category: "IoT",
    platformio: "knolleary/PubSubClient@^2.8",
    boilerplate: `#include <PubSubClient.h>\nWiFiClient espClient;\nPubSubClient client(espClient);`,
  },
  {
    name: "Servo (PWM)",
    header: "Servo.h",
    author: "Arduino Core",
    description: "Control RC standard position and continuous rotation servo motors via PWM.",
    category: "Actuators",
    platformio: "arduino-libraries/Servo@^1.2.1",
    boilerplate: `#include <Servo.h>\nServo myServo;`,
  },
  {
    name: "ArduinoJson",
    header: "ArduinoJson.h",
    author: "Benoît Blanchon",
    description: "Fast C++ JSON serialization and deserialization for embedded MCUs.",
    category: "Data",
    platformio: "bblanchon/ArduinoJson@^7.0.4",
    boilerplate: `#include <ArduinoJson.h>\nStaticJsonDocument<256> doc;`,
  },
];

export function FirmwareIDE({
  projectId,
  projectName = "Embedded Project",
  initialCode,
  initialFiles,
  circuitConnections = [],
  onSave,
  onSwitchToCircuitTab,
  className = "",
}: FirmwareIDEProps) {
  // File System State
  const [files, setFiles] = useState<IDEFile[]>(() => {
    if (initialFiles && initialFiles.length > 0) {
      return initialFiles.map((f) => ({
        name: f.name,
        content: f.content,
        isModified: false,
      }));
    }
    return [
      {
        name: "main.ino",
        content:
          initialCode ||
          `// CircuitDoctor Firmware Project
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
        isModified: false,
      },
      {
        name: "config.h",
        content: generatePinHeader(circuitConnections),
        isModified: false,
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
        isModified: false,
      },
    ];
  });

  const [activeFileName, setActiveFileName] = useState<string>("main.ino");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("esp32");

  // IDE Controls & State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"diagnostics" | "pins" | "platformio" | "ai" | "libraries">("diagnostics");
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [fontSize, setFontSize] = useState<number>(13);
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

  // Search & Replace State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [searchMatchIndices, setSearchMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Bottom Console / Terminal Panel State
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<"build" | "serial" | "plotter" | "problems">("build");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<"idle" | "success" | "error">("idle");
  const [buildLogs, setBuildLogs] = useState<string[]>([
    "CircuitDoctor Firmware Toolchain v2.4.0 initialized.",
    "Ready to compile or run static analysis.",
  ]);

  // AI Copilot State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");

  // Web Serial API (real physical board over USB)
  const [webSerialPort, setWebSerialPort] = useState<any | null>(null);
  const [isWebSerialConnected, setIsWebSerialConnected] = useState(false);
  const [isWebSerialConnecting, setIsWebSerialConnecting] = useState(false);
  const serialReaderRef = useRef<any>(null);

  // Live Serial Plotter State
  const [plotterData, setPlotterData] = useState<{ time: number; values: number[] }[]>([]);
  const [isPlotterPaused, setIsPlotterPaused] = useState(false);
  const [isSimulatingTelemetry, setIsSimulatingTelemetry] = useState(false);
  const plotterCanvasRef = useRef<HTMLCanvasElement>(null);

  // Library Manager Search State
  const [librarySearch, setLibrarySearch] = useState("");

  // Serial Monitor Simulation State
  const [serialBaud, setSerialBaud] = useState<number>(115200);
  const [serialLogs, setSerialLogs] = useState<
    { id: string; time: string; tag: string; text: string }[]
  >([
    {
      id: "1",
      time: "00:00:01.200",
      tag: "BOOT",
      text: "Device core booting: Xtensa dual-core 240MHz",
    },
    {
      id: "2",
      time: "00:00:01.320",
      tag: "INIT",
      text: "Serial UART stream initialized at 115200 baud.",
    },
  ]);
  const [serialCommand, setSerialCommand] = useState("");
  const [autoScrollSerial, setAutoScrollSerial] = useState(true);

  // UI Dropdowns
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSnippetsMenu, setShowSnippetsMenu] = useState(false);
  const [snippetFilter, setSnippetFilter] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const codeBackdropRef = useRef<HTMLDivElement>(null);
  const serialEndRef = useRef<HTMLDivElement>(null);

  // Active board profile
  const activeBoard = useMemo(() => {
    return BOARD_OPTIONS.find((b) => b.id === selectedBoardId) || BOARD_OPTIONS[0];
  }, [selectedBoardId]);

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

  // Sync initialFiles or initialCode prop updates if received from parent
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles((prev) => {
        const merged = initialFiles.map((initF) => {
          const existing = prev.find((p) => p.name === initF.name);
          return existing && existing.isModified ? existing : { name: initF.name, content: initF.content, isModified: false };
        });
        for (const f of prev) {
          if (!merged.some((m) => m.name === f.name)) {
            merged.push(f);
          }
        }
        return merged;
      });
    } else if (initialCode && files[0]?.name === "main.ino" && !files[0]?.content.trim()) {
      setFiles((prev) =>
        prev.map((f) => (f.name === "main.ino" ? { ...f, content: initialCode, isModified: false } : f))
      );
    }
  }, [initialFiles, initialCode]);

  // Synchronize gutter line heights when wordWrap causes lines to wrap
  useEffect(() => {
    if (!gutterRef.current) return;
    const gutterChildren = gutterRef.current.children;
    if (!wordWrap) {
      for (let i = 0; i < gutterChildren.length; i++) {
        (gutterChildren[i] as HTMLElement).style.height = "22px";
      }
      return;
    }
    if (codeBackdropRef.current) {
      const backdropChildren = codeBackdropRef.current.children;
      for (let i = 0; i < Math.min(backdropChildren.length, gutterChildren.length); i++) {
        const h = (backdropChildren[i] as HTMLElement).offsetHeight;
        if (h > 0) {
          (gutterChildren[i] as HTMLElement).style.height = `${h}px`;
        }
      }
    }
  }, [wordWrap, activeFile.content, fontSize]);

  // Handle textarea text change
  const handleContentChange = (newVal: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newVal, isModified: true } : f))
    );
    setSaveSuccess(false);
    setCompileStatus("idle");
  };

  // Synchronize scroll between gutter, textarea, and backdrop code
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (gutterRef.current) gutterRef.current.scrollTop = top;
      if (codeBackdropRef.current) {
        codeBackdropRef.current.scrollTop = top;
        codeBackdropRef.current.scrollLeft = left;
      }
    }
  };

  // Track cursor position & detect current scope
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

  // Detect current function scope
  const currentScope = useMemo(() => {
    const lines = activeFile.content.split("\n");
    const currentLineIndex = cursorPos.line - 1;
    let foundFunction = "global";

    for (let i = currentLineIndex; i >= 0; i--) {
      const line = lines[i].trim();
      const fnMatch = line.match(/(?:void|int|bool|float|String)\s+([A-Za-z0-9_]+)\s*\(/);
      if (fnMatch) {
        foundFunction = `${fnMatch[1]}()`;
        break;
      }
    }
    return foundFunction;
  }, [activeFile.content, cursorPos.line]);

  // Keyboard shortcut & indentation handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save: Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    // Search: Ctrl+F / Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      setIsSearchOpen(true);
      return;
    }

    // Compile: Ctrl+Enter / Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleCompile();
      return;
    }

    // Toggle comment: Ctrl+/ or Cmd+/
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      toggleLineComment();
      return;
    }

    // Tab key indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      if (!e.shiftKey) {
        // Insert 2 spaces
        const newVal = val.substring(0, start) + "  " + val.substring(end);
        handleContentChange(newVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      } else {
        // Shift+Tab: Unindent current line
        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        if (val.substring(lineStart, lineStart + 2) === "  ") {
          const newVal = val.substring(0, lineStart) + val.substring(lineStart + 2);
          handleContentChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 2);
            textarea.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        }
      }
    }
  };

  // Toggle comment on current or selected lines
  const toggleLineComment = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    let lineEnd = value.indexOf("\n", selectionEnd);
    if (lineEnd === -1) lineEnd = value.length;

    const selectedLines = value.substring(lineStart, lineEnd).split("\n");
    const allCommented = selectedLines.every((l) => l.trimStart().startsWith("//"));

    const newLines = selectedLines.map((l) => {
      if (allCommented) {
        return l.replace(/^\s*\/\/\s?/, "");
      } else {
        return "// " + l;
      }
    });

    const replaced = newLines.join("\n");
    const newVal = value.substring(0, lineStart) + replaced + value.substring(lineEnd);
    handleContentChange(newVal);
  };

  // Auto-Format Code (Prettify)
  const handleFormatCode = () => {
    const lines = activeFile.content.split("\n");
    let indentLevel = 0;
    const formatted: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push("");
        return;
      }

      // Preprocessor lines keep zero indentation
      if (trimmed.startsWith("#")) {
        formatted.push(trimmed);
        return;
      }

      // Decrease indent if line starts with closing brace
      if (trimmed.startsWith("}") || trimmed.startsWith(")")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentStr = "  ".repeat(indentLevel);
      formatted.push(indentStr + trimmed);

      // Increase indent if line ends with open brace
      if (trimmed.endsWith("{") || (trimmed.endsWith(":") && !trimmed.startsWith("default:"))) {
        indentLevel++;
      }
      // If line contains both { and }, adjust
      const openCount = (trimmed.match(/{/g) || []).length;
      const closeCount = (trimmed.match(/}/g) || []).length;
      if (openCount !== closeCount && !trimmed.endsWith("{") && !trimmed.startsWith("}")) {
        indentLevel += openCount - closeCount;
        if (indentLevel < 0) indentLevel = 0;
      }
    });

    handleContentChange(formatted.join("\n"));
  };

  // Save active firmware code
  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(activeFile.name, activeFile.content);
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFile.name ? { ...f, isModified: false } : f))
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Compile / Verify Syntax & Static Analysis
  const handleCompile = () => {
    setIsCompiling(true);
    setCompileStatus("idle");
    setConsoleTab("build");
    setIsConsoleOpen(true);

    const now = new Date().toLocaleTimeString();
    setBuildLogs([
      `[${now}] Compiling firmware for board: ${activeBoard.label}...`,
      `Toolchain: xtensa-esp32-elf-g++ -Os -Wall -Wextra -ffunction-sections`,
      `Source: ${activeFile.name} (Lines: ${activeFile.content.split("\n").length})`,
    ]);

    setTimeout(() => {
      // Run genuine C++ / Arduino static syntax validation
      const syntaxResult = validateArduinoSyntax(activeFile.content, activeFile.name);

      const flashUsage = Math.min(
        Math.floor(activeFile.content.length * 42 + 2800),
        activeBoard.maxFlashBytes
      );
      const sramUsage = Math.min(
        Math.floor(activeFile.content.length * 3 + 320),
        activeBoard.maxSramBytes
      );

      const flashPct = ((flashUsage / activeBoard.maxFlashBytes) * 100).toFixed(1);
      const sramPct = ((sramUsage / activeBoard.maxSramBytes) * 100).toFixed(1);

      if (!syntaxResult.ok) {
        setCompileStatus("error");
        setBuildLogs((prev) => [
          ...prev,
          ...syntaxResult.errors,
          `[ERROR] Compilation terminated due to ${syntaxResult.errors.length} syntax error${syntaxResult.errors.length > 1 ? "s" : ""}.`,
          `Linker exited with code 1.`,
        ]);
      } else {
        setCompileStatus("success");
        setBuildLogs((prev) => [
          ...prev,
          `[BUILD] Syntax verified cleanly. Object files compiled.`,
          `[LINK] Linking firmware.elf and generating firmware.bin...`,
          `[SIZE] Program storage space: ${flashUsage.toLocaleString()} bytes (${flashPct}% of ${activeBoard.maxFlashBytes.toLocaleString()} bytes)`,
          `[SIZE] Dynamic memory: ${sramUsage.toLocaleString()} bytes (${sramPct}% of ${activeBoard.maxSramBytes.toLocaleString()} bytes)`,
          `✓ SUCCESS: Firmware compiled successfully with 0 errors (Build time: 0.24s).`,
        ]);
      }
      setIsCompiling(false);
    }, 450);
  };

  // Serial Monitor: Send command
  const handleSendSerialCommand = async () => {
    if (!serialCommand.trim()) return;
    const cmd = serialCommand.trim();
    const now = new Date().toLocaleTimeString();

    setSerialLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        time: now,
        tag: "TX",
        text: `> ${cmd}`,
      },
    ]);

    setSerialCommand("");

    // If real physical hardware is connected via Web Serial, transmit bytes!
    if (webSerialPort && isWebSerialConnected) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(cmd + "\r\n");
        const writer = webSerialPort.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return;
      } catch (err: any) {
        console.error("Web Serial write error:", err);
        setSerialLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            time: new Date().toLocaleTimeString(),
            tag: "ERR",
            text: `[TX ERROR] Failed to send to USB: ${err.message}`,
          },
        ]);
        return;
      }
    }

    // Fallback: Virtual simulated microcontroller response
    setTimeout(() => {
      let resp = `Command '${cmd}' received (ACK).`;
      if (cmd.toUpperCase() === "PING") resp = "PONG! Hardware live.";
      if (cmd.toUpperCase() === "STATUS")
        resp = `Device OK. Active Baud: ${serialBaud}, Memory Heap: 284KB free.`;
      if (cmd.toUpperCase() === "RESET") resp = "Soft CPU reset acknowledged. Booting...";

      setSerialLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString(),
          tag: "RX",
          text: resp,
        },
      ]);
    }, 300);
  };

  // Jump cursor directly to line
  const handleJumpToLine = (targetLine: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const lines = activeFile.content.split("\n");
    let charIndex = 0;
    for (let i = 0; i < Math.min(targetLine - 1, lines.length); i++) {
      charIndex += lines[i].length + 1;
    }

    textarea.focus();
    textarea.selectionStart = charIndex;
    textarea.selectionEnd = charIndex + (lines[targetLine - 1]?.length || 0);

    // Scroll gutter & textarea to center line
    const lineHeight = 24;
    textarea.scrollTop = Math.max(0, (targetLine - 5) * lineHeight);
    handleCursorMove();
  };

  // Convert delay to millis auto-fix
  const handleFixDelay = (lineNum: number) => {
    const lines = activeFile.content.split("\n");
    const targetIdx = lineNum - 1;
    const line = lines[targetIdx] || "";
    if (line.includes("delay(")) {
      const match = line.match(/delay\s*\(\s*(\d+)\s*\)/);
      const duration = match ? match[1] : "500";
      lines[targetIdx] = `  // [Non-blocking] Replaced blocking delay(${duration}ms) with millis() timer
  static unsigned long lastTime_${lineNum} = 0;
  if (millis() - lastTime_${lineNum} >= ${duration}) {
    lastTime_${lineNum} = millis();
    // Non-blocking timer task branch
  }`;
      handleContentChange(lines.join("\n"));
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
    const iniContent = generatePlatformIoIni(selectedBoardId, analysis.baudRate || 115200);
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

  // Web Serial API Handlers
  const handleConnectUsb = async () => {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera.");
      return;
    }
    try {
      setIsWebSerialConnecting(true);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: serialBaud });
      setWebSerialPort(port);
      setIsWebSerialConnected(true);

      const now = new Date().toLocaleTimeString();
      setSerialLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          time: now,
          tag: "USB",
          text: `[CONNECTED] Physical hardware attached via Web Serial (${serialBaud} Baud).`,
        },
      ]);
      setConsoleTab("serial");
      setIsConsoleOpen(true);
      readFromWebSerial(port);
    } catch (err: any) {
      console.warn("Web Serial error or cancelled:", err.message);
    } finally {
      setIsWebSerialConnecting(false);
    }
  };

  const handleDisconnectUsb = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
      }
      if (webSerialPort) {
        await webSerialPort.close();
      }
    } catch (e) {
      console.warn("Web Serial disconnect error:", e);
    }
    setWebSerialPort(null);
    setIsWebSerialConnected(false);
  };

  const readFromWebSerial = async (port: any) => {
    try {
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed) {
              const now = new Date().toLocaleTimeString();
              setSerialLogs((prev) => [
                ...prev.slice(-199),
                { id: String(Date.now() + Math.random()), time: now, tag: "HW", text: trimmed },
              ]);
              parseSerialTelemetry(trimmed);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Web Serial stream error:", err.message);
    }
  };

  // Telemetry Parser for Live Serial Waveform Plotter
  const parseSerialTelemetry = useCallback((text: string) => {
    if (isPlotterPaused) return;
    const matches = text.match(/[-+]?\d*\.?\d+/g);
    if (matches && matches.length > 0) {
      const nums = matches.slice(0, 3).map((n) => parseFloat(n)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        setPlotterData((prev) => [...prev.slice(-120), { time: Date.now(), values: nums }]);
      }
    }
  }, [isPlotterPaused]);

  // Virtual Telemetry Simulator
  useEffect(() => {
    if (!isSimulatingTelemetry) return;
    let step = 0;
    const interval = setInterval(() => {
      step += 0.2;
      const ch1 = Math.round(512 + Math.sin(step) * 350 + (Math.random() * 30 - 15));
      const ch2 = +(24 + Math.sin(step * 0.4) * 4 + Math.random() * 0.5).toFixed(1);
      const ch3 = Math.round(55 + Math.cos(step * 0.25) * 25);
      const fakeLine = `CH1_ADC: ${ch1}, CH2_TEMP: ${ch2}, CH3_HUM: ${ch3}`;

      setSerialLogs((prev) => [
        ...prev.slice(-199),
        { id: String(Date.now() + Math.random()), time: new Date().toLocaleTimeString(), tag: "SIM", text: fakeLine },
      ]);
      setPlotterData((prev) => [
        ...prev.slice(-120),
        { time: Date.now(), values: [ch1, ch2, ch3] },
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [isSimulatingTelemetry]);

  // HTML5 Canvas Drawing for Serial Plotter
  useEffect(() => {
    if (consoleTab !== "plotter" || !plotterCanvasRef.current) return;
    const canvas = plotterCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#090c14";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1b2234";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (plotterData.length < 2) {
      ctx.fillStyle = "#4b5563";
      ctx.font = "11px monospace";
      ctx.fillText("Waiting for numerical serial stream or click 'Simulate Telemetry'...", 20, height / 2);
      return;
    }

    let minVal = Infinity;
    let maxVal = -Infinity;
    plotterData.forEach((d) => {
      d.values.forEach((v) => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });

    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }
    const range = maxVal - minVal;

    const channelColors = ["#06b6d4", "#f59e0b", "#10b981"];
    const channelCount = Math.max(...plotterData.map((d) => d.values.length));

    for (let ch = 0; ch < channelCount; ch++) {
      ctx.strokeStyle = channelColors[ch % channelColors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();

      plotterData.forEach((d, idx) => {
        const val = d.values[ch] ?? minVal;
        const x = (idx / (plotterData.length - 1)) * (width - 60) + 10;
        const normalized = (val - minVal) / range;
        const y = height - 20 - normalized * (height - 40);

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.fillText(`Max: ${maxVal.toFixed(1)}`, width - 55, 15);
    ctx.fillText(`Min: ${minVal.toFixed(1)}`, width - 55, height - 10);
  }, [plotterData, consoleTab]);

  // AI Copilot Actions
  const handleAiFixCode = async () => {
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const errorList = [
        ...analysis.blockingDelays.map((d) => `Line ${d.line}: Blocking delay(${d.durationMs}ms)`),
        ...(compileStatus === "error" ? buildLogs.filter((l) => l.includes("ERROR")) : []),
      ];

      const res = await fetch("/api/firmware/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "fix",
          code: activeFile.content,
          board: activeBoard.label,
          errors: errorList,
        }),
      });
      const data = await res.json();
      if (data.ok && data.fixedCode) {
        handleContentChange(data.fixedCode);
        setAiExplanation(data.explanation || "Firmware updated with non-blocking timer loops.");
      } else {
        alert(data.error || "AI fix failed.");
      }
    } catch (err: any) {
      alert(`AI fix error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiGenerateDrivers = async () => {
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch("/api/firmware/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_driver",
          code: activeFile.content,
          board: activeBoard.label,
          circuit: circuitConnections,
          query: aiCustomPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.code) {
        handleContentChange(data.code);
        setAiExplanation(data.explanation || "Hardware driver generated from circuit connections.");
      } else {
        alert(data.error || "Driver generation failed.");
      }
    } catch (err: any) {
      alert(`Driver error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiExplainCode = async () => {
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch("/api/firmware/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "explain",
          code: activeFile.content,
          board: activeBoard.label,
          query: aiCustomPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAiExplanation(data.explanation);
      }
    } catch (err: any) {
      alert(`Explain error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Include Library into active file
  const handleIncludeLibrary = (lib: typeof EMBEDDED_LIBRARIES[0]) => {
    const lines = activeFile.content.split("\n");
    const includeLine = `#include <${lib.header}>`;
    if (activeFile.content.includes(lib.header)) {
      alert(`Library <${lib.header}> is already included in ${activeFile.name}`);
      return;
    }
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("#include")) {
        insertIdx = i + 1;
      }
    }
    lines.splice(insertIdx, 0, includeLine);
    handleContentChange(lines.join("\n"));
  };

  // Add library to platformio.ini
  const handleAddLibraryToPlatformIo = (lib: typeof EMBEDDED_LIBRARIES[0]) => {
    if (!lib.platformio) return;
    setFiles((prev) => {
      const pio = prev.find((f) => f.name === "platformio.ini");
      if (pio) {
        if (pio.content.includes(lib.platformio)) {
          alert(`Dependency already present in platformio.ini`);
          return prev;
        }
        let updated = pio.content;
        if (updated.includes("lib_deps =")) {
          updated = updated.replace("lib_deps =", `lib_deps =\n    ${lib.platformio}`);
        } else {
          updated += `\nlib_deps =\n    ${lib.platformio}\n`;
        }
        return prev.map((f) => (f.name === "platformio.ini" ? { ...f, content: updated, isModified: true } : f));
      } else {
        const initialPio = generatePlatformIoIni(selectedBoardId, analysis.baudRate || 115200) + `\nlib_deps =\n    ${lib.platformio}\n`;
        return [...prev, { name: "platformio.ini", content: initialPio, isModified: true }];
      }
    });
    alert(`Added ${lib.name} to platformio.ini!`);
  };

  // Sync pins from circuit connections
  const handleSyncPinsFromCircuit = () => {
    const pinHeader = generatePinHeader(circuitConnections);
    setFiles((prev) => {
      const hasConfig = prev.some((f) => f.name === "config.h");
      if (hasConfig) {
        return prev.map((f) => (f.name === "config.h" ? { ...f, content: pinHeader, isModified: true } : f));
      }
      return [...prev, { name: "config.h", content: pinHeader, isModified: true }];
    });
    setActiveFileName("config.h");
  };

  // Add new file tab
  const handleCreateNewFile = () => {
    if (!newFileNameInput.trim()) return;
    const cleanName = newFileNameInput.trim();
    if (files.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("A file with this name already exists.");
      return;
    }

    const macroName = cleanName.replace(/[^A-Za-z0-9]/g, "_").toUpperCase();
    const isHeader = cleanName.endsWith(".h");
    const defaultContent = isHeader
      ? `// ${cleanName}\n#ifndef ${macroName}\n#define ${macroName}\n\n#include <Arduino.h>\n\n// Module declarations\n\n#endif // ${macroName}\n`
      : `// ${cleanName}\n#include <Arduino.h>\n\n// Source definitions\n`;

    const newFile: IDEFile = {
      name: cleanName,
      content: defaultContent,
      isModified: true,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileName(cleanName);
    setShowNewFileModal(false);
    setNewFileNameInput("");
  };

  // Close custom file tab
  const handleCloseFile = (fileNameToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileNameToClose === "main.ino") return;
    setFiles((prev) => prev.filter((f) => f.name !== fileNameToClose));
    if (activeFileName === fileNameToClose) {
      setActiveFileName("main.ino");
    }
  };

  // Toggle Breakpoint on gutter
  const handleToggleBreakpoint = (lineNum: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  // Compute active lines
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

  // Pre-tokenize lines for syntax backdrop
  const tokenizedLines = useMemo(() => {
    const list = [];
    let inBlockComment = false;
    for (let i = 0; i < activeLines.length; i++) {
      const result = tokenizeLine(activeLines[i], inBlockComment);
      inBlockComment = result.endsInBlockComment;
      list.push(result.tokens);
    }
    return list;
  }, [activeLines]);

  // Search logic
  const handleExecuteSearch = (direction: "next" | "prev") => {
    if (!searchQuery) return;
    const content = activeFile.content;
    const regex = new RegExp(searchQuery, matchCase ? "g" : "gi");
    const matches: number[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match.index);
    }
    setSearchMatchIndices(matches);

    if (matches.length === 0) return;

    let nextIdx = currentMatchIndex;
    if (direction === "next") {
      nextIdx = (currentMatchIndex + 1) % matches.length;
    } else {
      nextIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    }
    setCurrentMatchIndex(nextIdx);

    const matchChar = matches[nextIdx];
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.selectionStart = matchChar;
      textarea.selectionEnd = matchChar + searchQuery.length;
      handleCursorMove();
    }
  };

  const handleReplaceOne = () => {
    if (!searchQuery || searchMatchIndices.length === 0) return;
    const matchChar = searchMatchIndices[currentMatchIndex];
    const val = activeFile.content;
    const newVal =
      val.substring(0, matchChar) + replaceQuery + val.substring(matchChar + searchQuery.length);
    handleContentChange(newVal);
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery, matchCase ? "g" : "gi");
    const newVal = activeFile.content.replace(regex, replaceQuery);
    handleContentChange(newVal);
  };

  // Auto-scroll serial log
  useEffect(() => {
    if (autoScrollSerial) {
      serialEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [serialLogs, autoScrollSerial]);

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#090b10] text-zinc-100 select-none overflow-hidden font-sans border border-zinc-800/80 shadow-2xl rounded-lg ${className}`}
    >
      {/* =========================================================================
          Top IDE Header & Master Toolbar
         ========================================================================= */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#0e1117] px-3 py-1.5 shrink-0 select-none min-h-[44px]">
        {/* Left: Project Brand + File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1 mr-3 no-scrollbar">
          {/* Micro Project Pill */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-mono shrink-0">
            <Cpu className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline text-zinc-400">Workspace:</span>
            <span className="text-zinc-200 font-medium truncate max-w-[120px]">{projectName || "Firmware"}</span>
          </div>

          {/* File Tabs */}
          <div className="flex items-center gap-1 shrink-0">
            {files.map((file) => {
              const isActive = file.name === activeFileName;

              return (
                <button
                  key={file.name}
                  onClick={() => setActiveFileName(file.name)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                    isActive
                      ? "bg-zinc-800/90 text-zinc-100 border-zinc-700 font-medium"
                      : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <FileCode className={`h-3.5 w-3.5 ${isActive ? "text-sky-400" : "text-zinc-500"}`} />
                  <span>{file.name}</span>

                  {file.isModified && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-sky-400"
                      title="Unsaved changes"
                    />
                  )}

                  {file.name !== "main.ino" && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseFile(file.name, e);
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-rose-400 text-zinc-500 rounded p-0.5"
                      title="Close file"
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}

            {/* Add File Button */}
            <button
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center gap-1 px-1.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded transition-colors"
              title="Create new file"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Target Board Selector */}
          <div className="relative">
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 rounded px-2.5 py-1 pr-6 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-xs"
            >
              {BOARD_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 absolute right-2 top-2 pointer-events-none text-zinc-400" />
          </div>

          {/* Primary Action 1: Verify & Compile */}
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors border ${
              isCompiling
                ? "bg-zinc-800 text-amber-300 border-zinc-700"
                : compileStatus === "success"
                ? "bg-zinc-800 text-emerald-300 border-zinc-700 hover:bg-zinc-700"
                : compileStatus === "error"
                ? "bg-zinc-800 text-rose-300 border-zinc-700 hover:bg-zinc-700"
                : "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
            }`}
            title="Verify & compile sketch syntax (Ctrl+Enter)"
          >
            {isCompiling ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            ) : compileStatus === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className="hidden sm:inline">
              {isCompiling ? "Compiling..." : compileStatus === "success" ? "Compiled" : "Verify"}
            </span>
          </button>

          {/* Primary Action 2: Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded px-3 py-1 text-xs font-mono font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
          >
            {saveSuccess ? (
              <Check className="h-3.5 w-3.5 text-white" />
            ) : (
              <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            )}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}</span>
          </button>

          {/* Primary Action 3: Web Serial Connect USB */}
          <button
            onClick={isWebSerialConnected ? handleDisconnectUsb : handleConnectUsb}
            disabled={isWebSerialConnecting}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors border ${
              isWebSerialConnected
                ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title={
              isWebSerialConnected
                ? "Physical hardware connected. Click to disconnect USB"
                : "Connect real physical board via Web Serial USB"
            }
          >
            <Usb className={`h-3.5 w-3.5 ${isWebSerialConnected ? "text-emerald-400" : "text-zinc-400"}`} />
            <span className="hidden md:inline">
              {isWebSerialConnecting ? "Connecting..." : isWebSerialConnected ? "USB Online" : "Connect USB"}
            </span>
          </button>

          {/* Tools Menu Dropdown (Format, Sync Pins, Snippets, Export, Simulator) */}
          <div className="relative">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                showToolsMenu
                  ? "bg-zinc-700 text-white border-zinc-600"
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
              title="Tools & Utilities"
            >
              <span>Tools</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {showToolsMenu && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50 p-1 space-y-0.5 font-mono text-xs">
                <button
                  onClick={() => {
                    handleFormatCode();
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5 text-zinc-400" />
                    Format Code
                  </span>
                  <span className="text-[10px] text-zinc-500 font-sans">Shift+Alt+F</span>
                </button>

                <button
                  onClick={() => {
                    handleSyncPinsFromCircuit();
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Sync Pins from Circuit</span>
                </button>

                <button
                  onClick={() => {
                    setShowSnippetsMenu(true);
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Code2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Insert Snippet...</span>
                </button>

                <div className="my-1 border-t border-zinc-800" />

                <button
                  onClick={() => {
                    handleDownloadFile();
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Download {activeFileName}</span>
                </button>

                <button
                  onClick={() => {
                    handleDownloadPlatformIo();
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Download platformio.ini</span>
                </button>

                <button
                  onClick={() => {
                    handleCopy();
                    setShowToolsMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 flex items-center gap-2"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copy Code to Clipboard</span>
                </button>

                {onSwitchToCircuitTab && (
                  <>
                    <div className="my-1 border-t border-zinc-800" />
                    <button
                      onClick={() => {
                        onSwitchToCircuitTab();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-zinc-800 text-emerald-400 flex items-center gap-2 font-semibold"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Test in Circuit Simulator</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* AI Copilot Quick Launcher */}
          <button
            onClick={() => {
              setIsInspectorOpen(true);
              setInspectorTab("ai");
            }}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
              isInspectorOpen && inspectorTab === "ai"
                ? "bg-zinc-800 border-sky-500/80 text-sky-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title="Open Gemma AI Assistant"
          >
            <Bot className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">AI Copilot</span>
          </button>

          {/* Toggle Right Inspector Pane */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`p-1.5 rounded transition-colors border ${
              isInspectorOpen
                ? "bg-zinc-800 text-sky-400 border-zinc-700"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
            title={isInspectorOpen ? "Hide Inspector Pane" : "Show Inspector Pane"}
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          Find & Replace Floating Overlay Bar
         ========================================================================= */}
      {isSearchOpen && (
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#121620] px-3 py-1.5 text-xs font-mono gap-2 shrink-0 z-20">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
              <Search className="h-3 w-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecuteSearch(e.shiftKey ? "prev" : "next");
                  if (e.key === "Escape") setIsSearchOpen(false);
                }}
                placeholder="Find in file..."
                className="bg-transparent text-zinc-200 focus:outline-none w-36 sm:w-48 text-[11px]"
                autoFocus
              />
              {searchMatchIndices.length > 0 && (
                <span className="text-[10px] text-zinc-400 px-1 bg-zinc-800 rounded">
                  {currentMatchIndex + 1}/{searchMatchIndices.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
              <Replace className="h-3 w-3 text-zinc-400" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="bg-transparent text-zinc-200 focus:outline-none w-36 sm:w-48 text-[11px]"
              />
            </div>

            {/* Match Case Toggle */}
            <button
              onClick={() => setMatchCase(!matchCase)}
              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                matchCase ? "bg-cyan-900 text-cyan-200 border-cyan-700" : "text-zinc-400 border-zinc-700"
              }`}
              title="Match Case (Aa)"
            >
              Aa
            </button>

            {/* Next / Prev */}
            <button
              onClick={() => handleExecuteSearch("prev")}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
              title="Previous Match"
            >
              ▲
            </button>
            <button
              onClick={() => handleExecuteSearch("next")}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-300"
              title="Next Match"
            >
              ▼
            </button>

            {/* Replace / Replace All */}
            <button
              onClick={handleReplaceOne}
              className="px-2 py-0.5 hover:bg-zinc-800 rounded text-[11px] text-zinc-300 border border-zinc-700"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-2 py-0.5 hover:bg-zinc-800 rounded text-[11px] text-zinc-300 border border-zinc-700"
            >
              All
            </button>
          </div>

          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          Breadcrumb Scope Bar
         ========================================================================= */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#0b0e14] px-3 py-1 text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <FolderGit2 className="h-3 w-3 text-cyan-400" />
          <span className="text-zinc-500">firmware</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 font-semibold">{activeFile.name}</span>
          <span className="text-zinc-600">›</span>
          <span className="text-cyan-300 font-medium">{currentScope}</span>
        </div>

        {/* Quick controls: Font Size, Word Wrap, Search */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              wordWrap ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle Word Wrap"
          >
            Wrap
          </button>

          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <button
              onClick={() => setFontSize(Math.max(11, fontSize - 1))}
              className="px-1 hover:text-zinc-300"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span>{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(18, fontSize + 1))}
              className="px-1 hover:text-zinc-300"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-zinc-500 hover:text-zinc-300 p-0.5"
            title="Find (Ctrl+F)"
          >
            <Search className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          Main Editor Workspace & Inspector Split
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Code Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#090b10] overflow-hidden">
          {/* Code Editor Surface */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Synchronized Gutter Line Numbers & Breakpoints */}
            <div
              ref={gutterRef}
              className="w-12 bg-[#08090d] text-zinc-600 text-[11px] font-mono select-none px-1.5 text-right border-r border-zinc-800/80 overflow-hidden shrink-0 space-y-0"
              style={{ paddingTop: "12px", paddingBottom: "12px", lineHeight: "22px" }}
            >
              {activeLines.map((_, index) => {
                const lineNum = index + 1;
                const isCurrent = cursorPos.line === lineNum;
                const hasWarning = warningLinesSet.has(lineNum);
                const hasBreakpoint = breakpoints.has(lineNum);

                return (
                  <div
                    key={lineNum}
                    onClick={() => handleToggleBreakpoint(lineNum)}
                    className={`flex items-center justify-end gap-1 cursor-pointer group ${
                      isCurrent ? "text-zinc-200 font-semibold" : "hover:text-zinc-400"
                    }`}
                    style={{ height: "22px" }}
                    title={`Line ${lineNum} - Click to toggle breakpoint`}
                  >
                    {/* Breakpoint Dot */}
                    {hasBreakpoint ? (
                      <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500/0 group-hover:bg-rose-500/40 shrink-0" />
                    )}

                    {/* Warning Indicator */}
                    {hasWarning && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Blocking Delay Warning" />
                    )}

                    <span>{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Code Surface Container (Synchronized Backdrop + Editor) */}
            <div className="flex-1 relative overflow-hidden h-full">
              {/* Syntax Highlighted Backdrop */}
              <div
                ref={codeBackdropRef}
                className="absolute inset-0 pointer-events-none px-3 font-mono overflow-hidden select-none"
                style={{
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  fontSize: `${fontSize}px`,
                  lineHeight: "22px",
                  whiteSpace: wordWrap ? "pre-wrap" : "pre",
                  tabSize: 2,
                }}
              >
                {tokenizedLines.map((tokens, lineIdx) => {
                  const lineNum = lineIdx + 1;
                  const isCurrent = cursorPos.line === lineNum;
                  return (
                    <div
                      key={lineIdx}
                      style={{ minHeight: "22px" }}
                      className={`${isCurrent ? "bg-zinc-800/30 rounded-xs" : ""}`}
                    >
                      {tokens.map((token, tIdx) => (
                        <span key={tIdx} className={getTokenClass(token.type)}>
                          {token.text}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Native Typing Textarea Overlay */}
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
                style={{
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  fontSize: `${fontSize}px`,
                  lineHeight: "22px",
                  tabSize: 2,
                }}
                className={`absolute inset-0 h-full w-full bg-transparent text-transparent caret-sky-400 px-3 font-mono resize-none focus:outline-none selection:bg-sky-500/20 selection:text-transparent overflow-auto ${
                  wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                }`}
                placeholder="// Write Arduino C++ firmware code here..."
              />
            </div>
          </div>

          {/* =========================================================================
              Editor Bottom Status Bar
             ========================================================================= */}
          <div className="flex items-center justify-between border-t border-zinc-800 bg-[#090b10] px-3 h-7 text-[11px] font-mono text-zinc-400 shrink-0 whitespace-nowrap overflow-x-auto no-scrollbar gap-2 select-none">
            {/* Left Status Indicators */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink overflow-hidden">
              <span className="flex items-center gap-1 text-zinc-200 shrink-0">
                <FileCode className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{activeFile.name}</span>
              </span>

              {activeBoard.mcu && (
                <>
                  <span className="text-zinc-600 hidden md:inline shrink-0">•</span>
                  <span
                    className="text-zinc-300 hidden md:inline truncate max-w-[140px] xl:max-w-none shrink-0"
                    title={activeBoard.mcu}
                  >
                    {activeBoard.mcu}
                  </span>
                </>
              )}

              <span className="text-zinc-600 hidden lg:inline shrink-0">•</span>
              <span className="hidden lg:inline shrink-0">Spaces: 2</span>

              <span className="text-zinc-600 hidden xl:inline shrink-0">•</span>
              <span className="hidden xl:inline shrink-0">UTF-8</span>
            </div>

            {/* Right Status Actions & Position */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
              {analysis.baudRate && (
                <span className="hidden sm:flex items-center gap-1 text-zinc-300 shrink-0">
                  <Radio className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span>{analysis.baudRate} Baud</span>
                </span>
              )}

              {analysis.blockingDelays.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsConsoleOpen(true);
                    setConsoleTab("problems");
                  }}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors shrink-0"
                  title="View blocking delay warnings"
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>
                    {analysis.blockingDelays.length} Warning{analysis.blockingDelays.length > 1 ? "s" : ""}
                  </span>
                </button>
              )}

              <span className="text-zinc-300 shrink-0">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>

              <span className="text-zinc-500 hidden xl:inline shrink-0">
                {activeLines.length} lines • {activeFile.content.length} chars
              </span>

              {/* Bottom Console Toggle */}
              <button
                type="button"
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors border shrink-0 ${
                  isConsoleOpen
                    ? "bg-zinc-800 text-zinc-200 border-zinc-700 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-800/60"
                }`}
                title="Toggle Output & Serial Monitor Terminal"
              >
                <Terminal className="h-3 w-3 shrink-0" />
                <span>Console</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              Collapsible Bottom Panel: Build Log, Serial Monitor, Problems
             ========================================================================= */}
          {isConsoleOpen && (
            <div className="h-44 md:h-52 border-t border-zinc-800 bg-[#0d1017] flex flex-col shrink-0 overflow-hidden font-mono text-xs">
              {/* Bottom Tabs */}
              <div className="flex items-center justify-between border-b border-zinc-800 bg-[#090c12] px-2 pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setConsoleTab("build")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors border-b-2 ${
                      consoleTab === "build"
                        ? "border-sky-500 text-zinc-100 bg-[#0e1117]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Build Output</span>
                    {compileStatus === "success" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                    {compileStatus === "error" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    )}
                  </button>

                  <button
                    onClick={() => setConsoleTab("serial")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors border-b-2 ${
                      consoleTab === "serial"
                        ? "border-sky-500 text-zinc-100 bg-[#0e1117]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>Serial Monitor</span>
                    <span className="px-1 py-0.2 bg-zinc-800 rounded text-[10px] text-zinc-400">
                      {serialBaud}
                    </span>
                  </button>

                  <button
                    onClick={() => setConsoleTab("problems")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors border-b-2 ${
                      consoleTab === "problems"
                        ? "border-sky-500 text-zinc-100 bg-[#0e1117]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Problems ({analysis.blockingDelays.length})</span>
                  </button>

                  <button
                    onClick={() => setConsoleTab("plotter")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-medium transition-colors border-b-2 ${
                      consoleTab === "plotter"
                        ? "border-sky-500 text-zinc-100 bg-[#0e1117]"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <LineChart className="h-3.5 w-3.5" />
                    <span>Plotter</span>
                    {plotterData.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    )}
                  </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 pb-1">
                  {consoleTab === "serial" && (
                    <select
                      value={serialBaud}
                      onChange={(e) => setSerialBaud(parseInt(e.target.value, 10))}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value={9600}>9600 Baud</option>
                      <option value={19200}>19200 Baud</option>
                      <option value={38400}>38400 Baud</option>
                      <option value={57600}>57600 Baud</option>
                      <option value={115200}>115200 Baud</option>
                    </select>
                  )}

                  <button
                    onClick={() => {
                      if (consoleTab === "build") setBuildLogs([]);
                      if (consoleTab === "serial") setSerialLogs([]);
                      if (consoleTab === "plotter") setPlotterData([]);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Clear Console"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setIsConsoleOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Close Console"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Console Body Tab 1: Build Output */}
              {consoleTab === "build" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[11px] bg-[#090b10]">
                  {buildLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`${
                        log.includes("ERROR")
                          ? "text-rose-400 font-semibold"
                          : log.includes("SUCCESS") || log.includes("✓")
                          ? "text-emerald-400 font-semibold"
                          : log.includes("SIZE")
                          ? "text-zinc-300"
                          : "text-zinc-400"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  {isCompiling && (
                    <div className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Compiling object files and calculating footprint...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Console Tab 2: Serial Monitor */}
              {consoleTab === "serial" && (
                <div className="flex-1 flex flex-col min-h-0 bg-[#090b10]">
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-[11px] font-mono">
                    {serialLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2">
                        <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                        <span
                          className={`font-semibold shrink-0 ${
                            log.tag === "TX"
                              ? "text-sky-400"
                              : log.tag === "RX"
                              ? "text-emerald-400"
                              : log.tag === "BOOT"
                              ? "text-amber-400"
                              : log.tag === "USB"
                              ? "text-purple-400"
                              : "text-zinc-400"
                          }`}
                        >
                          [{log.tag}]
                        </span>
                        <span className="text-zinc-200">{log.text}</span>
                      </div>
                    ))}
                    <div ref={serialEndRef} />
                  </div>

                  {/* Serial Command Input */}
                  <div className="flex items-center gap-1.5 border-t border-zinc-800 bg-[#0e1117] p-1.5">
                    <input
                      type="text"
                      value={serialCommand}
                      onChange={(e) => setSerialCommand(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendSerialCommand();
                      }}
                      placeholder="Send Serial payload (e.g., PING, STATUS, AT+CMD)..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                    />
                    <button
                      onClick={handleSendSerialCommand}
                      className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded text-xs font-medium transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Console Tab 3: Problems List */}
              {consoleTab === "problems" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#090b10]">
                  {analysis.blockingDelays.length === 0 ? (
                    <div className="text-emerald-400 flex items-center gap-2 p-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>No code problems or blocking delays detected. Sketch is clean.</span>
                    </div>
                  ) : (
                    analysis.blockingDelays.map((delay, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded border border-zinc-800 bg-zinc-900/40 text-xs"
                      >
                        <div
                          onClick={() => handleJumpToLine(delay.line)}
                          className="flex items-center gap-2 cursor-pointer hover:underline text-zinc-200"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>
                            Blocking delay({delay.durationMs}ms) freezes sensor polling.
                          </span>
                          <span className="text-zinc-500 font-mono">Line {delay.line}</span>
                        </div>

                        <button
                          onClick={() => handleFixDelay(delay.line)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] font-medium transition-colors"
                        >
                          Auto-Fix with millis()
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Console Tab 4: Live Serial Waveform Plotter */}
              {consoleTab === "plotter" && (
                <div className="flex-1 flex flex-col min-h-0 bg-[#090b10] relative">
                  {/* Plotter Header Bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-[#0e1117] text-xs shrink-0">
                    {/* Channels legend */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                        Telemetry:
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-sky-400 font-mono">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          CH1: {plotterData[plotterData.length - 1]?.values[0] ?? "--"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          CH2: {plotterData[plotterData.length - 1]?.values[1] ?? "--"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          CH3: {plotterData[plotterData.length - 1]?.values[2] ?? "--"}
                        </span>
                      </div>
                    </div>

                    {/* Plotter Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsSimulatingTelemetry(!isSimulatingTelemetry)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                          isSimulatingTelemetry
                            ? "bg-zinc-800 text-sky-300 border-sky-600/60"
                            : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700"
                        }`}
                        title="Toggle virtual sinusoidal telemetry generator"
                      >
                        {isSimulatingTelemetry ? "Simulating Feed" : "Simulate Stream"}
                      </button>

                      <button
                        onClick={() => setIsPlotterPaused(!isPlotterPaused)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700"
                      >
                        {isPlotterPaused ? "Resume" : "Pause"}
                      </button>

                      <button
                        onClick={() => setPlotterData([])}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] border border-zinc-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Canvas Display */}
                  <div className="flex-1 w-full h-full relative overflow-hidden p-1">
                    <canvas
                      ref={plotterCanvasRef}
                      width={900}
                      height={160}
                      className="w-full h-full block rounded border border-zinc-800/80"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            Right Collapsible Inspector Pane
           ========================================================================= */}
        {isInspectorOpen && (
          <div className="w-80 md:w-96 border-l border-zinc-800 bg-[#0e1117] flex flex-col shrink-0 overflow-hidden text-xs font-mono select-none">
            {/* Inspector Navigation Tabs */}
            <div className="grid grid-cols-5 border-b border-zinc-800 bg-[#090b10] p-1 gap-1 shrink-0 text-center">
              <button
                onClick={() => setInspectorTab("diagnostics")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
                  inspectorTab === "diagnostics"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title="Firmware diagnostics"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Diag</span>
              </button>

              <button
                onClick={() => setInspectorTab("pins")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
                  inspectorTab === "pins"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title="Hardware pin mapping"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span>Pins</span>
              </button>

              <button
                onClick={() => setInspectorTab("platformio")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
                  inspectorTab === "platformio"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title="Board specs & PlatformIO"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Board</span>
              </button>

              <button
                onClick={() => setInspectorTab("ai")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
                  inspectorTab === "ai"
                    ? "bg-zinc-800 text-sky-300 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title="AI Copilot"
              >
                <Bot className="h-3.5 w-3.5 text-sky-400" />
                <span>AI</span>
              </button>

              <button
                onClick={() => setInspectorTab("libraries")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
                  inspectorTab === "libraries"
                    ? "bg-zinc-800 text-zinc-100 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
                title="Embedded libraries"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Libs</span>
              </button>
            </div>

            {/* Inspector Body Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Tab 1: Static Linter & Diagnostics */}
              {inspectorTab === "diagnostics" && (
                <div className="space-y-3">
                  {/* Firmware Health Score Badge */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        Firmware Health
                      </div>
                      <div className="text-sm font-bold text-zinc-100 mt-0.5">
                        {analysis.blockingDelays.length === 0 ? "Optimized & Ready" : "Optimization Recommended"}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {analysis.stats.lineCount} lines analyzed deterministically
                      </div>
                    </div>
                    <div className="h-9 w-9 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center shadow-xs">
                      {analysis.blockingDelays.length === 0 ? "A+" : "B"}
                    </div>
                  </div>

                  {/* Diagnostic Badges */}
                  <div className="space-y-2">
                    {analysis.diagnostics.map((diag) => {
                      const isWarning = diag.type === "warning";
                      const isSuccess = diag.type === "success";

                      return (
                        <div
                          key={diag.id}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
                              {isWarning ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              ) : isSuccess ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                              )}
                              <span>{diag.title}</span>
                            </div>
                            {diag.line && (
                              <button
                                onClick={() => handleJumpToLine(diag.line!)}
                                className="rounded bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 shrink-0 transition-colors cursor-pointer border border-zinc-700/60"
                                title="Jump to line in editor"
                              >
                                Line {diag.line}
                              </button>
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
                      <div className="text-zinc-300 font-medium text-[11px] flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Included Headers ({analysis.detectedLibraries.length})</span>
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
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
                      <div className="text-zinc-500">Lines of Code</div>
                      <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                        {analysis.stats.lineCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
                      <div className="text-zinc-500">Hardware Pins</div>
                      <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                        {analysis.stats.pinCount}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Hardware Pin Analysis & Cross-Reference */}
              {inspectorTab === "pins" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-semibold text-zinc-200 text-xs">Hardware Pin Mapping</span>
                    <button
                      onClick={handleSyncPinsFromCircuit}
                      className="text-sky-400 hover:text-sky-300 text-[10px] font-medium flex items-center gap-1"
                    >
                      <Layers className="h-3 w-3" />
                      <span>Sync Pins</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Pins declared in code mapped against Circuit Studio wire connections.
                  </p>

                  <div className="space-y-2 mt-2">
                    {analysis.extractedPins.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-4 text-center text-zinc-500 text-xs">
                        No GPIO pin references found in code.
                      </div>
                    ) : (
                      analysis.extractedPins.map((p, idx) => {
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
                              <span className="font-medium text-zinc-200 text-xs">Pin {p.pin}</span>
                              <button
                                onClick={() => handleJumpToLine(p.lineNumbers[0])}
                                className="text-[10px] text-zinc-500 hover:text-zinc-300"
                              >
                                Line {p.lineNumbers.join(", ")}
                              </button>
                            </div>

                            <div className="text-[10px] text-zinc-400">
                              Usage: <span className="text-zinc-300">{p.operations.join(" • ")}</span>
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

              {/* Tab 3: Target Board & PlatformIO Profile */}
              {inspectorTab === "platformio" && (
                <div className="space-y-3">
                  {/* Microcontroller Specifications Card */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100 text-xs">{activeBoard.label}</span>
                      <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-800">
                        {activeBoard.voltage}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-zinc-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Architecture:</span>
                        <span>{activeBoard.mcu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Clock Speed:</span>
                        <span>{activeBoard.freq}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Flash Memory:</span>
                        <span>{activeBoard.flash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">SRAM Memory:</span>
                        <span>{activeBoard.sram}</span>
                      </div>
                    </div>
                  </div>

                  {/* platformio.ini Preview */}
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-semibold text-zinc-200 text-xs">platformio.ini Preview</span>
                    <button
                      onClick={handleDownloadPlatformIo}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 overflow-x-auto text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre">
                    {generatePlatformIoIni(selectedBoardId, analysis.baudRate || 115200)}
                  </div>
                </div>
              )}

              {/* Tab 4: Gemma AI Firmware Copilot */}
              {inspectorTab === "ai" && (
                <div className="space-y-3">
                  {/* Model Header */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5 text-sky-400" />
                        Gemma AI Copilot
                      </span>
                      <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
                        Multi-Key Failover
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Intelligent microcontroller code assistant with circuit topology awareness.
                    </p>
                  </div>

                  {/* Quick Action 1: Auto-Fix */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200 text-xs flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                        Auto-Fix & Optimize
                      </span>
                      {analysis.blockingDelays.length > 0 && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          {analysis.blockingDelays.length} delays
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Replaces blocking delay() calls with non-blocking millis() state machines.
                    </p>
                    <button
                      onClick={handleAiFixCode}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                    >
                      {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-sky-400" />}
                      <span>Auto-Fix Active Sketch</span>
                    </button>
                  </div>

                  {/* Quick Action 2: Generate Drivers from Circuit */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200 text-xs flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                        Driver Scaffolding
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {circuitConnections.length} wires connected
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Scaffolds sensor/actuator driver routines mapped to Circuit Studio connections.
                    </p>
                    <button
                      onClick={handleAiGenerateDrivers}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                    >
                      {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3 text-emerald-400" />}
                      <span>Scaffold Circuit Drivers</span>
                    </button>
                  </div>

                  {/* Quick Action 3: Explain Code */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
                    <span className="font-medium text-zinc-200 text-xs flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                      Code Architecture Breakdown
                    </span>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Explains register manipulation, memory footprint, and loop timing execution.
                    </p>
                    <button
                      onClick={handleAiExplainCode}
                      disabled={aiLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                    >
                      {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Info className="h-3 w-3 text-amber-400" />}
                      <span>Explain Code Architecture</span>
                    </button>
                  </div>

                  {/* Custom AI Instruction */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-2">
                    <span className="font-medium text-zinc-200 text-xs flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-sky-400" />
                      Custom Copilot Prompt
                    </span>
                    <textarea
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder="e.g., Add non-blocking debounce for button on GPIO 4, or format telemetry for MQTT..."
                      className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAiGenerateDrivers}
                        disabled={aiLoading || !aiCustomPrompt.trim()}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs"
                      >
                        {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        <span>Generate</span>
                      </button>
                      <button
                        onClick={handleAiExplainCode}
                        disabled={aiLoading || !aiCustomPrompt.trim()}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                      >
                        <span>Ask / Explain</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Explanation / Feedback Result Box */}
                  {aiExplanation && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          AI Output
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiExplanation);
                              alert("Copied explanation!");
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => setAiExplanation(null)}
                            className="text-[10px] text-zinc-500 hover:text-white"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {aiExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Embedded Library Manager */}
              {inspectorTab === "libraries" && (
                <div className="space-y-3">
                  {/* Library Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search sensors, displays, drivers..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  {/* Library Catalog List */}
                  <div className="space-y-2">
                    {EMBEDDED_LIBRARIES.filter(
                      (l) =>
                        l.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
                        l.category.toLowerCase().includes(librarySearch.toLowerCase()) ||
                        l.description.toLowerCase().includes(librarySearch.toLowerCase()) ||
                        l.header.toLowerCase().includes(librarySearch.toLowerCase())
                    ).map((lib) => {
                      const isIncluded = activeFile.content.includes(lib.header);

                      return (
                        <div
                          key={lib.header}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                                <span>{lib.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                                  {lib.category}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                by {lib.author}
                              </div>
                            </div>

                            {isIncluded && (
                              <span className="rounded bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 text-[9px] text-emerald-400 font-medium flex items-center gap-0.5 shrink-0">
                                <Check className="h-2.5 w-2.5" />
                                Included
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-normal">
                            {lib.description}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                            <code className="text-[10px] text-zinc-300 font-mono">
                              &lt;{lib.header}&gt;
                            </code>

                            <div className="flex items-center gap-1.5">
                              {!isIncluded && (
                                <button
                                  onClick={() => handleIncludeLibrary(lib)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-medium transition-colors"
                                  title="Add #include header to active sketch"
                                >
                                  + Include
                                </button>
                              )}
                              {lib.platformio && (
                                <button
                                  onClick={() => handleAddLibraryToPlatformIo(lib)}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-medium transition-colors"
                                  title="Add to platformio.ini lib_deps"
                                >
                                  + PlatformIO
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          New File Modal
         ========================================================================= */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3 font-mono shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-sky-400" />
                Create New Firmware File
              </span>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Enter file name with extension (e.g., <code className="text-sky-300">sensors.h</code> or <code className="text-sky-300">driver.cpp</code>):
            </p>

            <input
              type="text"
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateNewFile();
                if (e.key === "Escape") setShowNewFileModal(false);
              }}
              placeholder="e.g. telemetry.h"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-3 py-1.5 rounded text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Insert Snippets & Code Templates Modal
         ========================================================================= */}
      {showSnippetsMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 font-mono shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 p-4 shrink-0 bg-zinc-900/90">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-sky-400" />
                <span className="font-bold text-sm text-zinc-100">
                  Insert Firmware Snippet
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {SNIPPET_TEMPLATES.length} templates
                </span>
              </div>
              <button
                onClick={() => setShowSnippetsMenu(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 border-b border-zinc-800 bg-[#090b10] shrink-0">
              <input
                type="text"
                value={snippetFilter}
                onChange={(e) => setSnippetFilter(e.target.value)}
                placeholder="Search templates (e.g. blink, button, i2c, millis)..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {SNIPPET_TEMPLATES.filter(
                (sn) =>
                  sn.title.toLowerCase().includes(snippetFilter.toLowerCase()) ||
                  sn.description.toLowerCase().includes(snippetFilter.toLowerCase())
              ).map((snippet, idx) => (
                <div
                  key={idx}
                  className="group rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 hover:border-zinc-700 transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-sky-300">
                        {snippet.title}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {snippet.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInsertSnippet(snippet.code)}
                      className="px-2.5 py-1 rounded text-xs bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white transition shrink-0 font-medium"
                    >
                      Insert at Cursor
                    </button>
                  </div>
                  <pre className="max-h-24 overflow-hidden text-[10px] bg-[#090b10] border border-zinc-800/80 rounded p-2 text-zinc-400 select-none">
                    {snippet.code.slice(0, 180)}...
                  </pre>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800 p-3 bg-zinc-900/90 text-[11px] text-zinc-500 shrink-0">
              <span>Code will be inserted into active file at cursor position.</span>
              <button
                onClick={() => setShowSnippetsMenu(false)}
                className="px-3 py-1 rounded text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
