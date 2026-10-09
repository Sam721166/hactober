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
  pir_sensor: {
    type: "pir_sensor",
    name: "HC-SR501 PIR Motion",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "OUT", name: "OUT (Signal)", type: "digital", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  mpu6050: {
    type: "mpu6050",
    name: "MPU-6050 6-Axis IMU",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC (3.3V-5V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "SCL", name: "SCL (Clock)", type: "i2c", side: "right" },
      { id: "SDA", name: "SDA (Data)", type: "i2c", side: "right" },
      { id: "INT", name: "INT (Interrupt)", type: "digital", side: "right" },
    ],
  },
  mq2_gas_sensor: {
    type: "mq2_gas_sensor",
    name: "MQ-2 Gas / Smoke Sensor",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "AOUT", name: "AOUT (Analog)", type: "analog", side: "right" },
      { id: "DOUT", name: "DOUT (Digital)", type: "digital", side: "right" },
    ],
  },
  bmp280: {
    type: "bmp280",
    name: "BMP280 Barometer / Temp",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC (3.3V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "SCL", name: "SCL", type: "i2c", side: "right" },
      { id: "SDA", name: "SDA", type: "i2c", side: "right" },
    ],
  },
  ir_sensor: {
    type: "ir_sensor",
    name: "IR Obstacle Sensor",
    category: "sensors",
    pins: [
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "OUT", name: "OUT", type: "digital", side: "right" },
    ],
  },
  potentiometer: {
    type: "potentiometer",
    name: "10k Potentiometer",
    category: "passives",
    pins: [
      { id: "VCC", name: "VCC (5V/3.3V)", type: "power", side: "left" },
      { id: "SIG", name: "SIG (Wiper)", type: "analog", side: "right" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
    ],
  },
  lcd1602: {
    type: "lcd1602",
    name: "16x2 LCD Display (I2C)",
    category: "displays",
    pins: [
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "SDA", name: "SDA", type: "i2c", side: "right" },
      { id: "SCL", name: "SCL", type: "i2c", side: "right" },
    ],
  },
  seven_segment: {
    type: "seven_segment",
    name: "TM1637 4-Digit 7-Seg",
    category: "displays",
    pins: [
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "DIO", name: "DIO (Data)", type: "digital", side: "right" },
      { id: "CLK", name: "CLK (Clock)", type: "digital", side: "right" },
    ],
  },
  rgb_led: {
    type: "rgb_led",
    name: "RGB LED (Common Cathode)",
    category: "displays",
    pins: [
      { id: "RED", name: "RED (PWM)", type: "pwm", side: "left" },
      { id: "GREEN", name: "GREEN (PWM)", type: "pwm", side: "left" },
      { id: "BLUE", name: "BLUE (PWM)", type: "pwm", side: "left" },
      { id: "GND", name: "GND (Cathode)", type: "gnd", side: "right" },
    ],
  },
  dc_motor: {
    type: "dc_motor",
    name: "DC Hobby Motor",
    category: "actuators",
    pins: [
      { id: "POS", name: "POS (+)", type: "power", side: "left" },
      { id: "NEG", name: "NEG (-)", type: "gnd", side: "right" },
    ],
  },
  stepper_motor: {
    type: "stepper_motor",
    name: "28BYJ-48 Stepper + ULN2003",
    category: "actuators",
    pins: [
      { id: "5V", name: "5V-12V Power", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "IN1", name: "IN1", type: "digital", side: "right" },
      { id: "IN2", name: "IN2", type: "digital", side: "right" },
      { id: "IN3", name: "IN3", type: "digital", side: "right" },
      { id: "IN4", name: "IN4", type: "digital", side: "right" },
    ],
  },
  solenoid: {
    type: "solenoid",
    name: "12V DC Solenoid / Lock",
    category: "actuators",
    pins: [
      { id: "POS", name: "12V (+)", type: "power", side: "left" },
      { id: "NEG", name: "GND (-)", type: "gnd", side: "right" },
    ],
  },
  battery_9v: {
    type: "battery_9v",
    name: "9V DC Battery Pack",
    category: "passives",
    pins: [
      { id: "POS", name: "9V (+)", type: "power", side: "left" },
      { id: "GND", name: "GND (-)", type: "gnd", side: "right" },
    ],
  },
  bluetooth_hc05: {
    type: "bluetooth_hc05",
    name: "HC-05 Bluetooth Module",
    category: "actuators",
    pins: [
      { id: "VCC", name: "VCC (5V)", type: "power", side: "left" },
      { id: "GND", name: "GND", type: "gnd", side: "left" },
      { id: "TXD", name: "TXD (Output)", type: "digital", side: "right" },
      { id: "RXD", name: "RXD (Input)", type: "digital", side: "right" },
      { id: "STATE", name: "STATE", type: "digital", side: "right" },
      { id: "EN", name: "EN / KEY", type: "digital", side: "right" },
    ],
  },
};
