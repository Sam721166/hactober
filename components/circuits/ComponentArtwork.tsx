"use client";

import React from "react";

interface ComponentArtworkProps {
  type: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function ComponentArtwork({ type, size = "md", className = "" }: ComponentArtworkProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const renderArtwork = () => {
    switch (type) {
      case "esp32":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* PCB Board */}
            <rect x="15" y="10" width="70" height="80" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="2" />
            {/* Mounting holes */}
            <circle cx="20" cy="15" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="80" cy="15" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="20" cy="85" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="80" cy="85" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            {/* ESP32 RF Shield (Silver Can) */}
            <rect x="25" y="24" width="50" height="42" rx="2" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1" />
            {/* Antenna Area */}
            <path d="M30 18 H70 V24 H30 Z" fill="#991b1b" />
            <path d="M35 19 H65 M38 21 H62 M42 23 H58" stroke="#f59e0b" strokeWidth="0.8" />
            {/* Micro USB Port */}
            <rect x="38" y="8" width="24" height="6" rx="1" fill="#a1a1aa" stroke="#71717a" strokeWidth="1" />
            {/* ESP32 Text on shield */}
            <text x="50" y="44" fill="#3f3f46" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ESP-WROOM-32</text>
            <text x="50" y="54" fill="#71717a" fontSize="5" fontFamily="monospace" textAnchor="middle">Wi-Fi + BLE</text>
            {/* EN & BOOT Buttons */}
            <rect x="22" y="74" width="8" height="6" rx="1" fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
            <rect x="70" y="74" width="8" height="6" rx="1" fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
            {/* Red Power LED */}
            <circle cx="36" cy="77" r="1.8" fill="#ef4444" />
          </svg>
        );

      case "arduino_uno":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Arduino Teal PCB */}
            <rect x="12" y="15" width="76" height="70" rx="4" fill="#00878F" stroke="#005B60" strokeWidth="2" />
            {/* USB-B Silver Connector */}
            <rect x="6" y="22" width="16" height="20" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            <rect x="6" y="26" width="6" height="12" fill="#d4d4d8" />
            {/* DC Barrel Jack */}
            <rect x="6" y="58" width="18" height="22" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            {/* ATmega328P DIP Chip */}
            <rect x="38" y="50" width="38" height="12" rx="1" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
            <circle cx="41" cy="56" r="1" fill="#71717a" />
            {/* Crystal Oscillator */}
            <rect x="38" y="32" width="10" height="6" rx="2" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="0.8" />
            {/* Reset Button */}
            <rect x="76" y="22" width="8" height="8" rx="1" fill="#dc2626" stroke="#b91c1c" strokeWidth="0.8" />
            {/* Silk text */}
            <text x="56" y="28" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">UNO</text>
            <text x="56" y="36" fill="#e0f2fe" fontSize="4" fontFamily="sans-serif">Arduino</text>
          </svg>
        );

      case "arduino_nano":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Nano Blue PCB */}
            <rect x="25" y="10" width="50" height="80" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
            {/* Mini USB Port */}
            <rect x="38" y="8" width="24" height="8" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            {/* ATmega328P TQFP square chip */}
            <rect x="40" y="38" width="20" height="20" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            {/* ICSP Header Pins */}
            <circle cx="45" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="50" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="55" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="45" cy="76" r="1.5" fill="#f59e0b" />
            <circle cx="50" cy="76" r="1.5" fill="#f59e0b" />
            <circle cx="55" cy="76" r="1.5" fill="#f59e0b" />
            <text x="50" y="26" fill="#ffffff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">NANO</text>
          </svg>
        );

      case "pico":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Green Pico PCB */}
            <rect x="25" y="10" width="50" height="80" rx="3" fill="#15803d" stroke="#166534" strokeWidth="2" />
            {/* Micro USB */}
            <rect x="38" y="8" width="24" height="6" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            {/* RP2040 Chip */}
            <rect x="42" y="44" width="16" height="16" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            {/* BOOTSEL Button */}
            <circle cx="50" cy="32" r="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            {/* Castellated Edge Pads */}
            {[18, 26, 34, 42, 50, 58, 66, 74].map((y) => (
              <React.Fragment key={y}>
                <rect x="25" y={y} width="3" height="3" fill="#f59e0b" />
                <rect x="72" y={y} width="3" height="3" fill="#f59e0b" />
              </React.Fragment>
            ))}
            <text x="50" y="72" fill="#ffffff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Raspberry Pi</text>
            <text x="50" y="78" fill="#86efac" fontSize="4" fontFamily="sans-serif" textAnchor="middle">Pico</text>
          </svg>
        );

      case "ultrasonic_sensor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blue HC-SR04 PCB */}
            <rect x="10" y="24" width="80" height="52" rx="3" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2" />
            {/* Left Transducer Cylinder (Transmitter "T") */}
            <circle cx="32" cy="50" r="16" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="2" />
            <circle cx="32" cy="50" r="12" fill="#71717a" />
            <circle cx="32" cy="50" r="8" fill="#3f3f46" />
            <text x="32" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
            {/* Right Transducer Cylinder (Receiver "R") */}
            <circle cx="68" cy="50" r="16" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="2" />
            <circle cx="68" cy="50" r="12" fill="#71717a" />
            <circle cx="68" cy="50" r="8" fill="#3f3f46" />
            <text x="68" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">R</text>
            {/* Crystal Oscillator in center */}
            <rect x="47" y="36" width="6" height="12" rx="1" fill="#a1a1aa" />
            <text x="50" y="70" fill="#ffffff" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">HC-SR04</text>
          </svg>
        );

      case "dht22_sensor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* White Plastic Case */}
            <rect x="22" y="16" width="56" height="64" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            {/* Grille Slots */}
            {[26, 34, 42, 50, 58].map((y) => (
              <rect key={y} x="30" y={y} width="40" height="3" rx="1.5" fill="#94a3b8" />
            ))}
            {/* Pin header below */}
            <rect x="36" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="44" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="52" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="60" y="80" width="4" height="12" fill="#a1a1aa" />
            <text x="50" y="70" fill="#475569" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">DHT22</text>
          </svg>
        );

      case "soil_moisture_sensor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Upper Circuit Head */}
            <rect x="26" y="10" width="48" height="32" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            {/* 3-pin connector */}
            <circle cx="38" cy="18" r="2.5" fill="#f59e0b" />
            <circle cx="50" cy="18" r="2.5" fill="#f59e0b" />
            <circle cx="62" cy="18" r="2.5" fill="#f59e0b" />
            {/* Dual Probe Prongs */}
            <path d="M34 42 V88 C34 92 42 92 42 88 V42 Z" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <path d="M58 42 V88 C58 92 66 92 66 88 V42 Z" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            {/* Probe White Measurement Silk ruler */}
            {[50, 60, 70, 80].map((y) => (
              <React.Fragment key={y}>
                <line x1="36" y1={y} x2="40" y2={y} stroke="#f4f4f5" strokeWidth="1" />
                <line x1="60" y1={y} x2="64" y2={y} stroke="#f4f4f5" strokeWidth="1" />
              </React.Fragment>
            ))}
            <text x="50" y="34" fill="#a1a1aa" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle">Capacitive</text>
          </svg>
        );

      case "oled_display":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Black OLED PCB */}
            <rect x="15" y="12" width="70" height="76" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            {/* 4 Pin Header Top */}
            <circle cx="35" cy="18" r="2" fill="#f59e0b" />
            <circle cx="45" cy="18" r="2" fill="#f59e0b" />
            <circle cx="55" cy="18" r="2" fill="#f59e0b" />
            <circle cx="65" cy="18" r="2" fill="#f59e0b" />
            {/* Blue OLED Glass Screen */}
            <rect x="20" y="28" width="60" height="46" rx="2" fill="#09090b" stroke="#38bdf8" strokeWidth="1.2" />
            {/* Display graphics: mini telemetry line & text */}
            <path d="M26 54 L34 54 L40 42 L46 60 L52 48 L60 54 L74 54" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="26" y="34" width="20" height="4" rx="1" fill="#facc15" />
            <text x="50" y="66" fill="#38bdf8" fontSize="5" fontFamily="monospace" textAnchor="middle">128x64 SSD1306</text>
          </svg>
        );

      case "ldr_sensor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Breakout PCB */}
            <rect x="22" y="18" width="56" height="64" rx="3" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
            {/* LDR Disc */}
            <circle cx="50" cy="38" r="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Cadmium sulfide zigzag track */}
            <path d="M42 34 H58 M42 38 H58 M42 42 H58" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
            {/* Blue trimmer pot */}
            <rect x="42" y="58" width="16" height="14" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="50" cy="65" r="3" fill="#cbd5e1" />
          </svg>
        );

      case "servo_motor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Translucent Blue SG90 Case */}
            <rect x="25" y="32" width="50" height="48" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" opacity="0.9" />
            {/* Mounting tabs */}
            <rect x="15" y="44" width="10" height="8" rx="1" fill="#0369a1" />
            <circle cx="20" cy="48" r="1.5" fill="#f8fafc" />
            <rect x="75" y="44" width="10" height="8" rx="1" fill="#0369a1" />
            <circle cx="80" cy="48" r="1.5" fill="#f8fafc" />
            {/* Gear tower */}
            <circle cx="42" cy="32" r="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            {/* White Horn Arm */}
            <path d="M42 22 L72 16 C76 15 78 20 74 23 L46 28 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="42" cy="24" r="3" fill="#64748b" />
            <circle cx="68" cy="19" r="1.2" fill="#64748b" />
            {/* Colored wires below */}
            <path d="M40 80 V92" stroke="#ea580c" strokeWidth="2.5" />
            <path d="M50 80 V92" stroke="#dc2626" strokeWidth="2.5" />
            <path d="M60 80 V92" stroke="#78350f" strokeWidth="2.5" />
            <text x="50" y="60" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SG90</text>
          </svg>
        );

      case "motor_driver":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Red PCB */}
            <rect x="12" y="12" width="76" height="76" rx="4" fill="#b91c1c" stroke="#991b1b" strokeWidth="2" />
            {/* Black finned heatsink in center */}
            <rect x="30" y="24" width="40" height="34" rx="2" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            {[34, 40, 46, 52, 58, 64].map((x) => (
              <line key={x} x1={x} y1="24" x2={x} y2="58" stroke="#3f3f46" strokeWidth="1.5" />
            ))}
            {/* Blue Screw Terminals Left & Right */}
            <rect x="14" y="32" width="12" height="22" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="20" cy="38" r="2" fill="#f8fafc" />
            <circle cx="20" cy="48" r="2" fill="#f8fafc" />
            <rect x="74" y="32" width="12" height="22" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="80" cy="38" r="2" fill="#f8fafc" />
            <circle cx="80" cy="48" r="2" fill="#f8fafc" />
            {/* Big Capacitor */}
            <circle cx="32" cy="70" r="7" fill="#18181b" stroke="#71717a" strokeWidth="1.2" />
            <text x="50" y="74" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">L298N</text>
          </svg>
        );

      case "relay_module":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* PCB Base */}
            <rect x="18" y="14" width="64" height="72" rx="3" fill="#1e3a8a" stroke="#172554" strokeWidth="2" />
            {/* Blue Songle Relay Cube */}
            <rect x="24" y="20" width="52" height="38" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            <text x="50" y="36" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SONGLE</text>
            <text x="50" y="44" fill="#e0f2fe" fontSize="4" fontFamily="monospace" textAnchor="middle">5VDC RELAY</text>
            {/* Blue 3-pin Screw Terminal */}
            <rect x="28" y="64" width="44" height="16" rx="2" fill="#0369a1" stroke="#075985" strokeWidth="1" />
            <circle cx="36" cy="72" r="2.5" fill="#f8fafc" />
            <circle cx="50" cy="72" r="2.5" fill="#f8fafc" />
            <circle cx="64" cy="72" r="2.5" fill="#f8fafc" />
          </svg>
        );

      case "led":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 5mm LED Bulb */}
            <path d="M35 52 V36 C35 24 65 24 65 36 V52 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
            {/* Bulb Base Rim */}
            <rect x="32" y="52" width="36" height="6" rx="1" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            {/* Internal Anvil & Post */}
            <path d="M42 52 V40 L48 36" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
            <path d="M56 52 V36" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
            {/* Long Leads */}
            <line x1="42" y1="58" x2="42" y2="88" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="58" x2="56" y2="80" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case "resistor":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Metal Wire Leads */}
            <line x1="10" y1="50" x2="90" y2="50" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
            {/* Beige Ceramic Cylinder */}
            <rect x="28" y="38" width="44" height="24" rx="6" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
            {/* Color Bands: Brown, Black, Red, Gold (1k Ohm) */}
            <rect x="36" y="38" width="4" height="24" fill="#78350f" />
            <rect x="44" y="38" width="4" height="24" fill="#18181b" />
            <rect x="52" y="38" width="4" height="24" fill="#dc2626" />
            <rect x="62" y="38" width="4" height="24" fill="#ca8a04" />
          </svg>
        );

      case "push_button":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Metal Base */}
            <rect x="25" y="25" width="50" height="50" rx="3" fill="#e4e4e7" stroke="#71717a" strokeWidth="2" />
            {/* 4 Corner Rivets */}
            <circle cx="31" cy="31" r="2" fill="#71717a" />
            <circle cx="69" cy="31" r="2" fill="#71717a" />
            <circle cx="31" cy="69" r="2" fill="#71717a" />
            <circle cx="69" cy="69" r="2" fill="#71717a" />
            {/* Center Black Button Cap */}
            <circle cx="50" cy="50" r="16" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="50" cy="50" r="12" fill="#27272a" />
            {/* 4 Curved Legs */}
            <path d="M25 36 H14 M25 64 H14 M75 36 H86 M75 64 H86" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case "buzzer":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Black Cylindrical Body */}
            <circle cx="50" cy="50" r="32" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
            {/* Center Sound Hole */}
            <circle cx="50" cy="50" r="8" fill="#09090b" stroke="#52525b" strokeWidth="1" />
            {/* + Polarity Marker */}
            <text x="32" y="38" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="sans-serif">+</text>
            {/* Metal leads below */}
            <circle cx="42" cy="74" r="2" fill="#a1a1aa" />
            <circle cx="58" cy="74" r="2" fill="#a1a1aa" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="60" height="60" rx="6" fill="#f4f4f5" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M50 30 V70 M30 50 H70" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeClass} ${className}`}>
      {renderArtwork()}
    </div>
  );
}
