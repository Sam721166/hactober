import { COMPONENT_DEFINITIONS, ComponentDefinition } from "./registry";
import { HardwarePin } from "@/components/circuits/HardwareNode";

export interface CircuitComponent {
  id: string;
  type: string;
  label?: string;
  x?: number;
  y?: number;
  properties?: Record<string, any>;
}

export interface CircuitConnection {
  id: string;
  sourceComponentId: string;
  sourcePin: string;
  targetComponentId: string;
  targetPin: string;
  status?: string;
  evidence?: string;
}

export interface ElectricalNet {
  id: string;
  name: string;
  pins: { componentId: string; pinId: string; pinType: string }[];
  voltage: number; // in Volts (e.g. 5.0, 3.3, 9.0, 0.0)
  isGround: boolean;
  isPower: boolean;
  powerSource?: string;
  isShortCircuit: boolean;
  isDriven: boolean;
}

export interface ComponentSimulationStatus {
  isPowered: boolean;
  powerVoltage: number;
  isGndConnected: boolean;
  isShortCircuited: boolean;
  isBurnedOut: boolean;
  burnedReason?: string;
  operatingState: string;
  actuatorActive: boolean;
  telemetryValue?: any;
  customBadge?: string;
  pinVoltages: Record<string, number>;
  pinLogic: Record<string, "HIGH" | "LOW" | "POWER" | "GND" | "FLOAT">;
}

export interface DesignRuleIssue {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  componentId?: string;
  pinId?: string;
  fixRecommendation?: string;
}

export interface MultimeterReading {
  targetId: string;
  targetType: "pin" | "wire" | "component";
  label: string;
  voltage: number;
  voltageDisplay: string;
  currentMa: number;
  logicState: "HIGH" | "LOW" | "POWER" | "GND" | "FLOAT";
  netName: string;
  isLive: boolean;
  details: string;
}

export interface BomItem {
  refDes: string;
  name: string;
  type: string;
  category: string;
  quantity: number;
  specs: string;
  footprint: string;
  estimatedCost: string;
}

export interface SimulationEnvironment {
  virtualSensors: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    distanceCm: number;
    lightLux: number;
    potentiometerVal: number;
    gasPpm: number;
    isButtonPressed: boolean;
    isSwitchLatching: boolean;
    isMotionTriggered: boolean;
    isAutoFluctuate: boolean;
  };
  gpioOutputs: Record<string, boolean>; // e.g. "esp32-1:GPIO4": true
  switchStates: Record<string, boolean>; // e.g. "push_button-1": true
  simTick: number;
}

/**
 * Normalizes pin connections so any wire source-target is bidirectionally accessible
 */
export function buildAdjacencyList(connections: CircuitConnection[]) {
  const adj = new Map<string, { compId: string; pinId: string }[]>();

  const makeKey = (c: string, p: string) => `${c}:${p}`;

  for (const conn of connections) {
    if (!conn.sourceComponentId || !conn.sourcePin || !conn.targetComponentId || !conn.targetPin) {
      continue;
    }
    const k1 = makeKey(conn.sourceComponentId, conn.sourcePin);
    const k2 = makeKey(conn.targetComponentId, conn.targetPin);

    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);

    adj.get(k1)!.push({ compId: conn.targetComponentId, pinId: conn.targetPin });
    adj.get(k2)!.push({ compId: conn.sourceComponentId, pinId: conn.sourcePin });
  }

  return adj;
}

/**
 * Extracts discrete electrical nets across all interconnected pins.
 * Takes into account dynamic closed switches / pressed buttons bridging PIN1 & PIN2.
 */
export function extractElectricalNets(
  components: CircuitComponent[],
  connections: CircuitConnection[],
  switchStates: Record<string, boolean> = {},
  gpioOutputs: Record<string, boolean> = {}
): { nets: ElectricalNet[]; pinToNet: Map<string, ElectricalNet> } {
  const adj = buildAdjacencyList(connections);

  // Dynamic internal bridging for switches, relays, and resistors
  for (const comp of components) {
    if (comp.type === "push_button") {
      const isPressed = Boolean(switchStates[comp.id] ?? comp.properties?.isPressed);
      if (isPressed) {
        const p1 = `${comp.id}:PIN1`;
        const p2 = `${comp.id}:PIN2`;
        if (!adj.has(p1)) adj.set(p1, []);
        if (!adj.has(p2)) adj.set(p2, []);
        adj.get(p1)!.push({ compId: comp.id, pinId: "PIN2" });
        adj.get(p2)!.push({ compId: comp.id, pinId: "PIN1" });
      }
    } else if (comp.type === "relay_module") {
      // If relay is active, COM and NO are internally closed
      const isRelayOn = Boolean(comp.properties?.relayActive);
      if (isRelayOn) {
        const com = `${comp.id}:COM`;
        const no = `${comp.id}:NO`;
        if (!adj.has(com)) adj.set(com, []);
        if (!adj.has(no)) adj.set(no, []);
        adj.get(com)!.push({ compId: comp.id, pinId: "NO" });
        adj.get(no)!.push({ compId: comp.id, pinId: "COM" });
      }
    } else if (comp.type === "resistor") {
      // Resistors conduct DC current between PIN1 and PIN2
      const p1 = `${comp.id}:PIN1`;
      const p2 = `${comp.id}:PIN2`;
      if (!adj.has(p1)) adj.set(p1, []);
      if (!adj.has(p2)) adj.set(p2, []);
      adj.get(p1)!.push({ compId: comp.id, pinId: "PIN2" });
      adj.get(p2)!.push({ compId: comp.id, pinId: "PIN1" });
    }
  }

  const visited = new Set<string>();
  const nets: ElectricalNet[] = [];
  const pinToNet = new Map<string, ElectricalNet>();

  // Map of all component definitions
  const compMap = new Map<string, CircuitComponent>();
  components.forEach((c) => compMap.set(c.id, c));

  let netIndex = 1;

  for (const comp of components) {
    const def = COMPONENT_DEFINITIONS[comp.type];
    if (!def) continue;

    for (const pin of def.pins) {
      const pinKey = `${comp.id}:${pin.id}`;
      if (visited.has(pinKey)) continue;

      // Start BFS for this electrical net
      const queue: { compId: string; pinId: string }[] = [{ compId: comp.id, pinId: pin.id }];
      visited.add(pinKey);

      const netPins: { componentId: string; pinId: string; pinType: string }[] = [];
      let maxPowerVoltage = 0;
      let hasGround = false;
      let powerSourceDesc = "";
      let isDriven = false;

      while (queue.length > 0) {
        const current = queue.shift()!;
        const cKey = `${current.compId}:${current.pinId}`;
        const cComp = compMap.get(current.compId);
        const cDef = cComp ? COMPONENT_DEFINITIONS[cComp.type] : undefined;
        const cPin = cDef?.pins.find((p) => p.id === current.pinId);
        const pType = cPin?.type || "digital";

        netPins.push({
          componentId: current.compId,
          pinId: current.pinId,
          pinType: pType,
        });

        // Check if this pin is an intrinsic power provider
        if (cComp) {
          const pinUpper = current.pinId.toUpperCase();
          if (
            pType === "gnd" ||
            pinUpper === "GND" ||
            pinUpper === "CATHODE" ||
            pinUpper === "NEG"
          ) {
            hasGround = true;
          } else if (pType === "power" || pinUpper === "POS" || pinUpper === "ANODE") {
            let v = 0;
            if (cComp.type === "battery_9v" && pinUpper === "POS") {
              v = 9.0;
              powerSourceDesc = "9V Battery";
            } else if (cComp.type === "esp32") {
              if (pinUpper === "3V3") {
                v = 3.3;
                powerSourceDesc = "ESP32 3.3V Rail";
              } else if (pinUpper === "VIN") {
                v = 5.0;
                powerSourceDesc = "ESP32 5V (VIN)";
              }
            } else if (cComp.type === "arduino_uno" || cComp.type === "arduino_nano") {
              if (pinUpper === "5V") {
                v = 5.0;
                powerSourceDesc = "Arduino 5V Rail";
              } else if (pinUpper === "3V3") {
                v = 3.3;
                powerSourceDesc = "Arduino 3.3V Rail";
              }
            } else if (cComp.type === "pico") {
              if (pinUpper === "3V3") {
                v = 3.3;
                powerSourceDesc = "Pico 3.3V Rail";
              }
            }
            if (v > maxPowerVoltage) {
              maxPowerVoltage = v;
            }
          }

          // Check if this pin is an active driven GPIO output
          if (gpioOutputs[cKey]) {
            isDriven = true;
            const mcuV = cComp.type === "esp32" || cComp.type === "pico" ? 3.3 : 5.0;
            if (mcuV > maxPowerVoltage) {
              maxPowerVoltage = mcuV;
              powerSourceDesc = `${cComp.label || cComp.id} Pin ${current.pinId} HIGH`;
            }
          }
        }

        // Traverse connected neighbors
        const neighbors = adj.get(cKey) || [];
        for (const n of neighbors) {
          const nKey = `${n.compId}:${n.pinId}`;
          if (!visited.has(nKey)) {
            visited.add(nKey);
            queue.push(n);
          }
        }
      }

      // Detect true zero-ohm short circuit: direct copper path between power rail and ground
      // Build a zero-impedance BFS from power pin to see if ground is reachable without resistors
      let isDeadShort = false;
      if (maxPowerVoltage > 0 && hasGround) {
        // Test connectivity using only direct non-resistor connections
        const directVisited = new Set<string>();
        const directQueue: string[] = [];
        // Seed with all power pins in this net
        netPins.forEach((p) => {
          const comp = compMap.get(p.componentId);
          if (comp && (p.pinType === "power" || p.pinId === "POS" || p.pinId === "3V3" || p.pinId === "5V" || p.pinId === "VIN")) {
            directQueue.push(`${p.componentId}:${p.pinId}`);
            directVisited.add(`${p.componentId}:${p.pinId}`);
          }
        });

        while (directQueue.length > 0) {
          const curr = directQueue.shift()!;
          const [cId, pId] = curr.split(":");
          const comp = compMap.get(cId);
          const pDef = comp ? COMPONENT_DEFINITIONS[comp.type]?.pins.find((p) => p.id === pId) : undefined;
          if (pDef?.type === "gnd" || pId === "GND" || pId === "NEG") {
            isDeadShort = true;
            break;
          }

          // Expand only via direct wire or closed switch, NOT through resistor
          const neighbors = adj.get(curr) || [];
          for (const n of neighbors) {
            const nComp = compMap.get(n.compId);
            if (nComp?.type === "resistor") continue; // Block through resistor
            const nKey = `${n.compId}:${n.pinId}`;
            if (!directVisited.has(nKey)) {
              directVisited.add(nKey);
              directQueue.push(nKey);
            }
          }
        }
      }

      const isShort = isDeadShort;

      let netVoltage = 0;
      if (isShort) {
        // Under direct short circuit, power rail collapses towards ground
        netVoltage = 0.05;
      } else if (maxPowerVoltage > 0) {
        netVoltage = maxPowerVoltage;
      } else if (hasGround) {
        netVoltage = 0.0;
      } else {
        netVoltage = 0.0; // Floating / undriven
      }

      let netName = `NET_${netIndex++}`;
      if (isShort) {
        netName = `SHORT_CIRCUIT_FAULT`;
      } else if (hasGround) {
        netName = `GND_0V`;
      } else if (maxPowerVoltage >= 8.5) {
        netName = `VCC_9V`;
      } else if (maxPowerVoltage >= 4.5) {
        netName = `VCC_5V`;
      } else if (maxPowerVoltage >= 3.0) {
        netName = `VCC_3V3`;
      } else if (isDriven) {
        netName = `SIG_HIGH`;
      }

      const net: ElectricalNet = {
        id: `net-${netIndex}`,
        name: netName,
        pins: netPins,
        voltage: netVoltage,
        isGround: hasGround && !isShort,
        isPower: maxPowerVoltage > 0 && !isShort,
        powerSource: powerSourceDesc || undefined,
        isShortCircuit: isShort,
        isDriven,
      };

      nets.push(net);
      netPins.forEach((p) => {
        pinToNet.set(`${p.componentId}:${p.pinId}`, net);
      });
    }
  }

  return { nets, pinToNet };
}

/**
 * Checks if there is a series resistor between a given component and power/ground
 */
export function hasSeriesResistorInPath(
  componentId: string,
  components: CircuitComponent[],
  connections: CircuitConnection[],
  pinToNet: Map<string, ElectricalNet>
): boolean {
  // Check if any resistor has one pin connected to component's net and other pin to another net
  const compNets = new Set<string>();
  const def = COMPONENT_DEFINITIONS[components.find((c) => c.id === componentId)?.type || ""];
  if (!def) return false;

  for (const pin of def.pins) {
    const net = pinToNet.get(`${componentId}:${pin.id}`);
    if (net) compNets.add(net.name);
  }

  const resistors = components.filter((c) => c.type === "resistor");
  for (const res of resistors) {
    const rNet1 = pinToNet.get(`${res.id}:PIN1`);
    const rNet2 = pinToNet.get(`${res.id}:PIN2`);
    if (
      (rNet1 && compNets.has(rNet1.name)) ||
      (rNet2 && compNets.has(rNet2.name))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Executes a full physics & logic simulation cycle for all components in the circuit.
 */
export function evaluateCircuitState(
  components: CircuitComponent[],
  connections: CircuitConnection[],
  env: SimulationEnvironment
): {
  componentStatuses: Record<string, ComponentSimulationStatus>;
  designRules: DesignRuleIssue[];
  nets: ElectricalNet[];
  pinToNet: Map<string, ElectricalNet>;
} {
  const { nets, pinToNet } = extractElectricalNets(
    components,
    connections,
    env.switchStates,
    env.gpioOutputs
  );

  const componentStatuses: Record<string, ComponentSimulationStatus> = {};
  const designRules: DesignRuleIssue[] = [];

  // 1. Check for Short Circuits across all nets
  const shortedNets = nets.filter((n) => n.isShortCircuit);
  if (shortedNets.length > 0) {
    designRules.push({
      id: "drc-short-circuit",
      severity: "critical",
      title: "Dangerous Power-to-Ground Short Circuit",
      message:
        "Direct connection detected between a live voltage rail (+3.3V, +5V, or +9V) and GND with zero impedance. In real hardware, this would trip circuit protection or damage components.",
      fixRecommendation: "Remove the wire bridging VCC directly to GND.",
    });
  }

  // 2. Evaluate each component's individual operational state
  for (const comp of components) {
    const def = COMPONENT_DEFINITIONS[comp.type];
    if (!def) continue;

    const pinVoltages: Record<string, number> = {};
    const pinLogic: Record<string, "HIGH" | "LOW" | "POWER" | "GND" | "FLOAT"> = {};

    let vccVoltage = 0;
    let isVccConnected = false;
    let isGndConnected = false;

    def.pins.forEach((p) => {
      const net = pinToNet.get(`${comp.id}:${p.id}`);
      if (net) {
        pinVoltages[p.id] = net.voltage;
        if (net.isShortCircuit) {
          pinLogic[p.id] = "FLOAT";
        } else if (net.isGround) {
          pinLogic[p.id] = "GND";
        } else if (net.voltage >= 2.4) {
          pinLogic[p.id] = net.isPower ? "POWER" : "HIGH";
        } else if (net.voltage <= 0.4) {
          pinLogic[p.id] = "LOW";
        } else {
          pinLogic[p.id] = "FLOAT";
        }

        if (p.type === "power" || p.id === "VCC" || p.id === "5V" || p.id === "3V3" || p.id === "VIN" || p.id === "12V") {
          isVccConnected = true;
          if (net.voltage > vccVoltage) vccVoltage = net.voltage;
        }
        if (p.type === "gnd" || p.id === "GND") {
          if (net.isGround) isGndConnected = true;
        }
      } else {
        pinVoltages[p.id] = 0;
        pinLogic[p.id] = "FLOAT";
      }
    });

    const isShortCircuited = def.pins.some((p) => {
      const net = pinToNet.get(`${comp.id}:${p.id}`);
      return net?.isShortCircuit;
    });

    // Special logic per component type
    let isPowered = isVccConnected && isGndConnected && vccVoltage >= 2.5 && !isShortCircuited;
    let isBurnedOut = false;
    let burnedReason: string | undefined;
    let operatingState = "idle";
    let actuatorActive = false;
    let telemetryValue: any = null;
    let customBadge: string | undefined;

    switch (comp.type) {
      case "led": {
        // Anode & Cathode evaluation
        const aNet = pinToNet.get(`${comp.id}:ANODE`);
        const kNet = pinToNet.get(`${comp.id}:CATHODE`);
        const vAnode = aNet?.voltage || 0;
        const vCathode = kNet?.voltage || 0;
        const deltaV = vAnode - vCathode;
        const isGroundPath = Boolean(kNet?.isGround);

        const hasSeriesRes = hasSeriesResistorInPath(comp.id, components, connections, pinToNet);

        if (deltaV >= 1.8 && isGroundPath && !isShortCircuited) {
          if (!hasSeriesRes && vAnode >= 3.5) {
            // Overcurrent: Burned out LED!
            isBurnedOut = true;
            burnedReason = `Overcurrent (>60mA)! LED connected directly across ${vAnode.toFixed(1)}V without series resistor.`;
            operatingState = "burned_out";
            customBadge = "💥 Burned Out (Overcurrent)";
            designRules.push({
              id: `drc-led-overcurrent-${comp.id}`,
              severity: "critical",
              title: `LED Overcurrent: "${comp.label || "LED"}" Burned Out`,
              message: `LED anode is connected directly to ${vAnode.toFixed(1)}V with cathode to GND, missing a current-limiting resistor. Forward current exceeds safe 20mA limit!`,
              componentId: comp.id,
              fixRecommendation: "Insert a 220Ω to 1kΩ resistor in series with the LED anode.",
            });
          } else {
            // Safe illumination
            actuatorActive = true;
            operatingState = "illuminated";
            const estCurrent = hasSeriesRes ? ((vAnode - 2.0) / 220) * 1000 : 15;
            customBadge = `✨ Illuminated (${estCurrent.toFixed(0)}mA)`;
          }
        } else if (vCathode > vAnode && vCathode >= 2.0 && aNet?.isGround) {
          // Reverse polarity
          operatingState = "reverse_biased";
          customBadge = "⚠️ Reverse Biased (No Light)";
          designRules.push({
            id: `drc-led-reverse-${comp.id}`,
            severity: "warning",
            title: `LED Reverse Polarity: "${comp.label || "LED"}"`,
            message: "LED anode is grounded while cathode is connected to high potential. The diode blocks reverse current and will not turn on.",
            componentId: comp.id,
            fixRecommendation: "Flip LED connections: Anode (+) to signal/power, Cathode (-) to GND.",
          });
        } else {
          operatingState = "off";
        }
        break;
      }

      case "push_button": {
        const isPressed = Boolean(env.switchStates[comp.id] ?? comp.properties?.isPressed);
        actuatorActive = isPressed;
        operatingState = isPressed ? "contact_closed" : "contact_open";
        customBadge = isPressed ? "🔘 Contact Closed (Conducting)" : "⚪ Open Circuit";
        break;
      }

      case "resistor": {
        const p1Net = pinToNet.get(`${comp.id}:PIN1`);
        const p2Net = pinToNet.get(`${comp.id}:PIN2`);
        const v1 = p1Net?.voltage || 0;
        const v2 = p2Net?.voltage || 0;
        const vDrop = Math.abs(v1 - v2);
        const rVal = comp.properties?.resistance || 220;
        const currentMa = (vDrop / rVal) * 1000;

        operatingState = vDrop > 0.1 ? "conducting" : "idle";
        customBadge = `${rVal}Ω (${currentMa.toFixed(1)}mA)`;
        break;
      }

      case "potentiometer": {
        const wiperPct = comp.properties?.wiperPct ?? Math.round((env.virtualSensors.potentiometerVal / 1023) * 100);
        const vNet = pinToNet.get(`${comp.id}:VCC`);
        const gNet = pinToNet.get(`${comp.id}:GND`);
        const isPotPowered = Boolean(vNet?.isPower && gNet?.isGround);

        if (isPotPowered) {
          const vIn = vNet?.voltage || 5.0;
          const wiperV = vIn * (wiperPct / 100);
          pinVoltages["SIG"] = wiperV;
          telemetryValue = { wiperPct, wiperVoltage: wiperV };
          customBadge = `🎛️ Wiper: ${wiperPct}% (${wiperV.toFixed(2)}V)`;
          operatingState = "active";
        } else {
          customBadge = "🎛️ Wiper (Unpowered)";
          operatingState = "unpowered";
        }
        break;
      }

      case "buzzer": {
        const posNet = pinToNet.get(`${comp.id}:POS`);
        const gndNet = pinToNet.get(`${comp.id}:GND`);
        const isSounding = Boolean(
          posNet &&
            (posNet.voltage >= 2.5 || posNet.isDriven) &&
            gndNet?.isGround &&
            !isShortCircuited
        );
        actuatorActive = isSounding;
        operatingState = isSounding ? "beeping" : "silent";
        customBadge = isSounding ? "🔔 Beeping (2.7kHz Active)" : "🔕 Muted";
        break;
      }

      case "relay_module": {
        // Needs VCC & GND to power coil, plus IN driven HIGH to switch
        const inNet = pinToNet.get(`${comp.id}:IN`);
        const coilActive = isPowered && inNet && (inNet.voltage >= 2.4 || inNet.isDriven);
        actuatorActive = Boolean(coilActive);
        operatingState = coilActive ? "energized" : isPowered ? "idle" : "unpowered";
        customBadge = coilActive ? "🔌 COM-NO Closed (Energized)" : isPowered ? "⚪ COM-NC (De-energized)" : "⚪ Unpowered Relay";
        break;
      }

      case "servo_motor": {
        const sigNet = pinToNet.get(`${comp.id}:SIG`);
        const hasPwmSignal = Boolean(sigNet && (sigNet.isDriven || sigNet.voltage >= 2.0));
        const servoAngle = hasPwmSignal ? Math.round((env.virtualSensors.potentiometerVal / 1023) * 180) : 0;
        actuatorActive = isPowered && hasPwmSignal;
        operatingState = actuatorActive ? "tracking" : isPowered ? "holding" : "unpowered";
        customBadge = actuatorActive ? `🔄 ${servoAngle}° Servo Position` : isPowered ? "⚪ 0° Standby" : "⚪ Unpowered Servo";
        break;
      }

      case "oled_display":
      case "lcd1602": {
        const sclNet = pinToNet.get(`${comp.id}:SCL`);
        const sdaNet = pinToNet.get(`${comp.id}:SDA`);
        const isI2cWired = Boolean(sclNet && sdaNet);

        if (isPowered && isI2cWired) {
          operatingState = "displaying";
          telemetryValue = `Live I2C Display (${env.virtualSensors.soilMoisture}% / ${env.virtualSensors.temperature}°C)`;
          customBadge = "📺 I2C Display Active (0x3C)";
        } else if (isPowered && !isI2cWired) {
          operatingState = "i2c_bus_idle";
          customBadge = "📺 Power ON (I2C Disconnected)";
          designRules.push({
            id: `drc-display-i2c-${comp.id}`,
            severity: "warning",
            title: `Display I2C Lines Unconnected: "${comp.label || "OLED"}"`,
            message: "Display has power but SDA/SCL pins are not connected to a microcontroller I2C bus.",
            componentId: comp.id,
            fixRecommendation: "Connect SDA to ESP32 GPIO21 / Uno A4, and SCL to ESP32 GPIO22 / Uno A5.",
          });
        } else {
          operatingState = "off";
          customBadge = "📺 Display Off (No Power)";
        }
        break;
      }

      case "dht22_sensor": {
        const dataNet = pinToNet.get(`${comp.id}:DATA`);
        const isDataConnected = Boolean(dataNet && dataNet.pins.length > 1);

        if (isPowered && isDataConnected) {
          operatingState = "transmitting";
          telemetryValue = { temp: env.virtualSensors.temperature, hum: env.virtualSensors.humidity };
          customBadge = `🌡️ ${env.virtualSensors.temperature}°C / 💧 ${env.virtualSensors.humidity}%`;
        } else if (isPowered && !isDataConnected) {
          operatingState = "floating_data";
          customBadge = "🌡️ DHT22 (DATA Pin Floating)";
          designRules.push({
            id: `drc-dht-floating-${comp.id}`,
            severity: "warning",
            title: `Sensor Signal Pin Floating: "${comp.label || "DHT22"}"`,
            message: "DHT22 is powered but its DATA pin is not connected to a microcontroller GPIO pin.",
            componentId: comp.id,
            fixRecommendation: "Wire DATA pin to a digital GPIO pin on the microcontroller.",
          });
        } else {
          operatingState = "unpowered";
          customBadge = "🌡️ DHT22 (Unpowered)";
        }
        break;
      }

      case "ultrasonic_sensor": {
        const trigNet = pinToNet.get(`${comp.id}:TRIG`);
        const echoNet = pinToNet.get(`${comp.id}:ECHO`);
        const isWired = Boolean(trigNet && echoNet);

        if (isPowered && isWired) {
          operatingState = "ranging";
          telemetryValue = env.virtualSensors.distanceCm;
          customBadge = `🦇 Sonar: ${env.virtualSensors.distanceCm}cm`;
        } else if (isPowered) {
          operatingState = "idle";
          customBadge = "🦇 HC-SR04 (Pins Unwired)";
        } else {
          operatingState = "unpowered";
          customBadge = "🦇 HC-SR04 (Unpowered)";
        }
        break;
      }

      case "soil_moisture_sensor": {
        const aoutNet = pinToNet.get(`${comp.id}:AOUT`);
        const isAoutConnected = Boolean(aoutNet && aoutNet.pins.length > 1);

        if (isPowered && isAoutConnected) {
          operatingState = "sensing";
          telemetryValue = env.virtualSensors.soilMoisture;
          customBadge = `🌱 Moisture: ${env.virtualSensors.soilMoisture}%`;
        } else if (isPowered) {
          operatingState = "unwired";
          customBadge = "🌱 Soil (AOUT Unconnected)";
        } else {
          operatingState = "unpowered";
          customBadge = "🌱 Soil (Unpowered)";
        }
        break;
      }

      case "mq2_gas_sensor": {
        const aoutNet = pinToNet.get(`${comp.id}:AOUT`);
        const doutNet = pinToNet.get(`${comp.id}:DOUT`);
        const isWired = Boolean((aoutNet && aoutNet.pins.length > 1) || (doutNet && doutNet.pins.length > 1));

        if (isPowered && isWired) {
          operatingState = "monitoring";
          telemetryValue = env.virtualSensors.gasPpm;
          customBadge = `💨 Gas: ${env.virtualSensors.gasPpm} PPM`;
        } else if (isPowered) {
          customBadge = "💨 MQ-2 (Output Floating)";
        } else {
          customBadge = "💨 MQ-2 (Unpowered)";
        }
        break;
      }

      case "pir_sensor": {
        const outNet = pinToNet.get(`${comp.id}:OUT`);
        const isWired = Boolean(outNet && outNet.pins.length > 1);
        if (isPowered && isWired) {
          const isTriggered = env.virtualSensors.isMotionTriggered;
          operatingState = isTriggered ? "motion_detected" : "scanning";
          customBadge = isTriggered ? "🏃 Motion Detected (Signal HIGH)" : "🟢 Area Clear";
        } else if (isPowered) {
          customBadge = "🟢 PIR (OUT Unwired)";
        } else {
          customBadge = "🟢 PIR (Unpowered)";
        }
        break;
      }

      case "mpu6050": {
        const sclNet = pinToNet.get(`${comp.id}:SCL`);
        const sdaNet = pinToNet.get(`${comp.id}:SDA`);
        if (isPowered && sclNet && sdaNet) {
          operatingState = "streaming_imu";
          customBadge = "📐 IMU 6-Axis Live (0x68)";
        } else if (isPowered) {
          customBadge = "📐 IMU (I2C Unconnected)";
        } else {
          customBadge = "📐 IMU (Unpowered)";
        }
        break;
      }

      case "dc_motor": {
        const posNet = pinToNet.get(`${comp.id}:POS`);
        const negNet = pinToNet.get(`${comp.id}:NEG`);
        const vPos = posNet?.voltage || 0;
        const vNeg = negNet?.voltage || 0;
        const vMotor = Math.abs(vPos - vNeg);
        const isMotorRunning = vMotor >= 2.5 && !isShortCircuited;

        actuatorActive = isMotorRunning;
        operatingState = isMotorRunning ? "spinning" : "stopped";
        customBadge = isMotorRunning ? `⚡ Spinning (${vMotor.toFixed(1)}V)` : "⚪ Motor Stopped";
        break;
      }

      case "battery_9v": {
        isPowered = true;
        operatingState = isShortCircuited ? "overloaded_short" : "supplying_nominal";
        customBadge = isShortCircuited ? "⚠️ Short Circuit Overload!" : "🔋 9V Nominal (Active)";
        break;
      }

      case "esp32":
      case "arduino_uno":
      case "arduino_nano":
      case "pico": {
        isPowered = true; // Powered via USB or VIN
        operatingState = isShortCircuited ? "ptc_fuse_tripped" : "executing_firmware";
        customBadge = isShortCircuited
          ? "💥 PTC Fuse Tripped (Short)"
          : `⚡ MCU Clock Live (${comp.type === "esp32" ? "240MHz" : "16MHz"})`;
        break;
      }

      default: {
        operatingState = isPowered ? "active" : "standby";
        break;
      }
    }

    // Check general active sensor/module missing power or ground
    if (def.category === "sensors" || def.category === "displays") {
      if (!isVccConnected && !isGndConnected) {
        designRules.push({
          id: `drc-unpowered-${comp.id}`,
          severity: "warning",
          title: `Unpowered Module: "${comp.label || def.name}"`,
          message: `Sensor/display is placed on canvas but has no connections to power (VCC) or ground (GND).`,
          componentId: comp.id,
          fixRecommendation: "Connect VCC pin to 3.3V/5V and GND pin to Ground.",
        });
      } else if (!isVccConnected) {
        designRules.push({
          id: `drc-missing-vcc-${comp.id}`,
          severity: "warning",
          title: `Missing Power: "${comp.label || def.name}"`,
          message: `Component has ground connected but VCC pin is floating.`,
          componentId: comp.id,
          fixRecommendation: "Connect VCC pin to 3.3V or 5V rail.",
        });
      } else if (!isGndConnected) {
        designRules.push({
          id: `drc-missing-gnd-${comp.id}`,
          severity: "warning",
          title: `Missing Ground: "${comp.label || def.name}"`,
          message: `Component has power connected but GND pin is floating, preventing closed return current loop.`,
          componentId: comp.id,
          fixRecommendation: "Connect GND pin to ground rail.",
        });
      }
    }

    // Check voltage compatibility (e.g. 5V or 9V applied to 3.3V MCU GPIO)
    if (comp.type === "esp32" || comp.type === "pico") {
      def.pins.forEach((p) => {
        if (p.type === "digital" || p.type === "analog") {
          const v = pinVoltages[p.id];
          if (v > 3.6) {
            designRules.push({
              id: `drc-overvoltage-gpio-${comp.id}-${p.id}`,
              severity: "critical",
              title: `Overvoltage on 3.3V GPIO: Pin ${p.name}`,
              message: `Pin ${p.name} on ${def.name} is exposed to ${v.toFixed(1)}V! ESP32 and RP2040 GPIOs are NOT 5V-tolerant; this will permanently destroy the silicon pin buffer.`,
              componentId: comp.id,
              pinId: p.id,
              fixRecommendation: "Use a logic level shifter or resistor voltage divider (e.g. 1kΩ / 2kΩ) to step down signal to 3.3V.",
            });
          }
        }
      });
    }

    componentStatuses[comp.id] = {
      isPowered,
      powerVoltage: vccVoltage,
      isGndConnected,
      isShortCircuited,
      isBurnedOut,
      burnedReason,
      operatingState,
      actuatorActive,
      telemetryValue,
      customBadge,
      pinVoltages,
      pinLogic,
    };
  }

  return {
    componentStatuses,
    designRules,
    nets,
    pinToNet,
  };
}

/**
 * Probes a specific component pin with virtual digital multimeter (DMM)
 */
export function probePinMultimeter(
  componentId: string,
  pinId: string,
  components: CircuitComponent[],
  pinToNet: Map<string, ElectricalNet>,
  statuses: Record<string, ComponentSimulationStatus>
): MultimeterReading {
  const comp = components.find((c) => c.id === componentId);
  const def = comp ? COMPONENT_DEFINITIONS[comp.type] : undefined;
  const pin = def?.pins.find((p) => p.id === pinId);
  const net = pinToNet.get(`${componentId}:${pinId}`);
  const status = statuses[componentId];

  const voltage = net ? net.voltage : 0.0;
  const logic = status?.pinLogic?.[pinId] || (net?.isGround ? "GND" : net?.isPower ? "POWER" : "FLOAT");

  let estCurrentMa = 0;
  if (status?.isBurnedOut) {
    estCurrentMa = 120.0;
  } else if (status?.actuatorActive) {
    estCurrentMa = comp?.type === "dc_motor" ? 180.0 : comp?.type === "servo_motor" ? 95.0 : 18.5;
  } else if (status?.isPowered) {
    estCurrentMa = 5.2;
  }

  return {
    targetId: `${componentId}:${pinId}`,
    targetType: "pin",
    label: `${comp?.label || componentId} • Pin ${pin?.name || pinId}`,
    voltage,
    voltageDisplay: `${voltage.toFixed(2)} V`,
    currentMa: estCurrentMa,
    logicState: logic,
    netName: net?.name || "Unconnected",
    isLive: voltage > 0.1 || logic === "GND",
    details: `Net: ${net?.name || "Floating"} | Type: ${pin?.type || "unknown"} | ${net?.powerSource ? "Source: " + net.powerSource : ""}`,
  };
}

/**
 * Generates an engineering Bill of Materials (BOM)
 */
export function generateBillOfMaterials(components: CircuitComponent[]): BomItem[] {
  const items: BomItem[] = [];
  const typeCounts: Record<string, number> = {};

  const SPECS_MAP: Record<string, { specs: string; footprint: string; refPrefix: string; cost: string }> = {
    esp32: { specs: "Xtensa Dual-Core 240MHz, 4MB Flash, Wi-Fi/BLE", footprint: "DIP-38 / DevKit Module", refPrefix: "U", cost: "$4.50" },
    arduino_uno: { specs: "ATmega328P 16MHz, 32KB Flash, 5V Logic", footprint: "Arduino Standard Form Factor", refPrefix: "U", cost: "$5.00" },
    arduino_nano: { specs: "ATmega328P 16MHz, Compact Breadboard Form", footprint: "DIP-30 Module", refPrefix: "U", cost: "$3.50" },
    pico: { specs: "RP2040 Dual Cortex-M0+, 133MHz, 2MB Flash", footprint: "Castellated DIP-40", refPrefix: "U", cost: "$4.00" },
    dht22_sensor: { specs: "Temperature (-40 to 80°C) & Humidity (0-100%)", footprint: "4-Pin Single-Row 2.54mm", refPrefix: "SEN", cost: "$3.20" },
    ultrasonic_sensor: { specs: "HC-SR04 Ultrasonic Range 2cm - 400cm", footprint: "4-Pin Header Module", refPrefix: "SEN", cost: "$1.80" },
    soil_moisture_sensor: { specs: "Capacitive Soil Moisture Probe Analog Out", footprint: "3-Pin 2.54mm Header", refPrefix: "SEN", cost: "$1.50" },
    ldr_sensor: { specs: "Photoresistor Light Sensor Module w/ LM393", footprint: "3-Pin Header Module", refPrefix: "SEN", cost: "$1.00" },
    oled_display: { specs: "0.96 inch 128x64 OLED I2C (SSD1306 driver)", footprint: "4-Pin 2.54mm Header (0x3C)", refPrefix: "DISP", cost: "$3.00" },
    lcd1602: { specs: "16x2 Character LCD w/ PCF8574 I2C Backpack", footprint: "4-Pin 2.54mm Header (0x27)", refPrefix: "DISP", cost: "$3.50" },
    servo_motor: { specs: "SG90 Micro Servo 9g, 1.8kg-cm Torque", footprint: "3-Wire 2.54mm JST/Dupont", refPrefix: "M", cost: "$2.50" },
    motor_driver: { specs: "L298N Dual H-Bridge Driver up to 2A/channel", footprint: "Heatsink Module w/ Screw Terminals", refPrefix: "U", cost: "$3.00" },
    relay_module: { specs: "5V Relay SPDT 10A 250VAC / 30VDC w/ Optocoupler", footprint: "Screw Terminals + 3-Pin Header", refPrefix: "K", cost: "$1.50" },
    led: { specs: "5mm Round LED, Vf = 2.0V, If = 20mA max", footprint: "Through-Hole 2.54mm pitch", refPrefix: "D", cost: "$0.10" },
    resistor: { specs: "220Ω - 10kΩ Carbon Film 1/4W 5% tolerance", footprint: "Axial 0207 / 0805 SMD", refPrefix: "R", cost: "$0.05" },
    push_button: { specs: "6x6mm Momentary Tactile Switch SPST", footprint: "4-Pin Tactile SMD/THT", refPrefix: "SW", cost: "$0.15" },
    buzzer: { specs: "5V Active Piezoelectric Buzzer 2.7kHz", footprint: "Round 12mm THT 7.6mm pitch", refPrefix: "BZ", cost: "$0.50" },
    battery_9v: { specs: "9V PP3 Alkaline Battery w/ Snap Connector", footprint: "PP3 Battery Clip Leads", refPrefix: "BT", cost: "$2.00" },
    potentiometer: { specs: "10kΩ Linear Rotary Potentiometer 3-Pin", footprint: "Panel Mount / Breadboard THT", refPrefix: "RV", cost: "$0.80" },
    pir_sensor: { specs: "HC-SR501 Passive Infrared Motion Detector", footprint: "3-Pin Header Module", refPrefix: "SEN", cost: "$2.00" },
    mpu6050: { specs: "6-Axis Gyroscope + Accelerometer I2C Module", footprint: "8-Pin 2.54mm Header", refPrefix: "SEN", cost: "$2.80" },
    mq2_gas_sensor: { specs: "MQ-2 Combustible Gas & Smoke Sensor Module", footprint: "4-Pin Header Module", refPrefix: "SEN", cost: "$2.50" },
    dc_motor: { specs: "3-6V DC Hobby Motor 130-size 10,000 RPM", footprint: "2-Solder Tabs Leads", refPrefix: "M", cost: "$1.50" },
  };

  components.forEach((comp) => {
    const def = COMPONENT_DEFINITIONS[comp.type];
    const cat = def?.category || "general";
    const info = SPECS_MAP[comp.type] || {
      specs: `${def?.name || comp.type} standard module`,
      footprint: "Module Header",
      refPrefix: "U",
      cost: "$1.00",
    };

    typeCounts[info.refPrefix] = (typeCounts[info.refPrefix] || 0) + 1;
    const refDes = `${info.refPrefix}${typeCounts[info.refPrefix]}`;

    items.push({
      refDes,
      name: comp.label || def?.name || comp.type,
      type: comp.type,
      category: cat,
      quantity: 1,
      specs: info.specs,
      footprint: info.footprint,
      estimatedCost: info.cost,
    });
  });

  return items;
}

/**
 * Generates an industry-standard KiCad / SPICE Netlist export
 */
export function exportKiCadNetlist(
  projectName: string,
  components: CircuitComponent[],
  connections: CircuitConnection[]
): string {
  const { nets } = extractElectricalNets(components, connections);
  const dateStr = new Date().toUTCString();

  let out = `(export (version "E")\n`;
  out += `  (design\n`;
  out += `    (source "${projectName}")\n`;
  out += `    (date "${dateStr}")\n`;
  out += `    (tool "CircuitStudio Real-Time Electronics Engine v2.0")\n`;
  out += `  )\n`;
  out += `  (components\n`;

  const bom = generateBillOfMaterials(components);
  bom.forEach((b, idx) => {
    const comp = components[idx];
    out += `    (comp (ref "${b.refDes}")\n`;
    out += `      (value "${b.name}")\n`;
    out += `      (footprint "${b.footprint}")\n`;
    out += `      (fields\n`;
    out += `        (field (name "Description") "${b.specs}")\n`;
    out += `        (field (name "Manufacturer_Type") "${comp.type}")\n`;
    out += `      )\n`;
    out += `    )\n`;
  });
  out += `  )\n`;

  out += `  (nets\n`;
  nets.forEach((net, netIdx) => {
    out += `    (net (code "${netIdx + 1}") (name "${net.name}")\n`;
    net.pins.forEach((p) => {
      const compIdx = components.findIndex((c) => c.id === p.componentId);
      const refDes = compIdx >= 0 ? bom[compIdx]?.refDes || p.componentId : p.componentId;
      out += `      (node (ref "${refDes}") (pin "${p.pinId}"))\n`;
    });
    out += `    )\n`;
  });
  out += `  )\n`;
  out += `)\n`;

  return out;
}
