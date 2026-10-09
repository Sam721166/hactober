// Deterministic Pattern-Based Firmware Pin Extractor

export interface ExtractedPin {
  pin: string;
  operations: string[];
  lineNumbers: number[];
  evidence: string;
}

/**
 * Deterministically parses common Arduino/C++ patterns to extract pin references,
 * operation types, and source line numbers.
 * Limitations: Pattern-based extraction (regular expressions), does not perform full C++ AST parsing.
 */
export function extractPinsFromCode(code: string): ExtractedPin[] {
  if (!code) return [];

  const lines = code.split("\n");
  const pinMap = new Map<string, { operations: Set<string>; lineNumbers: Set<number>; samples: string[] }>();

  // Constant/Macro definitions: #define LED_PIN 13 or const int LED_PIN = 13;
  const aliasMap = new Map<string, string>();

  lines.forEach((line) => {
    const cleanLine = line.trim();
    // #define PIN_NAME 13
    const defineMatch = cleanLine.match(/^#define\s+([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)/);
    if (defineMatch) {
      aliasMap.set(defineMatch[1], defineMatch[2]);
    }

    // const int PIN_NAME = 13;
    const constMatch = cleanLine.match(/(?:const\s+)?(?:int|uint8_t|byte)\s+([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\s*;/);
    if (constMatch) {
      aliasMap.set(constMatch[1], constMatch[2]);
    }
  });

  const recordPinOp = (rawPin: string, op: string, lineNum: number, sample: string) => {
    let pinStr = rawPin.trim();
    if (aliasMap.has(pinStr)) {
      pinStr = `${aliasMap.get(pinStr)} (${pinStr})`;
    }

    if (!pinMap.has(pinStr)) {
      pinMap.set(pinStr, {
        operations: new Set(),
        lineNumbers: new Set(),
        samples: [],
      });
    }

    const entry = pinMap.get(pinStr)!;
    entry.operations.add(op);
    entry.lineNumbers.add(lineNum);
    if (entry.samples.length < 2) {
      entry.samples.push(sample.trim());
    }
  };

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const cleanLine = line.trim();
    if (cleanLine.startsWith("//") || cleanLine.startsWith("/*") || cleanLine.startsWith("*")) {
      return;
    }

    // pinMode(pin, mode)
    const pinModeMatches = cleanLine.matchAll(/pinMode\s*\(\s*([^,\s]+)\s*,\s*([^)]+)\s*\)/g);
    for (const m of pinModeMatches) {
      recordPinOp(m[1], `pinMode(${m[2].trim()})`, lineNum, cleanLine);
    }

    // digitalWrite(pin, val)
    const dwMatches = cleanLine.matchAll(/digitalWrite\s*\(\s*([^,\s]+)\s*,\s*([^)]+)\s*\)/g);
    for (const m of dwMatches) {
      recordPinOp(m[1], `digitalWrite(${m[2].trim()})`, lineNum, cleanLine);
    }

    // digitalRead(pin)
    const drMatches = cleanLine.matchAll(/digitalRead\s*\(\s*([^)]+)\s*\)/g);
    for (const m of drMatches) {
      recordPinOp(m[1], "digitalRead()", lineNum, cleanLine);
    }

    // analogWrite(pin, val)
    const awMatches = cleanLine.matchAll(/analogWrite\s*\(\s*([^,\s]+)\s*,\s*([^)]+)\s*\)/g);
    for (const m of awMatches) {
      recordPinOp(m[1], "analogWrite(PWM)", lineNum, cleanLine);
    }

    // analogRead(pin)
    const arMatches = cleanLine.matchAll(/analogRead\s*\(\s*([^)]+)\s*\)/g);
    for (const m of arMatches) {
      recordPinOp(m[1], "analogRead(ADC)", lineNum, cleanLine);
    }

    // servo.attach(pin)
    const servoMatches = cleanLine.matchAll(/\.attach\s*\(\s*([^)]+)\s*\)/g);
    for (const m of servoMatches) {
      recordPinOp(m[1], "Servo.attach()", lineNum, cleanLine);
    }

    // Wire.begin(sda, scl)
    const wireMatches = cleanLine.matchAll(/Wire\.begin\s*\(\s*([^,\s]+)\s*,\s*([^)]+)\s*\)/g);
    for (const m of wireMatches) {
      recordPinOp(m[1], "I2C SDA (Wire.begin)", lineNum, cleanLine);
      recordPinOp(m[2], "I2C SCL (Wire.begin)", lineNum, cleanLine);
    }
  });

  const results: ExtractedPin[] = [];
  pinMap.forEach((val, pin) => {
    results.push({
      pin,
      operations: Array.from(val.operations),
      lineNumbers: Array.from(val.lineNumbers).sort((a, b) => a - b),
      evidence: val.samples.join("; "),
    });
  });

  return results.sort((a, b) => a.pin.localeCompare(b.pin));
}

export interface FirmwareDiagnosticItem {
  id: string;
  type: "info" | "warning" | "success" | "hint";
  title: string;
  detail: string;
  line?: number;
}

export interface FirmwareAnalysisResult {
  baudRate: number | null;
  extractedPins: ExtractedPin[];
  blockingDelays: { line: number; durationMs: number }[];
  detectedLibraries: string[];
  diagnostics: FirmwareDiagnosticItem[];
  stats: {
    lineCount: number;
    charCount: number;
    pinCount: number;
    hasSetup: boolean;
    hasLoop: boolean;
  };
}

/**
 * Performs comprehensive static analysis on Arduino/C++ firmware code.
 */
export function analyzeFirmware(code: string): FirmwareAnalysisResult {
  const extractedPins = extractPinsFromCode(code);
  const lines = code.split("\n");
  const diagnostics: FirmwareDiagnosticItem[] = [];
  const blockingDelays: { line: number; durationMs: number }[] = [];
  const detectedLibraries: string[] = [];
  let baudRate: number | null = null;

  let hasSetup = false;
  let hasLoop = false;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const clean = line.trim();

    if (clean.startsWith("//") || clean.startsWith("/*") || clean.startsWith("*")) return;

    // Check setup/loop
    if (/void\s+setup\s*\(\s*\)/.test(clean)) hasSetup = true;
    if (/void\s+loop\s*\(\s*\)/.test(clean)) hasLoop = true;

    // Check Serial.begin(baud)
    const baudMatch = clean.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
    if (baudMatch) {
      baudRate = parseInt(baudMatch[1], 10);
    }

    // Check library includes
    const includeMatch = clean.match(/#include\s+[<"]([^>"]+)[>"]/);
    if (includeMatch) {
      detectedLibraries.push(includeMatch[1]);
    }

    // Check blocking delay()
    const delayMatch = clean.match(/delay\s*\(\s*(\d+)\s*\)/);
    if (delayMatch) {
      const ms = parseInt(delayMatch[1], 10);
      if (ms >= 500) {
        blockingDelays.push({ line: lineNum, durationMs: ms });
        diagnostics.push({
          id: `delay-${lineNum}`,
          type: "warning",
          title: `Blocking delay(${ms}ms) on Line ${lineNum}`,
          detail: "Long delays freeze sensor polling and responsive loop iterations. Consider using a non-blocking millis() timer.",
          line: lineNum,
        });
      }
    }
  });

  // Overall structure diagnostics
  if (!hasSetup) {
    diagnostics.push({
      id: "missing-setup",
      type: "warning",
      title: "Missing void setup()",
      detail: "Arduino sketches require a void setup() function to initialize pins and hardware peripherals.",
    });
  }

  if (!hasLoop) {
    diagnostics.push({
      id: "missing-loop",
      type: "warning",
      title: "Missing void loop()",
      detail: "Arduino sketches require a void loop() function for continuous firmware execution.",
    });
  }

  if (baudRate !== null) {
    diagnostics.push({
      id: "baud-detected",
      type: "success",
      title: `Serial Port: ${baudRate} Baud`,
      detail: `Serial UART telemetry initialized at ${baudRate} baud rate.`,
    });
  } else {
    diagnostics.push({
      id: "no-baud",
      type: "hint",
      title: "No Serial.begin() found",
      detail: "Add Serial.begin(115200); in setup() to enable Serial Monitor telemetry output.",
    });
  }

  return {
    baudRate,
    extractedPins,
    blockingDelays,
    detectedLibraries,
    diagnostics,
    stats: {
      lineCount: lines.length,
      charCount: code.length,
      pinCount: extractedPins.length,
      hasSetup,
      hasLoop,
    },
  };
}

/**
 * Generates formatted #define hardware pin macros based on Circuit Studio connections.
 */
export function generatePinHeader(connections: any[]): string {
  if (!connections || connections.length === 0) {
    return "// No active wire connections found in Circuit Studio.\n";
  }

  const seenPins = new Set<string>();
  const lines: string[] = [
    "// ===========================================================",
    "// AUTO-GENERATED HARDWARE PIN DEFINITIONS (Circuit Studio)",
    "// ===========================================================",
  ];

  connections.forEach((conn) => {
    const pin = (conn.targetPin || conn.sourcePin || "").trim();
    const componentId = conn.sourceComponentId || conn.targetComponentId || "DEVICE";
    if (!pin) return;

    const upperPin = pin.toUpperCase();
    if (upperPin.includes("VCC") || upperPin.includes("GND") || upperPin.includes("5V") || upperPin.includes("3V3")) {
      return; // Skip power rails
    }

    // Clean pin name for C macro
    const macroName = `PIN_${componentId.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()}_${pin.replace(/[^A-Za-z0-9_]/g, "_")}`;
    if (!seenPins.has(macroName)) {
      seenPins.add(macroName);
      lines.push(`#define ${macroName.padEnd(28, " ")} ${pin} // Connected to ${componentId}`);
    }
  });

  lines.push("// ===========================================================\n");
  return lines.join("\n");
}

/**
 * Generates a standard PlatformIO platformio.ini configuration file for the target board.
 */
export function generatePlatformIoIni(board: string = "esp32", baudRate: number = 115200): string {
  const b = board.toLowerCase();
  if (b.includes("uno")) {
    return `[env:uno]
platform = atmelavr
board = uno
framework = arduino
monitor_speed = ${baudRate}
`;
  }
  if (b.includes("nano")) {
    return `[env:nano]
platform = atmelavr
board = nanoatmega328
framework = arduino
monitor_speed = ${baudRate}
`;
  }
  if (b.includes("pico")) {
    return `[env:raspberrypi_pico]
platform = raspberrypi
board = pico
framework = arduino
monitor_speed = ${baudRate}
`;
  }

  // Default to ESP32 DevKit
  return `[env:esp32dev]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino
monitor_speed = ${baudRate}
upload_speed = 921600
`;
}

