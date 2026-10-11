import { describe, it } from "node:test";
import assert from "node:assert";
import {
  extractPinsFromCode,
  analyzeFirmware,
  generatePinHeader,
  generatePlatformIoIni,
} from "../lib/analysis/firmware";
import { COMPONENT_DEFINITIONS } from "../lib/circuits/registry";
import {
  initDb,
  getProjects,
  getProjectById,
  createProject,
  saveCircuitDesign,
  saveFirmware,
  createDebugSession,
  updateDebugSession,
  getCatalogueComponents,
} from "../lib/db";
import {
  CircuitAnalysisResultSchema,
  ProjectPlanSchema,
} from "../lib/ai";

console.log("=================================================");
console.log("🧪  CIRCUITDOCTOR Automated Verification Suite");
console.log("=================================================\n");

async function runTestSuite() {
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  };

  // 1. Firmware Pin Extraction
  await test("Firmware static analysis extracts pinModes and line numbers", () => {
    const code = `
      #define LED_PIN 13
      const int SENSOR_PIN = 4;
      void setup() {
        pinMode(LED_PIN, OUTPUT);
        pinMode(SENSOR_PIN, INPUT);
        digitalWrite(LED_PIN, HIGH);
      }
      void loop() {
        int v = analogRead(A0);
        analogWrite(9, 128);
      }
    `;
    const pins = extractPinsFromCode(code);
    assert.strictEqual(pins.length >= 3, true, "Should extract at least 3 pins");

    const a0 = pins.find((p) => p.pin === "A0");
    assert.ok(a0, "Should detect A0");
    assert.ok(a0.operations.includes("analogRead(ADC)"), "Should record analogRead");

    const pin9 = pins.find((p) => p.pin === "9");
    assert.ok(pin9, "Should detect pin 9");
    assert.ok(pin9.operations.includes("analogWrite(PWM)"), "Should record PWM");
  });

  // 1b. Advanced Firmware Static Linter & Analysis
  await test("Firmware static analysis detects baud rate, blocking delays, and generates headers", () => {
    const sketch = `
      #include <Wire.h>
      #include <WiFi.h>
      #define SENSOR_PIN 4

      void setup() {
        Serial.begin(115200);
        Wire.begin();
        pinMode(SENSOR_PIN, INPUT);
      }

      void loop() {
        int v = digitalRead(SENSOR_PIN);
        delay(1000); // Blocking delay
      }
    `;

    const analysis = analyzeFirmware(sketch);
    assert.strictEqual(analysis.baudRate, 115200, "Should detect 115200 baud rate");
    assert.strictEqual(analysis.blockingDelays.length, 1, "Should flag blocking delay");
    assert.strictEqual(analysis.blockingDelays[0].durationMs, 1000, "Should identify 1000ms delay");
    assert.ok(analysis.detectedLibraries.includes("Wire.h"), "Should detect Wire.h include");
    assert.ok(analysis.detectedLibraries.includes("WiFi.h"), "Should detect WiFi.h include");
    assert.strictEqual(analysis.stats.hasSetup, true, "Should confirm setup()");
    assert.strictEqual(analysis.stats.hasLoop, true, "Should confirm loop()");

    // Test pin header generator
    const fakeConnections = [
      { sourcePin: "D4", sourceComponentId: "esp32", targetPin: "DATA", targetComponentId: "dht22" },
      { sourcePin: "3V3", sourceComponentId: "esp32", targetPin: "VCC", targetComponentId: "dht22" }
    ];
    const header = generatePinHeader(fakeConnections);
    assert.ok(header.includes("PIN_ESP32_DATA") || header.includes("PIN_DHT22"), "Header should format pin macros");
    assert.strictEqual(header.includes("3V3"), false, "Header should exclude power rails");

    // Test platformio.ini generator
    const pioIni = generatePlatformIoIni("esp32", 115200);
    assert.ok(pioIni.includes("[env:esp32dev]"), "Should generate ESP32 environment");
    assert.ok(pioIni.includes("monitor_speed = 115200"), "Should set telemetry baud");
  });

  // 2. Circuit Component Definitions
  await test("Component registry has valid pin layouts and metadata", () => {
    const esp32 = COMPONENT_DEFINITIONS.esp32;
    assert.ok(esp32, "ESP32 definition must exist");
    assert.strictEqual(esp32.pins.some((p) => p.name === "3V3"), true);
    assert.strictEqual(esp32.pins.some((p) => p.name === "GND"), true);

    const dht = COMPONENT_DEFINITIONS.dht22_sensor;
    assert.ok(dht, "DHT22 definition must exist");
    assert.strictEqual(dht.pins.some((p) => p.name === "DATA"), true);
  });

  // 3. Database Initializer and Seeding
  await test("PostgreSQL database initializes and loads sample projects", async () => {
    await initDb();
    const projects = await getProjects();
    assert.strictEqual(projects.length >= 8, true, "Should have at least 8 sample projects");
    
    const irrigation = projects.find((p) => p.title.includes("Smart Irrigation"));
    assert.ok(irrigation, "Smart Irrigation project should exist in database");
    assert.strictEqual(irrigation.board, "ESP32");
  });

  // 4. Project Creation and Persistence
  let createdProjectId = "";
  await test("Create custom project in database", async () => {
    const newProj = await createProject({
      title: "Automated Greenhouse Monitor",
      description: "ESP32 greenhouse telemetry system with solar power.",
      board: "ESP32",
      category: "IoT",
      difficulty: "Intermediate",
      budgetInr: 1600,
      plan: {
        overview: "Greenhouse sensor network",
        features: ["Soil logging", "Ventilation control"],
      },
      circuit: {
        components: [
          { id: "esp-1", type: "esp32", label: "ESP32 DevKit", x: 250, y: 150 },
          { id: "dht-1", type: "dht22_sensor", label: "DHT22", x: 80, y: 100 },
        ],
        connections: [
          {
            id: "w1",
            sourceComponentId: "dht-1",
            sourcePin: "DATA",
            targetComponentId: "esp-1",
            targetPin: "GPIO4",
            status: "confirmed",
            evidence: "1-wire data",
          },
        ],
      },
      bom: [
        { ref: "U1", name: "ESP32 DevKit", quantity: 1, unitPriceInr: 399 },
      ],
    });

    assert.ok(newProj.id, "Should assign unique project ID");
    createdProjectId = newProj.id;

    // Verify retrieval
    const retrieved = await getProjectById(createdProjectId);
    assert.ok(retrieved, "Should retrieve newly created project");
    assert.strictEqual(retrieved.title, "Automated Greenhouse Monitor");
    assert.strictEqual(retrieved.circuit.components.length, 2);
  });

  // 5. Circuit Save and Reload Cycle
  await test("Save updated circuit design to project and verify persistence", async () => {
    assert.ok(createdProjectId, "Project ID must be present");
    const updatedComponents = [
      { id: "esp-1", type: "esp32", label: "ESP32 DevKit", x: 300, y: 180 },
      { id: "dht-1", type: "dht22_sensor", label: "DHT22 Sensor", x: 100, y: 120 },
      { id: "oled-1", type: "oled_display", label: "OLED Screen", x: 500, y: 120 },
    ];
    const updatedConnections = [
      {
        id: "w1",
        sourceComponentId: "dht-1",
        sourcePin: "DATA",
        targetComponentId: "esp-1",
        targetPin: "GPIO4",
        status: "confirmed",
        evidence: "1-wire data",
      },
      {
        id: "w2",
        sourceComponentId: "oled-1",
        sourcePin: "SDA",
        targetComponentId: "esp-1",
        targetPin: "GPIO21",
        status: "confirmed",
        evidence: "I2C SDA",
      },
    ];

    const saveRes = await saveCircuitDesign(createdProjectId, {
      components: updatedComponents,
      connections: updatedConnections,
    });
    assert.strictEqual(saveRes.ok, true);

    const reloaded = await getProjectById(createdProjectId);
    assert.strictEqual(reloaded.circuit.components.length, 3, "Should persist 3 components");
    assert.strictEqual(reloaded.circuit.connections.length, 2, "Should persist 2 connections");
  });

  // 5b. Multi-File Firmware Persistence
  await test("Save and retrieve multi-file firmware without file overwrites", async () => {
    await saveFirmware(createdProjectId, "main.ino", "void setup() {} void loop() {}");
    await saveFirmware(createdProjectId, "config.h", "#define LED_PIN 13");
    await saveFirmware(createdProjectId, "platformio.ini", "[env:esp32]\nplatform = espressif32");

    const proj = await getProjectById(createdProjectId);
    assert.ok(proj.firmwares && proj.firmwares.length >= 3, "Should persist multiple firmware files");
    const mainF = proj.firmwares.find((f: any) => f.filename === "main.ino");
    const configF = proj.firmwares.find((f: any) => f.filename === "config.h");
    const pioF = proj.firmwares.find((f: any) => f.filename === "platformio.ini");

    assert.ok(mainF && mainF.content.includes("void setup()"), "main.ino content intact");
    assert.ok(configF && configF.content.includes("#define LED_PIN 13"), "config.h content intact");
    assert.ok(pioF && pioF.content.includes("[env:esp32]"), "platformio.ini content intact");
  });

  // 6. Diagnostic Session Creation & Test Recording
  let debugSessionId = "";
  await test("Create Circuit Doctor diagnostic session and record multimeter test results", async () => {
    const session = await createDebugSession({
      title: "ESP32 Power Rail Overheat Inspection",
      boardType: "ESP32",
      expectedBehavior: "Board powers up and blinks onboard LED",
      actualBehavior: "Voltage regulator becomes excessively hot",
      observations: [
        { description: "Reverse polarity suspected on VIN pin", confidence: "High", evidence: "Red wire connects to GND header" },
      ],
      hypotheses: [
        {
          id: "fault-polarity",
          title: "Inverted Power Rail Connection",
          explanation: "Connecting 5V power supply ground to positive input stresses regulator diode.",
          confidence: "High",
          evidence: "Wire coloring indicates reversed rail",
          recommendedTest: "Disconnect power supply. Measure resistance from VIN to GND.",
          expectedResult: "Resistance > 100k Ohm, not zero.",
        },
      ],
    });

    assert.ok(session.id, "Session ID generated");
    debugSessionId = session.id;

    // Record test outcome
    const updated = await updateDebugSession(debugSessionId, {
      testResults: [
        {
          hypothesisId: "fault-polarity",
          testPerformed: "Continuity mode resistance test with Fluke DMM",
          result: "0.2 Ohm short circuit measured across VIN/GND",
          notes: "Confirmed inverted jumper wire was bridging rails",
          outcome: "Failed",
          timestamp: new Date().toISOString(),
        },
      ],
      status: "RESOLVED",
      resolvedSummary: "Corrected inverted jumper wire; voltage regulator now remains cool.",
    });

    assert.strictEqual(updated.status, "RESOLVED");
    assert.strictEqual(updated.test_results.length, 1);
  });

  // 7. Component Catalogue Query
  await test("Query component catalogue with category filter", async () => {
    const sensors = await getCatalogueComponents({ category: "Sensors" });
    assert.strictEqual(sensors.length >= 3, true, "Should return at least 3 sensors");
    assert.strictEqual(sensors.some((s) => s.name.includes("DHT22")), true);
  });

  // 8. AI Schema Validation Rules
  await test("Validate Zod schemas for AI Project Plan and Diagnostic Analysis", () => {
    const samplePlan = {
      title: "Smart Garden",
      overview: "Automated telemetry",
      problem: "Watering schedules",
      solution: "Sensors and pumps",
      features: ["Moisture logging"],
      hardwareRequirements: ["ESP32", "Soil Sensor"],
      circuit: {
        components: [{ id: "esp-1", type: "esp32", label: "ESP32", x: 0, y: 0 }],
        connections: [{ id: "c1", sourceComponentId: "esp-1", sourcePin: "3V3", targetComponentId: "esp-1", targetPin: "GND", status: "proposed", evidence: "Power" }],
      },
      wiringInstructions: [{ from: "Sensor VCC", to: "ESP32 3V3", pinFrom: "VCC", pinTo: "3V3" }],
      firmware: { filename: "main.ino", language: "arduino", content: "void setup() {}", explanation: "Setup" },
      buildSteps: [{ step: 1, goal: "Mount", instructions: "Place on breadboard", outcome: "Mounted" }],
      testingGuide: ["Test 1"],
      limitations: ["Indoor only"],
      safetyNotes: ["3.3V only"],
      estimatedCost: "₹1,200",
      bom: [{ ref: "U1", name: "ESP32", quantity: 1, unitPriceInr: 399 }],
    };

    const parsedPlan = ProjectPlanSchema.safeParse(samplePlan);
    assert.strictEqual(parsedPlan.success, true, "ProjectPlanSchema should validate correctly");

    const sampleAnalysis = {
      summary: "Inverted power connection detected.",
      visibleObservations: [{ description: "Red wire on GND", confidence: "High" as const, evidence: "Header pin 2" }],
      identifiedComponents: [{ name: "ESP32", status: "Observed" as const }],
      potentialFaults: [{
        id: "f-1",
        title: "Short circuit",
        explanation: "VCC shorted to ground",
        confidence: "High" as const,
        evidence: "Red jumper wire",
        recommendedTest: "Resistance check",
        expectedResult: "Megaohms",
      }],
      recommendedSteps: ["Power off board"],
      missingInformation: [],
      safetyWarnings: ["Risk of component destruction"],
    };

    const parsedAnalysis = CircuitAnalysisResultSchema.safeParse(sampleAnalysis);
    assert.strictEqual(parsedAnalysis.success, true, "CircuitAnalysisResultSchema should validate correctly");
  });

  // 10. Real Circuit Logic & Simulation Engine
  await test("Circuit Engine: Detects real short circuit when VCC is wired directly to GND", async () => {
    const { evaluateCircuitState } = await import("../lib/circuits/engine");
    const components = [
      { id: "esp-1", type: "esp32", label: "ESP32 DevKit" },
    ];
    // Connect 3V3 directly to GND
    const connections = [
      { id: "w-short", sourceComponentId: "esp-1", sourcePin: "3V3", targetComponentId: "esp-1", targetPin: "GND" },
    ];
    const env = {
      virtualSensors: {
        soilMoisture: 50,
        temperature: 25,
        humidity: 50,
        distanceCm: 100,
        lightLux: 300,
        potentiometerVal: 512,
        gasPpm: 100,
        isButtonPressed: false,
        isSwitchLatching: false,
        isMotionTriggered: false,
        isAutoFluctuate: false,
      },
      gpioOutputs: {},
      switchStates: {},
      simTick: 1,
    };

    const result = evaluateCircuitState(components, connections, env);
    assert.strictEqual(result.designRules.some((r) => r.id === "drc-short-circuit"), true, "Must flag short circuit DRC error");
    assert.strictEqual(result.componentStatuses["esp-1"].isShortCircuited, true, "ESP32 must register short circuited status");
  });

  await test("Circuit Engine: Detects LED overcurrent when connected directly across power rails without resistor", async () => {
    const { evaluateCircuitState } = await import("../lib/circuits/engine");
    const components = [
      { id: "battery-1", type: "battery_9v", label: "9V Battery" },
      { id: "led-1", type: "led", label: "Red 5mm LED" },
    ];
    const connections = [
      { id: "w1", sourceComponentId: "battery-1", sourcePin: "POS", targetComponentId: "led-1", targetPin: "ANODE" },
      { id: "w2", sourceComponentId: "led-1", sourcePin: "CATHODE", targetComponentId: "battery-1", targetPin: "GND" },
    ];
    const env = {
      virtualSensors: {
        soilMoisture: 50,
        temperature: 25,
        humidity: 50,
        distanceCm: 100,
        lightLux: 300,
        potentiometerVal: 512,
        gasPpm: 100,
        isButtonPressed: false,
        isSwitchLatching: false,
        isMotionTriggered: false,
        isAutoFluctuate: false,
      },
      gpioOutputs: {},
      switchStates: {},
      simTick: 1,
    };

    const result = evaluateCircuitState(components, connections, env);
    const ledStatus = result.componentStatuses["led-1"];
    assert.strictEqual(ledStatus.isBurnedOut, true, "LED without resistor on 9V must burn out");
    assert.strictEqual(result.designRules.some((r) => r.severity === "critical" && r.title.includes("Overcurrent")), true);
  });

  await test("Circuit Engine: Push button closes loop to illuminate LED with current limiting resistor", async () => {
    const { evaluateCircuitState } = await import("../lib/circuits/engine");
    const components = [
      { id: "battery-1", type: "battery_9v", label: "9V Battery" },
      { id: "sw-1", type: "push_button", label: "Tactile Switch" },
      { id: "res-1", type: "resistor", label: "220Ω Resistor" },
      { id: "led-1", type: "led", label: "Red LED" },
    ];
    // Loop: Battery POS -> Switch PIN1, Switch PIN2 -> Resistor PIN1, Resistor PIN2 -> LED ANODE, LED CATHODE -> Battery GND
    const connections = [
      { id: "w1", sourceComponentId: "battery-1", sourcePin: "POS", targetComponentId: "sw-1", targetPin: "PIN1" },
      { id: "w2", sourceComponentId: "sw-1", sourcePin: "PIN2", targetComponentId: "res-1", targetPin: "PIN1" },
      { id: "w3", sourceComponentId: "res-1", sourcePin: "PIN2", targetComponentId: "led-1", targetPin: "ANODE" },
      { id: "w4", sourceComponentId: "led-1", sourcePin: "CATHODE", targetComponentId: "battery-1", targetPin: "GND" },
    ];

    const baseEnv = {
      virtualSensors: {
        soilMoisture: 50,
        temperature: 25,
        humidity: 50,
        distanceCm: 100,
        lightLux: 300,
        potentiometerVal: 512,
        gasPpm: 100,
        isButtonPressed: false,
        isSwitchLatching: false,
        isMotionTriggered: false,
        isAutoFluctuate: false,
      },
      gpioOutputs: {},
      switchStates: {},
      simTick: 1,
    };

    // When button is NOT pressed:
    const offResult = evaluateCircuitState(components, connections, baseEnv);
    assert.strictEqual(offResult.componentStatuses["led-1"].actuatorActive, false, "LED must be OFF when switch is open");

    // When button IS pressed:
    const onEnv = { ...baseEnv, switchStates: { "sw-1": true } };
    const onResult = evaluateCircuitState(components, connections, onEnv);
    assert.strictEqual(onResult.componentStatuses["led-1"].actuatorActive, true, "LED must illuminate when switch is closed");
    assert.strictEqual(onResult.componentStatuses["led-1"].isBurnedOut, false, "LED must not burn out because resistor is present");
  });

  await test("Circuit Engine: Exports valid KiCad Netlist and BOM", async () => {
    const { exportKiCadNetlist, generateBillOfMaterials } = await import("../lib/circuits/engine");
    const components = [
      { id: "esp-1", type: "esp32", label: "ESP32 DevKit" },
      { id: "dht-1", type: "dht22_sensor", label: "DHT22" },
    ];
    const connections = [
      { id: "c1", sourceComponentId: "esp-1", sourcePin: "3V3", targetComponentId: "dht-1", targetPin: "VCC" },
      { id: "c2", sourceComponentId: "esp-1", sourcePin: "GND", targetComponentId: "dht-1", targetPin: "GND" },
    ];

    const bom = generateBillOfMaterials(components);
    assert.strictEqual(bom.length, 2, "BOM should have 2 components");
    assert.strictEqual(bom[0].refDes.startsWith("U"), true, "ESP32 should have RefDes U1");

    const netlist = exportKiCadNetlist("Test Project", components, connections);
    assert.strictEqual(netlist.includes("(export (version \"E\")"), true, "Should produce KiCad export header");
    assert.strictEqual(netlist.includes("DHT22"), true, "Netlist must contain component DHT22");
  });

  // 14. Multi-Key Manager & Failover Logic
  await test("Key Manager: Detects rate limits and prioritizes feature keys with failover pool", async () => {
    const { getPrioritizedKeysForFeature, isRateLimitOrQuotaError } = await import("../lib/ai/key-manager");

    assert.strictEqual(isRateLimitOrQuotaError(new Error("429 Too Many Requests")), true, "Should identify 429");
    assert.strictEqual(isRateLimitOrQuotaError(new Error("Quota exceeded: RESOURCE_EXHAUSTED")), true, "Should identify quota");
    assert.strictEqual(isRateLimitOrQuotaError(new Error("503 Service Unavailable")), true, "Should identify 503 high load");
    assert.strictEqual(isRateLimitOrQuotaError(new Error("Syntax error in input JSON")), false, "Should not identify syntax error as rate limit");

    const doctorKeys = getPrioritizedKeysForFeature("doctor");
    const builderKeys = getPrioritizedKeysForFeature("builder");
    const chatKeys = getPrioritizedKeysForFeature("chat");

    assert.strictEqual(doctorKeys.length >= 1, true, "Doctor feature has valid key pool");
    assert.strictEqual(builderKeys.length >= 1, true, "Builder feature has valid key pool");
    assert.strictEqual(chatKeys.length >= 1, true, "Chat feature has valid key pool");
  });

  console.log("\n=================================================");
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
