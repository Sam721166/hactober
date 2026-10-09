import { HardwarePin } from "@/components/circuits/HardwareNode";

export interface ComponentDefinition {
  type: string;
  name: string;
  category: "microcontrollers" | "sensors" | "actuators" | "displays" | "passives";
  pins: HardwarePin[];
  defaultProperties?: Record<string, any>;
}

export const COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> = {
  esp32: {
    type: "esp32",
    name: "ESP32 DevKit V1",
    category: "microcontrollers",
    pins: [
      { id: "3V3", name: "3V3", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "GPIO34", name: "D34 (ADC)", type: "analog", side: "left" },
      { id: "GPIO35", name: "D35 (ADC)", type: "analog", side: "left" },
      { id: "GPIO4", name: "D4", type: "digital", side: "right" },
      { id: "GPIO21", name: "D21 (SDA)", type: "i2c", side: "right" },
      { id: "GPIO22", name: "D22 (SCL)", type: "i2c", side: "right" },
      { id: "GPIO23", name: "D23", type: "digital", side: "right" },
      { id: "VIN", name: "VIN (5V)", type: "power", side: "right" },
    ],
  },
  arduino_uno: {
    type: "arduino_uno",
    name: "Arduino Uno R3",
    category: "microcontrollers",
    pins: [
      { id: "5V", name: "5V", type: "power", side: "left" },
      { id: "3V3", name: "3.3V", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "A0", name: "A0", type: "analog", side: "left" },
      { id: "A1", name: "A1", type: "analog", side: "left" },
      { id: "D2", name: "D2", type: "digital", side: "right" },
      { id: "D3", name: "D3 (PWM)", type: "pwm", side: "right" },
      { id: "D4", name: "D4", type: "digital", side: "right" },
      { id: "D5", name: "D5 (PWM)", type: "pwm", side: "right" },
      { id: "D8", name: "D8", type: "digital", side: "right" },
      { id: "D9", name: "D9 (PWM)", type: "pwm", side: "right" },
      { id: "D10", name: "D10 (PWM)", type: "pwm", side: "right" },
    ],
  },
  arduino_nano: {
    type: "arduino_nano",
    name: "Arduino Nano V3",
    category: "microcontrollers",
    pins: [
      { id: "5V", name: "5V", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "A0", name: "A0", type: "analog", side: "left" },
      { id: "A1", name: "A1", type: "analog", side: "left" },
      { id: "D2", name: "D2", type: "digital", side: "right" },
      { id: "D3", name: "D3 (PWM)", type: "pwm", side: "right" },
      { id: "D9", name: "D9 (PWM)", type: "pwm", side: "right" },
    ],
  },
  pico: {
    type: "pico",
    name: "Raspberry Pi Pico",
    category: "microcontrollers",
    pins: [
      { id: "3V3", name: "3V3", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "GP26", name: "GP26 (ADC0)", type: "analog", side: "left" },
      { id: "GP0", name: "GP0 (TX)", type: "digital", side: "right" },
      { id: "GP1", name: "GP1 (RX)", type: "digital", side: "right" },
    ],
  },
  dht22_sensor: {
    type: "dht22_sensor",
    name: "DHT22 Sensor",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC", type: "power", side: "left" },
      { id: "DATA", name: "DATA", type: "digital", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  ultrasonic_sensor: {
    type: "ultrasonic_sensor",
    name: "HC-SR04 Sonar",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC", type: "power", side: "left" },
      { id: "TRIG", name: "TRIG", type: "digital", side: "right" },
      { id: "ECHO", name: "ECHO", type: "digital", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  soil_moisture_sensor: {
    type: "soil_moisture_sensor",
    name: "Soil Sensor v1.2",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC", type: "power", side: "left" },
      { id: "AOUT", name: "AOUT", type: "analog", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  ldr_sensor: {
    type: "ldr_sensor",
    name: "LDR Photoresistor",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC", type: "power", side: "left" },
      { id: "VOUT", name: "VOUT", type: "analog", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  oled_display: {
    type: "oled_display",
    name: "SSD1306 0.96\" OLED",
    category: "displays",
    pins: [
      { id: "VCC", name: "VCC", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "SCL", name: "SCL", type: "i2c", side: "right" },
      { id: "SDA", name: "SDA", type: "i2c", side: "right" },
    ],
  },
  servo_motor: {
    type: "servo_motor",
    name: "SG90 Micro Servo",
    category: "actuators",
    pins: [
      { id: "VCC", name: "5V (Red)", type: "power", side: "left" },
      { id: "GND", name: "GND (Brown)", type: "gnd", side: "left" },
      { id: "SIG", name: "SIG (Orange)", type: "pwm", side: "right" },
    ],
  },
  motor_driver: {
    type: "motor_driver",
    name: "L298N Motor Driver",
    category: "actuators",
    pins: [
      { id: "12V", name: "12V Input", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "IN1", name: "IN1", type: "digital", side: "right" },
      { id: "IN2", name: "IN2", type: "digital", side: "right" },
      { id: "IN3", name: "IN3", type: "digital", side: "right" },
      { id: "IN4", name: "IN4", type: "digital", side: "right" },
    ],
  },
  relay_module: {
    type: "relay_module",
    name: "5V Relay Module",
    category: "actuators",
    pins: [
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "IN", name: "IN", type: "digital", side: "right" },
      { id: "COM", name: "COM", type: "power", side: "right" },
      { id: "NO", name: "NO", type: "power", side: "right" },
    ],
  },
  led: {
    type: "led",
    name: "LED (5mm)",
    category: "passives",
    pins: [
      { id: "ANODE", name: "Anode (+)", type: "digital", side: "left" },
      { id: "CATHODE", name: "Cathode (-)", type: "gnd", side: "right" },
    ],
  },
  resistor: {
    type: "resistor",
    name: "Resistor",
    category: "passives",
    pins: [
      { id: "PIN1", name: "Pin 1", type: "digital", side: "left" },
      { id: "PIN2", name: "Pin 2", type: "digital", side: "right" },
    ],
  },
  push_button: {
    type: "push_button",
    name: "Push Button",
    category: "passives",
    pins: [
      { id: "PIN1", name: "Pin 1", type: "digital", side: "left" },
      { id: "PIN2", name: "Pin 2", type: "digital", side: "right" },
    ],
  },
  buzzer: {
    type: "buzzer",
    name: "Active Buzzer",
    category: "passives",
    pins: [
      { id: "POS", name: "VCC (+)", type: "digital", side: "left" },
      { id: "GND", name: "GND (-)", type: "gnd", side: "right" },
    ],
  },
};
