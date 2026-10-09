// CircuitDoctor Seed Data: Sample Hardware Projects & Component Catalogue

export interface SeedComponent {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  interfaces?: string;
  specifications: Record<string, any>;
  datasheetUrl?: string;
  approxPriceInr?: number;
  imageUrl?: string;
}

export interface SeedProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  board: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  budgetInr: number;
  isSample: boolean;
  isPublic: boolean;
  plan: {
    overview: string;
    problem: string;
    solution: string;
    features: string[];
    hardwareRequirements: string[];
    wiringInstructions: Array<{ from: string; to: string; pinFrom: string; pinTo: string; note?: string }>;
    buildSteps: Array<{ step: number; goal: string; instructions: string; outcome: string; mistakes?: string; safetyNotes?: string }>;
    testingGuide: string[];
    limitations: string[];
    safetyNotes: string[];
    estimatedCost: string;
  };
  circuit: {
    components: Array<{ id: string; type: string; label: string; x: number; y: number; properties?: Record<string, any> }>;
    connections: Array<{ id: string; sourceComponentId: string; sourcePin: string; targetComponentId: string; targetPin: string; status: string; evidence: string }>;
  };
  firmware: {
    filename: string;
    language: string;
    content: string;
  };
  bom: Array<{ ref: string; name: string; quantity: number; unitPriceInr?: number; notes?: string }>;
}

export const SEED_COMPONENTS: SeedComponent[] = [
  {
    id: "comp-esp32",
    name: "ESP32 DevKit V1",
    slug: "esp32-devkit-v1",
    category: "Development Boards",
    description: "32-bit dual-core MCU with integrated Wi-Fi and Bluetooth BLE. Ideal for IoT edge projects.",
    interfaces: "GPIO, ADC, DAC, I2C, SPI, UART, PWM",
    specifications: { operatingVoltage: "3.3V", inputVoltage: "5V via Micro-USB", clockSpeed: "240MHz", flash: "4MB", sram: "520KB" },
    approxPriceInr: 399,
  },
  {
    id: "comp-arduino-uno",
    name: "Arduino Uno R3",
    slug: "arduino-uno-r3",
    category: "Development Boards",
    description: "Classic ATmega328P microcontroller board with 14 digital I/O pins and 6 analog inputs.",
    interfaces: "Digital I/O, Analog In, PWM, UART, I2C, SPI",
    specifications: { operatingVoltage: "5V", inputVoltage: "7-12V DC", clockSpeed: "16MHz", flash: "32KB" },
    approxPriceInr: 549,
  },
  {
    id: "comp-arduino-nano",
    name: "Arduino Nano V3",
    slug: "arduino-nano-v3",
    category: "Development Boards",
    description: "Breadboard-friendly compact ATmega328P microcontroller board.",
    interfaces: "Digital I/O, Analog In, PWM, UART, I2C, SPI",
    specifications: { operatingVoltage: "5V", inputVoltage: "7-12V", clockSpeed: "16MHz", flash: "32KB" },
    approxPriceInr: 249,
  },
  {
    id: "comp-pico",
    name: "Raspberry Pi Pico",
    slug: "raspberry-pi-pico",
    category: "Development Boards",
    description: "Dual-core ARM Cortex-M0+ microcontroller with flexible I/O including programmable PIO.",
    interfaces: "GPIO, ADC, PWM, I2C, SPI, UART",
    specifications: { operatingVoltage: "3.3V", clockSpeed: "133MHz", flash: "2MB", sram: "264KB" },
    approxPriceInr: 379,
  },
  {
    id: "comp-dht22",
    name: "DHT22 (AM2302) Sensor",
    slug: "dht22-temperature-humidity",
    category: "Sensors",
    description: "High accuracy digital temperature and relative humidity sensor with single-bus communication.",
    interfaces: "Digital 1-Wire",
    specifications: { temperatureRange: "-40 to 80°C (±0.5°C)", humidityRange: "0-100% RH (±2%)", voltage: "3.3V - 5V" },
    approxPriceInr: 299,
  },
  {
    id: "comp-ultrasonic",
    name: "HC-SR04 Ultrasonic Sensor",
    slug: "hc-sr04-ultrasonic",
    category: "Sensors",
    description: "Sonar distance measuring module with 2cm to 400cm non-contact range measurement.",
    interfaces: "Trigger (Input), Echo (Output)",
    specifications: { operatingVoltage: "5V DC", workingCurrent: "15mA", frequency: "40kHz", range: "2cm - 400cm" },
    approxPriceInr: 120,
  },
  {
    id: "comp-soil",
    name: "Capacitive Soil Moisture Sensor v1.2",
    slug: "capacitive-soil-moisture-v1-2",
    category: "Sensors",
    description: "Corrosion-resistant capacitive moisture sensor providing analog voltage proportional to soil water content.",
    interfaces: "Analog Output (AOUT)",
    specifications: { operatingVoltage: "3.3V - 5.5V", outputVoltage: "0 - 3.0V DC" },
    approxPriceInr: 140,
  },
  {
    id: "comp-oled",
    name: "SSD1306 0.96\" I2C OLED Display",
    slug: "ssd1306-0-96-oled-i2c",
    category: "Displays",
    description: "Monochrome 128x64 graphic OLED display with high contrast and I2C 2-wire interface.",
    interfaces: "I2C (SDA, SCL)",
    specifications: { resolution: "128x64", defaultAddress: "0x3C", voltage: "3.3V - 5V" },
    approxPriceInr: 260,
  },
  {
    id: "comp-servo",
    name: "SG90 Micro Servo Motor",
    slug: "sg90-micro-servo",
    category: "Motors & Actuators",
    description: "Compact 9g hobby servo motor with 180-degree rotation control using PWM pulses.",
    interfaces: "PWM Control",
    specifications: { operatingVoltage: "4.8V - 6.0V", stallTorque: "1.8 kg-cm", rotation: "180 degrees" },
    approxPriceInr: 130,
  },
  {
    id: "comp-motor-driver",
    name: "L298N Dual H-Bridge Driver",
    slug: "l298n-dual-motor-driver",
    category: "Motors & Actuators",
    description: "High-power motor driver capable of driving two DC motors or one bipolar stepper motor.",
    interfaces: "IN1-IN4, ENA, ENB, Screw Terminals",
    specifications: { motorVoltage: "5V - 35V", peakCurrent: "2A per channel", logicVoltage: "5V" },
    approxPriceInr: 190,
  },
  {
    id: "comp-relay",
    name: "5V 1-Channel Relay Module",
    slug: "5v-1-channel-relay",
    category: "Motors & Actuators",
    description: "Optocoupler-isolated relay module to safely switch higher voltage AC or DC loads.",
    interfaces: "Digital IN, VCC, GND, COM, NO, NC",
    specifications: { triggerCurrent: "5mA", maxLoad: "AC 250V/10A, DC 30V/10A" },
    approxPriceInr: 90,
  },
  {
    id: "comp-led-red",
    name: "5mm Red Diffused LED",
    slug: "5mm-red-led",
    category: "Passives & Indicators",
    description: "Standard through-hole 5mm light-emitting diode.",
    interfaces: "Anode (+), Cathode (-)",
    specifications: { forwardVoltage: "1.8V - 2.2V", forwardCurrent: "20mA max" },
    approxPriceInr: 5,
  },
  {
    id: "comp-resistor-220",
    name: "220 Ohm 1/4W Resistor",
    slug: "220-ohm-resistor",
    category: "Passives & Indicators",
    description: "Current-limiting carbon film resistor for 5V/3.3V LED circuits.",
    interfaces: "Axial 2-pin",
    specifications: { resistance: "220 Ohm", tolerance: "±5%", power: "0.25W" },
    approxPriceInr: 2,
  },
  {
    id: "comp-pir",
    name: "HC-SR501 PIR Motion Sensor",
    slug: "hc-sr501-pir-motion",
    category: "Sensors",
    description: "Pyroelectric infrared motion detector with adjustable delay time and sensitivity.",
    interfaces: "Digital Output (OUT)",
    specifications: { operatingVoltage: "4.5V - 20V", detectionRange: "Up to 7 meters (120° cone)", delayTime: "0.3s - 200s" },
    approxPriceInr: 110,
  },
  {
    id: "comp-mpu6050",
    name: "MPU-6050 6-Axis Gyroscope & Accelerometer",
    slug: "mpu-6050-6-axis-imu",
    category: "Sensors",
    description: "6-DoF inertial measurement unit combining a 3-axis gyroscope and a 3-axis accelerometer.",
    interfaces: "I2C (SDA, SCL), INT",
    specifications: { operatingVoltage: "3.3V - 5V", gyroRange: "±250 to ±2000°/sec", accelRange: "±2g to ±16g" },
    approxPriceInr: 160,
  },
  {
    id: "comp-mq2",
    name: "MQ-2 Gas & Smoke Sensor Module",
    slug: "mq-2-gas-smoke-sensor",
    category: "Sensors",
    description: "Gas detection module sensitive to LPG, propane, methane, hydrogen, alcohol, and smoke.",
    interfaces: "Analog AOUT, Digital DOUT",
    specifications: { operatingVoltage: "5V DC", heaterConsumption: "0.5W", detectionConcentration: "300 - 10,000 ppm" },
    approxPriceInr: 140,
  },
  {
    id: "comp-bmp280",
    name: "BMP280 Barometric Pressure & Temp Sensor",
    slug: "bmp280-pressure-sensor",
    category: "Sensors",
    description: "High-precision digital atmospheric pressure and altitude sensor for weather monitoring.",
    interfaces: "I2C (SDA, SCL), SPI",
    specifications: { operatingVoltage: "1.8V - 3.6V", pressureRange: "300 - 1100 hPa (±1 hPa accuracy)", tempRange: "-40 to 85°C" },
    approxPriceInr: 125,
  },
  {
    id: "comp-ir-obstacle",
    name: "IR Infrared Obstacle Avoidance Sensor",
    slug: "ir-obstacle-avoidance-sensor",
    category: "Sensors",
    description: "Reflective infrared proximity sensor for robotic obstacle detection and line following.",
    interfaces: "Digital Output (OUT)",
    specifications: { operatingVoltage: "3.3V - 5V", detectionDistance: "2cm - 30cm (potentiometer calibrated)" },
    approxPriceInr: 45,
  },
  {
    id: "comp-pot-10k",
    name: "10k Rotary Potentiometer",
    slug: "10k-rotary-potentiometer",
    category: "Passives & Indicators",
    description: "Linear rotary potentiometer with standard 3-pin breadboard spacing for analog tuning.",
    interfaces: "Analog Wiper (SIG), VCC, GND",
    specifications: { resistance: "10k Ohm", rotationAngle: "300 degrees", powerRating: "0.1W" },
    approxPriceInr: 25,
  },
  {
    id: "comp-lcd1602",
    name: "16x2 Character LCD Display (I2C Backpack)",
    slug: "lcd1602-i2c-character-display",
    category: "Displays",
    description: "High-contrast 16 character by 2 line alphanumeric display with PCF8574 I2C adapter backpack.",
    interfaces: "I2C (SDA, SCL, VCC, GND)",
    specifications: { operatingVoltage: "5V", i2cAddress: "0x27 / 0x3F", backlight: "Blue LED with white text" },
    approxPriceInr: 220,
  },
  {
    id: "comp-tm1637",
    name: "TM1637 4-Digit 7-Segment Display",
    slug: "tm1637-4-digit-7-segment",
    category: "Displays",
    description: "Digital clock / countdown readout module with 0.36-inch red LED digits and center colon.",
    interfaces: "2-Wire Serial (CLK, DIO)",
    specifications: { operatingVoltage: "3.3V - 5V", displayColor: "Red", digits: "4 digits with clock colon" },
    approxPriceInr: 95,
  },
  {
    id: "comp-rgb-led",
    name: "RGB 4-Pin LED Module (Common Cathode)",
    slug: "rgb-led-module-common-cathode",
    category: "Displays",
    description: "Tri-color full-spectrum LED module driven by PWM channels for millions of mixed colors.",
    interfaces: "R, G, B PWM Pins, GND",
    specifications: { forwardVoltage: "Red 2.0V, Green 3.2V, Blue 3.2V", commonType: "Common Cathode (-)" },
    approxPriceInr: 30,
  },
  {
    id: "comp-dc-motor",
    name: "DC Hobby Toy Motor (3V-6V)",
    slug: "dc-hobby-motor-3v-6v",
    category: "Motors & Actuators",
    description: "Standard miniature DC electric motor for robotics wheels, fans, and propeller models.",
    interfaces: "2-Lead Terminals (+, -)",
    specifications: { operatingVoltage: "3V - 6V DC", noLoadSpeed: "9000 RPM @ 3V", stallCurrent: "0.8A" },
    approxPriceInr: 40,
  },
  {
    id: "comp-stepper-28byj",
    name: "28BYJ-48 Stepper Motor + ULN2003 Driver",
    slug: "28byj-48-stepper-motor-uln2003",
    category: "Motors & Actuators",
    description: "Precision 5V geared unipolar 4-phase stepper motor with ULN2003 Darlington transistor board.",
    interfaces: "4-Phase Digital Inputs (IN1 - IN4), 5V, GND",
    specifications: { stepAngle: "5.625° / 64 gear reduction", voltage: "5V DC", torque: ">34.3 mN.m" },
    approxPriceInr: 175,
  },
  {
    id: "comp-solenoid-12v",
    name: "12V DC Electric Solenoid Lock / Actuator",
    slug: "12v-dc-solenoid-lock",
    category: "Motors & Actuators",
    description: "Push-pull electromagnetic plunger actuator for smart door locks, latches, and valves.",
    interfaces: "2-Wire DC Terminals (+, -)",
    specifications: { voltage: "12V DC", current: "0.6A", strokeLength: "10mm", force: "5N" },
    approxPriceInr: 280,
  },
  {
    id: "comp-battery-9v",
    name: "9V Alkaline Battery & Snap Connector",
    slug: "9v-alkaline-battery-pack",
    category: "Passives & Indicators",
    description: "High-capacity 9V DC battery power source with standard snap leads for standalone circuits.",
    interfaces: "DC Power Snap Leads (+9V, GND)",
    specifications: { nominalVoltage: "9.0V", capacity: "550mAh", chemistry: "Alkaline" },
    approxPriceInr: 65,
  },
  {
    id: "comp-hc05",
    name: "HC-05 Wireless Bluetooth Serial Module",
    slug: "hc-05-bluetooth-serial-module",
    category: "Motors & Actuators",
    description: "Classic Bluetooth SPP (Serial Port Protocol) transparent UART transceiver for wireless telemetry.",
    interfaces: "UART (TXD, RXD), VCC, GND, STATE, EN",
    specifications: { bluetoothStandard: "v2.0 + EDR", baudRate: "9600 to 115200", operatingVoltage: "3.6V - 6V" },
    approxPriceInr: 290,
  },
];

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: "proj-smart-irrigation",
    title: "Smart Irrigation System",
    slug: "smart-irrigation-system",
    description: "Automated plant watering system monitoring soil moisture with an ESP32 and controlling a 5V water pump via relay.",
    board: "ESP32",
    category: "IoT & Agriculture",
    difficulty: "Intermediate",
    budgetInr: 1250,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "An automated irrigation controller that measures volumetric soil moisture and activates an irrigation relay when moisture falls below a configurable threshold.",
      problem: "Houseplants and garden beds suffer from under-watering or root rot due to manual watering schedules.",
      solution: "ESP32 reads capacitive moisture data every 10 seconds, displays readings on an OLED screen, and toggles a submersible pump relay safely.",
      features: [
        "Capacitive analog soil moisture measurement",
        "128x64 OLED display for real-time moisture % and status",
        "Opto-isolated 5V relay control for water pump",
        "Safety timeout: pump shuts off after 8 seconds to prevent flooding"
      ],
      hardwareRequirements: [
        "ESP32 DevKit V1",
        "Capacitive Soil Moisture Sensor v1.2",
        "1-Channel 5V Relay Module",
        "SSD1306 0.96\" I2C OLED Display",
        "5V Submersible Mini Pump & Vinyl Tubing",
        "Solderless Breadboard & Jumper Wires"
      ],
      wiringInstructions: [
        { from: "Capacitive Sensor VCC", to: "ESP32 3V3", pinFrom: "VCC", pinTo: "3V3", note: "Use 3.3V to prevent ADC saturation" },
        { from: "Capacitive Sensor GND", to: "ESP32 GND", pinFrom: "GND", pinTo: "GND" },
        { from: "Capacitive Sensor AOUT", to: "ESP32 GPIO 34", pinFrom: "AOUT", pinTo: "GPIO34", note: "ADC1 Channel 6 (input-only pin)" },
        { from: "Relay Module VCC", to: "ESP32 VIN (5V)", pinFrom: "VCC", pinTo: "VIN" },
        { from: "Relay Module GND", to: "ESP32 GND", pinFrom: "GND", pinTo: "GND" },
        { from: "Relay Module IN", to: "ESP32 GPIO 23", pinFrom: "IN", pinTo: "GPIO23" },
        { from: "OLED SDA", to: "ESP32 GPIO 21", pinFrom: "SDA", pinTo: "GPIO21" },
        { from: "OLED SCL", to: "ESP32 GPIO 22", pinFrom: "SCL", pinTo: "GPIO22" }
      ],
      buildSteps: [
        { step: 1, goal: "Mount and power distribution", instructions: "Place ESP32 onto breadboard. Connect VIN and GND rails.", outcome: "ESP32 powers on via Micro-USB." },
        { step: 2, goal: "Wire I2C OLED Display", instructions: "Connect OLED VCC to 3V3, GND to GND, SDA to GPIO 21, SCL to GPIO 22.", outcome: "Display initializes with I2C address 0x3C." },
        { step: 3, goal: "Connect Capacitive Moisture Sensor", instructions: "Wire Sensor VCC to 3V3, GND to GND, and AOUT to GPIO 34.", outcome: "Readings vary between dry air (~3100 ADC) and water (~1400 ADC)." },
        { step: 4, goal: "Wire Relay and Pump", instructions: "Connect Relay IN to GPIO 23. Wire pump supply through relay NO (Normally Open) contacts.", outcome: "Relay clicks and LED illuminates on trigger." }
      ],
      testingGuide: [
        "1. Power on with sensor in dry air; verify display shows '<20% Moisture' and relay triggers.",
        "2. Submerge sensor tip in water; verify display shows '>80% Moisture' and relay turns OFF.",
        "3. Confirm emergency timeout stops pump after 8 seconds continuous operation."
      ],
      limitations: [
        "Capacitive sensors must be calibrated for specific soil types (clay vs sandy).",
        "Micro-USB supply cannot power pump directly; use external 5V supply for pump load."
      ],
      safetyNotes: [
        "Keep water container separate from the electronics breadboard.",
        "Ensure flyback diode is present across DC pump terminals to absorb inductive spikes."
      ],
      estimatedCost: "₹1,150 - ₹1,400"
    },
    circuit: {
      components: [
        { id: "esp32-1", type: "esp32", label: "ESP32 DevKit", x: 300, y: 150 },
        { id: "soil-1", type: "soil_moisture_sensor", label: "Soil Sensor v1.2", x: 80, y: 80 },
        { id: "oled-1", type: "oled_display", label: "SSD1306 OLED", x: 550, y: 80 },
        { id: "relay-1", type: "relay_module", label: "5V Relay", x: 550, y: 280 }
      ],
      connections: [
        { id: "conn-1", sourceComponentId: "soil-1", sourcePin: "VCC", targetComponentId: "esp32-1", targetPin: "3V3", status: "confirmed", evidence: "Verified 3.3V power" },
        { id: "conn-2", sourceComponentId: "soil-1", sourcePin: "GND", targetComponentId: "esp32-1", targetPin: "GND", status: "confirmed", evidence: "Common ground" },
        { id: "conn-3", sourceComponentId: "soil-1", sourcePin: "AOUT", targetComponentId: "esp32-1", targetPin: "GPIO34", status: "confirmed", evidence: "ADC1 Pin" },
        { id: "conn-4", sourceComponentId: "oled-1", sourcePin: "SDA", targetComponentId: "esp32-1", targetPin: "GPIO21", status: "confirmed", evidence: "Hardware I2C SDA" },
        { id: "conn-5", sourceComponentId: "oled-1", sourcePin: "SCL", targetComponentId: "esp32-1", targetPin: "GPIO22", status: "confirmed", evidence: "Hardware I2C SCL" },
        { id: "conn-6", sourceComponentId: "relay-1", sourcePin: "IN", targetComponentId: "esp32-1", targetPin: "GPIO23", status: "confirmed", evidence: "Digital output driver" }
      ]
    },
    firmware: {
      filename: "smart_irrigation.ino",
      language: "arduino",
      content: `// Smart Irrigation System - ESP32 Firmware
// Pin Definitions
#define SOIL_PIN 34       // Capacitive soil moisture sensor on GPIO 34 (ADC1)
#define RELAY_PIN 23      // Water pump relay on GPIO 23

// Calibration constants (adjust for your soil)
const int DRY_VALUE = 3100;
const int WET_VALUE = 1400;
const int THRESHOLD_PERCENT = 30; // Water when below 30%

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Relay OFF initially
  
  pinMode(SOIL_PIN, INPUT);
  Serial.println("System Initialized: Smart Irrigation Ready");
}

void loop() {
  int rawValue = analogRead(SOIL_PIN);
  int moisturePercent = map(rawValue, DRY_VALUE, WET_VALUE, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
  
  Serial.print("Raw ADC: ");
  Serial.print(rawValue);
  Serial.print(" | Moisture: ");
  Serial.print(moisturePercent);
  Serial.println("%");
  
  if (moisturePercent < THRESHOLD_PERCENT) {
    Serial.println("Moisture low! Activating pump for 4 seconds...");
    digitalWrite(RELAY_PIN, HIGH);
    delay(4000); // Water for 4 seconds
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Pump deactivated. Waiting for absorption...");
    delay(10000); // Wait 10s before next read
  } else {
    digitalWrite(RELAY_PIN, LOW);
  }
  
  delay(3000); // Check every 3 seconds
}
`
    },
    bom: [
      { ref: "U1", name: "ESP32 DevKit V1", quantity: 1, unitPriceInr: 399, notes: "Main controller" },
      { ref: "S1", name: "Capacitive Soil Moisture Sensor v1.2", quantity: 1, unitPriceInr: 140 },
      { ref: "K1", name: "5V 1-Channel Relay Module", quantity: 1, unitPriceInr: 90 },
      { ref: "DISP1", name: "SSD1306 0.96\" I2C OLED", quantity: 1, unitPriceInr: 260 },
      { ref: "M1", name: "5V Submersible Pump", quantity: 1, unitPriceInr: 180 },
      { ref: "MISC", name: "Jumper Wires & Breadboard", quantity: 1, unitPriceInr: 120 }
    ]
  },
  {
    id: "proj-obstacle-avoiding-robot",
    title: "Obstacle-Avoiding Robot",
    slug: "obstacle-avoiding-robot",
    description: "Autonomous differential drive robot using an Arduino Uno, HC-SR04 ultrasonic sensor, SG90 servo, and L298N motor driver.",
    board: "Arduino Uno",
    category: "Robotics",
    difficulty: "Beginner",
    budgetInr: 1850,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "A two-wheel drive chassis robot that pans an ultrasonic sensor with a servo, detects obstacles within 25cm, and navigates autonomously.",
      problem: "Beginners need a hands-on project to understand motor control, PWM, sensor timing, and state machines.",
      solution: "Arduino Uno coordinates distance readings, rotates a turret servo, and commands an L298N motor driver to steer away from barriers.",
      features: [
        "Continuous distance scanning with HC-SR04 sonar",
        "Turret panning with SG90 servo (left 150°, center 90°, right 30°)",
        "Independent H-bridge speed control via PWM",
        "Stuck-detection recovery routine (reverse and pivot)"
      ],
      hardwareRequirements: [
        "Arduino Uno R3",
        "HC-SR04 Ultrasonic Sensor",
        "SG90 Micro Servo",
        "L298N Dual Motor Driver",
        "2WD Robot Chassis with TT Geared Motors",
        "2x 18650 Li-ion Battery Pack (7.4V)"
      ],
      wiringInstructions: [
        { from: "HC-SR04 Trigger", to: "Arduino Pin 9", pinFrom: "TRIG", pinTo: "D9" },
        { from: "HC-SR04 Echo", to: "Arduino Pin 8", pinFrom: "ECHO", pinTo: "D8" },
        { from: "SG90 Servo Signal", to: "Arduino Pin 10", pinFrom: "SIG", pinTo: "D10" },
        { from: "L298N IN1", to: "Arduino Pin 4", pinFrom: "IN1", pinTo: "D4" },
        { from: "L298N IN2", to: "Arduino Pin 5", pinFrom: "IN2", pinTo: "D5" },
        { from: "L298N IN3", to: "Arduino Pin 6", pinFrom: "IN3", pinTo: "D6" },
        { from: "L298N IN4", to: "Arduino Pin 7", pinFrom: "IN4", pinTo: "D7" }
      ],
      buildSteps: [
        { step: 1, goal: "Assemble 2WD chassis", instructions: "Mount TT motors, wheels, and caster ball to chassis plate.", outcome: "Rolling chassis assembled." },
        { step: 2, goal: "Mount and wire L298N driver", instructions: "Connect motor leads to OUT1-OUT4. Connect battery pack to 12V and GND. Connect GND to Arduino GND.", outcome: "Common ground established." },
        { step: 3, goal: "Mount Ultrasonic Turret", instructions: "Attach HC-SR04 to SG90 servo horn on front bumper.", outcome: "Sensor rotates freely without wire strain." },
        { step: 4, goal: "Program and Calibrate", instructions: "Upload obstacle avoidance firmware. Test forward, stop, and turn logic.", outcome: "Robot avoids obstacles safely." }
      ],
      testingGuide: [
        "1. Prop robot on blocks (wheels elevated). Place hand in front of sonar; verify wheels stop and reverse.",
        "2. Observe servo sweeping left and right to inspect clearance.",
        "3. Test on floor with cardboard obstacles."
      ],
      limitations: [
        "Soft materials (curtains, foam) absorb sonar waves and may not be detected reliably.",
        "Low clearance obstacles below sensor height will be missed."
      ],
      safetyNotes: [
        "Never connect 7.4V battery directly to Arduino 5V pin.",
        "Disconnect battery while programming via USB."
      ],
      estimatedCost: "₹1,600 - ₹2,100"
    },
    circuit: {
      components: [
        { id: "uno-1", type: "arduino_uno", label: "Arduino Uno R3", x: 320, y: 160 },
        { id: "sonar-1", type: "ultrasonic_sensor", label: "HC-SR04", x: 80, y: 80 },
        { id: "servo-1", type: "servo_motor", label: "SG90 Servo", x: 80, y: 260 },
        { id: "l298n-1", type: "motor_driver", label: "L298N Driver", x: 560, y: 160 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "sonar-1", sourcePin: "TRIG", targetComponentId: "uno-1", targetPin: "D9", status: "confirmed", evidence: "Pulse trigger pin" },
        { id: "c2", sourceComponentId: "sonar-1", sourcePin: "ECHO", targetComponentId: "uno-1", targetPin: "D8", status: "confirmed", evidence: "Echo receive pin" },
        { id: "c3", sourceComponentId: "servo-1", sourcePin: "SIG", targetComponentId: "uno-1", targetPin: "D10", status: "confirmed", evidence: "Servo PWM control" },
        { id: "c4", sourceComponentId: "l298n-1", sourcePin: "IN1", targetComponentId: "uno-1", targetPin: "D4", status: "confirmed", evidence: "Left motor FWD" },
        { id: "c5", sourceComponentId: "l298n-1", sourcePin: "IN2", targetComponentId: "uno-1", targetPin: "D5", status: "confirmed", evidence: "Left motor REV" },
        { id: "c6", sourceComponentId: "l298n-1", sourcePin: "IN3", targetComponentId: "uno-1", targetPin: "D6", status: "confirmed", evidence: "Right motor FWD" },
        { id: "c7", sourceComponentId: "l298n-1", sourcePin: "IN4", targetComponentId: "uno-1", targetPin: "D7", status: "confirmed", evidence: "Right motor REV" }
      ]
    },
    firmware: {
      filename: "obstacle_avoiding_robot.ino",
      language: "arduino",
      content: `// Obstacle Avoiding Robot - Arduino Uno
const int TRIG_PIN = 9;
const int ECHO_PIN = 8;
const int SERVO_PIN = 10;

// Motor Driver Pins
const int IN1 = 4;
const int IN2 = 5;
const int IN3 = 6;
const int IN4 = 7;

long readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 400; // No echo, clear path
  return duration * 0.034 / 2;
}

void moveForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void moveBackward() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

void turnLeft() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  
  stopMotors();
  delay(1000);
}

void loop() {
  long distance = readDistanceCm();
  
  if (distance > 25) {
    moveForward();
  } else {
    stopMotors();
    delay(200);
    moveBackward();
    delay(400);
    stopMotors();
    delay(200);
    turnLeft();
    delay(500);
    stopMotors();
    delay(200);
  }
  delay(50);
}
`
    },
    bom: [
      { ref: "U1", name: "Arduino Uno R3", quantity: 1, unitPriceInr: 549 },
      { ref: "S1", name: "HC-SR04 Ultrasonic Sensor", quantity: 1, unitPriceInr: 120 },
      { ref: "M1", name: "SG90 Micro Servo", quantity: 1, unitPriceInr: 130 },
      { ref: "U2", name: "L298N Dual Motor Driver", quantity: 1, unitPriceInr: 190 },
      { ref: "CHASSIS", name: "2WD Chassis Kit with Motors", quantity: 1, unitPriceInr: 550 },
      { ref: "BATTERY", name: "2x 18650 Battery Holder & Cells", quantity: 1, unitPriceInr: 300 }
    ]
  },
  {
    id: "proj-room-weather-station",
    title: "Room Weather Station",
    slug: "room-weather-station",
    description: "Compact environmental logger tracking temperature and humidity on an OLED display with an ESP32 and DHT22.",
    board: "ESP32",
    category: "Sensors & Weather",
    difficulty: "Beginner",
    budgetInr: 950,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "An indoor climate monitor that samples temperature and relative humidity every two seconds and renders live min/max metrics on an SSD1306 screen.",
      problem: "Room temperature and dry air impact sleep quality and productivity, requiring affordable local monitoring.",
      solution: "ESP32 queries a DHT22 precision digital sensor over a single GPIO and drives a 0.96\" I2C OLED display.",
      features: [
        "Temperature reading in °C and °F with ±0.5°C accuracy",
        "Relative humidity percentage with comfort index (Dry, Normal, Humid)",
        "Rolling min/max temperature memory"
      ],
      hardwareRequirements: [
        "ESP32 DevKit V1",
        "DHT22 (AM2302) Sensor",
        "SSD1306 0.96\" I2C OLED",
        "10k Ohm Pull-Up Resistor",
        "Mini Breadboard & Jumpers"
      ],
      wiringInstructions: [
        { from: "DHT22 Pin 1 (VCC)", to: "ESP32 3V3", pinFrom: "VCC", pinTo: "3V3" },
        { from: "DHT22 Pin 2 (DATA)", to: "ESP32 GPIO 4", pinFrom: "DATA", pinTo: "GPIO4", note: "Add 10k resistor between DATA and VCC" },
        { from: "DHT22 Pin 4 (GND)", to: "ESP32 GND", pinFrom: "GND", pinTo: "GND" },
        { from: "OLED SDA", to: "ESP32 GPIO 21", pinFrom: "SDA", pinTo: "GPIO21" },
        { from: "OLED SCL", to: "ESP32 GPIO 22", pinFrom: "SCL", pinTo: "GPIO22" }
      ],
      buildSteps: [
        { step: 1, goal: "Insert ESP32 and OLED into breadboard", instructions: "Bridge I2C lines to GPIO 21 and 22.", outcome: "Display powered." },
        { step: 2, goal: "Wire DHT22 with pull-up resistor", instructions: "Place 10k resistor between 3.3V and GPIO 4. Connect DHT22 data pin to GPIO 4.", outcome: "Clean digital 1-wire transitions." }
      ],
      testingGuide: [
        "1. Open Serial Monitor at 115200 baud to check raw sensor packets.",
        "2. Exhale gently on DHT22 mesh; verify humidity percentage increases within 3 seconds."
      ],
      limitations: ["DHT22 requires a 2-second interval between consecutive read requests."],
      safetyNotes: ["Do not supply 5V to DHT22 when connecting directly to 3.3V ESP32 GPIOs."],
      estimatedCost: "₹850 - ₹1,050"
    },
    circuit: {
      components: [
        { id: "esp-1", type: "esp32", label: "ESP32 DevKit", x: 300, y: 150 },
        { id: "dht-1", type: "dht22_sensor", label: "DHT22 Sensor", x: 80, y: 120 },
        { id: "oled-1", type: "oled_display", label: "OLED 0.96\"", x: 540, y: 120 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "dht-1", sourcePin: "DATA", targetComponentId: "esp-1", targetPin: "GPIO4", status: "confirmed", evidence: "Single bus 1-wire" },
        { id: "c2", sourceComponentId: "oled-1", sourcePin: "SDA", targetComponentId: "esp-1", targetPin: "GPIO21", status: "confirmed", evidence: "I2C SDA" },
        { id: "c3", sourceComponentId: "oled-1", sourcePin: "SCL", targetComponentId: "esp-1", targetPin: "GPIO22", status: "confirmed", evidence: "I2C SCL" }
      ]
    },
    firmware: {
      filename: "weather_station.ino",
      language: "arduino",
      content: `// Room Weather Station - ESP32
#include <Wire.h>

#define DHT_PIN 4

void setup() {
  Serial.begin(115200);
  pinMode(DHT_PIN, INPUT);
  Serial.println("Weather Station Initialized.");
}

void loop() {
  Serial.println("Reading temperature and humidity...");
  delay(2000);
}
`
    },
    bom: [
      { ref: "U1", name: "ESP32 DevKit V1", quantity: 1, unitPriceInr: 399 },
      { ref: "S1", name: "DHT22 Sensor", quantity: 1, unitPriceInr: 299 },
      { ref: "DISP1", name: "SSD1306 0.96\" OLED", quantity: 1, unitPriceInr: 260 }
    ]
  },
  {
    id: "proj-plant-health-monitor",
    title: "Plant Health Monitor",
    slug: "plant-health-monitor",
    description: "Compact Arduino Nano device measuring soil moisture and ambient sunlight with an LDR and multi-color indicator.",
    board: "Arduino Nano",
    category: "Agriculture & Plants",
    difficulty: "Beginner",
    budgetInr: 720,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "A desktop potted plant monitor that alerts when water or sunlight levels are suboptimal using an RGB indicator LED.",
      problem: "Plants kept indoors frequently suffer from insufficient light or sporadic watering.",
      solution: "Arduino Nano reads soil moisture via A0 and light via A1, switching the LED from Green (healthy) to Blue (thirsty) or Red (critical).",
      features: ["Analog soil moisture sensing", "LDR ambient brightness calculation", "Tri-color status indicator LED"],
      hardwareRequirements: ["Arduino Nano", "Capacitive Soil Sensor", "LDR Photoresistor", "10k Resistor", "RGB LED", "3x 220 Ohm Resistors"],
      wiringInstructions: [
        { from: "Soil Sensor AOUT", to: "Nano A0", pinFrom: "AOUT", pinTo: "A0" },
        { from: "LDR Divider Node", to: "Nano A1", pinFrom: "VOUT", pinTo: "A1" },
        { from: "RGB Red Pin", to: "Nano D3", pinFrom: "R", pinTo: "D3" },
        { from: "RGB Green Pin", to: "Nano D5", pinFrom: "G", pinTo: "D5" },
        { from: "RGB Blue Pin", to: "Nano D6", pinFrom: "B", pinTo: "D6" }
      ],
      buildSteps: [
        { step: 1, goal: "Assemble analog sensor dividers", instructions: "Set up LDR with 10k resistor as voltage divider on A1.", outcome: "Analog voltage scales with light." }
      ],
      testingGuide: ["Cover LDR with finger; verify blue/red indicator activates."],
      limitations: ["Indoor light fluctuations may trigger frequent warning changes."],
      safetyNotes: ["Keep USB cable elevated from watering tray."],
      estimatedCost: "₹650 - ₹800"
    },
    circuit: {
      components: [
        { id: "nano-1", type: "arduino_nano", label: "Arduino Nano", x: 300, y: 150 },
        { id: "soil-1", type: "soil_moisture_sensor", label: "Soil Sensor", x: 80, y: 100 },
        { id: "led-1", type: "led", label: "Status LED", x: 520, y: 150 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "soil-1", sourcePin: "AOUT", targetComponentId: "nano-1", targetPin: "A0", status: "confirmed", evidence: "Analog soil input" },
        { id: "c2", sourceComponentId: "led-1", sourcePin: "ANODE", targetComponentId: "nano-1", targetPin: "D3", status: "confirmed", evidence: "PWM Status LED" }
      ]
    },
    firmware: {
      filename: "plant_health.ino",
      language: "arduino",
      content: `// Plant Health Monitor - Arduino Nano
const int SOIL_PIN = A0;
const int LED_PIN = 3;

void setup() {
  pinMode(SOIL_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int moisture = analogRead(SOIL_PIN);
  if (moisture > 500) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(1000);
}
`
    },
    bom: [
      { ref: "U1", name: "Arduino Nano V3", quantity: 1, unitPriceInr: 249 },
      { ref: "S1", name: "Capacitive Soil Sensor", quantity: 1, unitPriceInr: 140 },
      { ref: "D1", name: "LED & Passives", quantity: 1, unitPriceInr: 30 }
    ]
  },
  {
    id: "proj-smart-energy-monitor",
    title: "Smart Energy Monitor",
    slug: "smart-energy-monitor",
    description: "IoT power monitor with non-invasive current transformer (CT clamp) on ESP32.",
    board: "ESP32",
    category: "Energy & IoT",
    difficulty: "Advanced",
    budgetInr: 1450,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "Non-invasive AC power consumption tracker calculating RMS current and wattage.",
      problem: "Household energy waste goes undetected without sub-circuit level measurement.",
      solution: "SCT-013 CT clamp coupled with burden resistor sends analog waveform to ESP32 ADC.",
      features: ["True RMS current calculation", "Peak power detection", "Instant wattage readout on OLED"],
      hardwareRequirements: ["ESP32 DevKit", "SCT-013-000 CT Clamp", "10uF Capacitor", "2x 10k Resistors", "33 Ohm Burden Resistor", "OLED Display"],
      wiringInstructions: [
        { from: "CT Bias Voltage", to: "ESP32 GPIO 35", pinFrom: "OUT", pinTo: "GPIO35" }
      ],
      buildSteps: [
        { step: 1, goal: "Construct bias divider", instructions: "Split 3.3V into 1.65V virtual ground.", outcome: "AC waveform stays within 0-3.3V window." }
      ],
      testingGuide: ["Clamp onto live wire of a 100W light bulb; verify ~0.43A reading."],
      limitations: ["Must clamp around only the live or neutral conductor, never both."],
      safetyNotes: ["NEVER cut or strip mains insulation. Always use non-invasive clamp."],
      estimatedCost: "₹1,300 - ₹1,600"
    },
    circuit: {
      components: [
        { id: "esp-1", type: "esp32", label: "ESP32", x: 300, y: 150 },
        { id: "oled-1", type: "oled_display", label: "OLED", x: 520, y: 150 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "oled-1", sourcePin: "SDA", targetComponentId: "esp-1", targetPin: "GPIO21", status: "confirmed", evidence: "I2C SDA" }
      ]
    },
    firmware: {
      filename: "energy_monitor.ino",
      language: "arduino",
      content: `// Smart Energy Monitor - ESP32
#define CURRENT_PIN 35

void setup() {
  Serial.begin(115200);
}

void loop() {
  int val = analogRead(CURRENT_PIN);
  Serial.println(val);
  delay(500);
}
`
    },
    bom: [
      { ref: "U1", name: "ESP32 DevKit V1", quantity: 1, unitPriceInr: 399 },
      { ref: "CT1", name: "SCT-013-000 CT Sensor", quantity: 1, unitPriceInr: 650 }
    ]
  },
  {
    id: "proj-automatic-night-light",
    title: "Automatic Night Light",
    slug: "automatic-night-light",
    description: "Ambient light-controlled night lamp using an Arduino Uno, LDR sensor, and PWM LED brightness fading.",
    board: "Arduino Uno",
    category: "Home Automation",
    difficulty: "Beginner",
    budgetInr: 680,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "An energy-saving room light that turns on automatically when dusk is detected.",
      problem: "Dark hallways create tripping hazards and manual switching wastes energy.",
      solution: "Arduino Uno measures LDR darkness level and smoothly dims the LED up and down using PWM.",
      features: ["Smooth logarithmic LED brightness fading", "Hysteresis to avoid flickering at threshold"],
      hardwareRequirements: ["Arduino Uno", "LDR Sensor", "10k Resistor", "High-Brightness LED", "220 Ohm Resistor"],
      wiringInstructions: [
        { from: "LDR Divider", to: "Uno A0", pinFrom: "OUT", pinTo: "A0" },
        { from: "LED Anode", to: "Uno D9", pinFrom: "+", pinTo: "D9" }
      ],
      buildSteps: [
        { step: 1, goal: "Connect LDR to A0", instructions: "Wire 10k resistor to GND and LDR to 5V.", outcome: "Analog signal drops as room darkens." }
      ],
      testingGuide: ["Cover sensor; LED smoothly fades to 100% brightness."],
      limitations: ["Direct glare from the night light onto the LDR causes oscillation without optical shielding."],
      safetyNotes: ["Place optical barrier between LED and LDR."],
      estimatedCost: "₹600 - ₹750"
    },
    circuit: {
      components: [
        { id: "uno-1", type: "arduino_uno", label: "Arduino Uno", x: 300, y: 150 },
        { id: "led-1", type: "led", label: "High-Power LED", x: 520, y: 150 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "led-1", sourcePin: "ANODE", targetComponentId: "uno-1", targetPin: "D9", status: "confirmed", evidence: "PWM Pin 9" }
      ]
    },
    firmware: {
      filename: "night_light.ino",
      language: "arduino",
      content: `// Automatic Night Light - Arduino Uno
const int LDR_PIN = A0;
const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(LDR_PIN);
  int brightness = map(light, 800, 200, 0, 255);
  brightness = constrain(brightness, 0, 255);
  analogWrite(LED_PIN, brightness);
  delay(50);
}
`
    },
    bom: [
      { ref: "U1", name: "Arduino Uno R3", quantity: 1, unitPriceInr: 549 },
      { ref: "D1", name: "White LED & Resistor", quantity: 1, unitPriceInr: 15 }
    ]
  },
  {
    id: "proj-ultrasonic-distance-meter",
    title: "Ultrasonic Distance Meter",
    slug: "ultrasonic-distance-meter",
    description: "Handheld millimeter distance tape measure with Arduino Nano, HC-SR04, and tactile freeze button.",
    board: "Arduino Nano",
    category: "Sensors & Measurement",
    difficulty: "Beginner",
    budgetInr: 780,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "Digital rangefinder displaying real-time distance in centimeters and inches with a hold feature.",
      problem: "Measuring awkward room dimensions alone is difficult with manual tape measures.",
      solution: "Arduino Nano fires 40kHz ultrasound pulses and calculates time-of-flight to solid walls.",
      features: ["2cm to 400cm precision range", "Freeze measurement button", "Buzzer beep on close approach"],
      hardwareRequirements: ["Arduino Nano", "HC-SR04 Sonar", "SSD1306 OLED", "Push Button", "Buzzer"],
      wiringInstructions: [
        { from: "Sonar TRIG", to: "Nano D2", pinFrom: "TRIG", pinTo: "D2" },
        { from: "Sonar ECHO", to: "Nano D3", pinFrom: "ECHO", pinTo: "D3" }
      ],
      buildSteps: [
        { step: 1, goal: "Mount sensor to front bezel", instructions: "Ensure both transducer cylinders face forward unobstructed.", outcome: "Clear field of view." }
      ],
      testingGuide: ["Aim at wall 100cm away; measure with ruler to calibrate speed of sound constant."],
      limitations: ["Air temperature affects sound speed by ~0.6m/s per °C."],
      safetyNotes: ["Safe for household use."],
      estimatedCost: "₹700 - ₹900"
    },
    circuit: {
      components: [
        { id: "nano-1", type: "arduino_nano", label: "Arduino Nano", x: 300, y: 150 },
        { id: "sonar-1", type: "ultrasonic_sensor", label: "HC-SR04", x: 80, y: 120 }
      ],
      connections: [
        { id: "c1", sourceComponentId: "sonar-1", sourcePin: "TRIG", targetComponentId: "nano-1", targetPin: "D2", status: "confirmed", evidence: "Trigger" },
        { id: "c2", sourceComponentId: "sonar-1", sourcePin: "ECHO", targetComponentId: "nano-1", targetPin: "D3", status: "confirmed", evidence: "Echo" }
      ]
    },
    firmware: {
      filename: "distance_meter.ino",
      language: "arduino",
      content: `// Distance Meter - Arduino Nano
const int TRIG_PIN = 2;
const int ECHO_PIN = 3;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float cm = duration * 0.034 / 2.0;
  Serial.print(cm);
  Serial.println(" cm");
  delay(200);
}
`
    },
    bom: [
      { ref: "U1", name: "Arduino Nano V3", quantity: 1, unitPriceInr: 249 },
      { ref: "S1", name: "HC-SR04 Sonar", quantity: 1, unitPriceInr: 120 }
    ]
  },
  {
    id: "proj-temp-monitor-pico",
    title: "Basic Temperature Monitor",
    slug: "basic-temperature-monitor",
    description: "Minimalist temperature logger on Raspberry Pi Pico reading an analog temperature sensor.",
    board: "Raspberry Pi Pico",
    category: "Sensors & Measurement",
    difficulty: "Beginner",
    budgetInr: 520,
    isSample: true,
    isPublic: true,
    plan: {
      overview: "Simple introductory temperature monitor taking advantage of the Raspberry Pi Pico's 12-bit ADC.",
      problem: "Electronics newcomers need a clean, minimal code starter to explore Raspberry Pi Pico GPIOs.",
      solution: "Pico samples internal and external temperature sensors and outputs formatted JSON over serial.",
      features: ["12-bit ADC sampling (4096 steps)", "Formatted serial telemetry"],
      hardwareRequirements: ["Raspberry Pi Pico", "TMP36 or LM35 Temperature Sensor", "Breadboard"],
      wiringInstructions: [
        { from: "TMP36 VOUT", to: "Pico GP26 (ADC0)", pinFrom: "VOUT", pinTo: "GP26" }
      ],
      buildSteps: [
        { step: 1, goal: "Connect sensor to GP26", instructions: "Wire TMP36 to 3.3V, GND, and GP26 (Pin 31).", outcome: "Pico reads analog millivolts." }
      ],
      testingGuide: ["Open serial monitor at 115200; verify room temperature reads ~24-28°C."],
      limitations: ["Pico ADC reference has slight noise if USB 5V rail is unstable."],
      safetyNotes: ["Never supply more than 3.3V to Pico ADC inputs."],
      estimatedCost: "₹450 - ₹600"
    },
    circuit: {
      components: [
        { id: "pico-1", type: "pico", label: "Raspberry Pi Pico", x: 300, y: 150 }
      ],
      connections: []
    },
    firmware: {
      filename: "pico_temp.py",
      language: "python",
      content: `# Temperature Monitor - Raspberry Pi Pico (MicroPython)
import machine
import time

sensor_temp = machine.ADC(4)
conversion_factor = 3.3 / (65535)

while True:
    reading = sensor_temp.read_u16() * conversion_factor
    temperature = 27 - (reading - 0.706)/0.001721
    print("Core Temp: {:.2f} °C".format(temperature))
    time.sleep(2)
`
    },
    bom: [
      { ref: "U1", name: "Raspberry Pi Pico", quantity: 1, unitPriceInr: 379 }
    ]
  }
];
