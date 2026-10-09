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
