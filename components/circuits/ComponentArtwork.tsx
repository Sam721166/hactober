"use client";

import React from "react";

export interface SimState {
  isLedOn?: boolean;
  servoAngle?: number;
  oledMessage?: string;
  buzzerActive?: boolean;
  relayActive?: boolean;
  motorRunning?: boolean;
  sensorReading?: number;
  tick?: number;
}

export interface ComponentArtworkProps {
  type: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isSimulating?: boolean;
  simState?: SimState;
}

const SIZE_MAP = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export function ComponentArtwork({
  type,
  size = "md",
  className = "",
  isSimulating = false,
  simState,
}: ComponentArtworkProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const renderArtwork = () => {
    switch (type) {
      case "esp32": {
        const isBlinking = isSimulating && ((simState?.tick ?? 0) % 2 === 0);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="10" width="70" height="80" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="2" />
            <circle cx="20" cy="15" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="80" cy="15" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="20" cy="85" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <circle cx="80" cy="85" r="2.5" fill="#e4e4e7" stroke="#71717a" strokeWidth="0.8" />
            <rect x="25" y="24" width="50" height="42" rx="2" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="1" />
            <path d="M30 18 H70 V24 H30 Z" fill="#991b1b" />
            <path d="M35 19 H65 M38 21 H62 M42 23 H58" stroke="#f59e0b" strokeWidth="0.8" />
            <rect x="38" y="8" width="24" height="6" rx="1" fill="#a1a1aa" stroke="#71717a" strokeWidth="1" />
            <text x="50" y="44" fill="#3f3f46" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ESP-WROOM-32</text>
            <text x="50" y="54" fill="#71717a" fontSize="5" fontFamily="monospace" textAnchor="middle">Wi-Fi + BLE</text>
            <rect x="22" y="74" width="8" height="6" rx="1" fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
            <rect x="70" y="74" width="8" height="6" rx="1" fill="#3f3f46" stroke="#71717a" strokeWidth="0.5" />
            {/* Power LED (Red) */}
            <circle cx="36" cy="77" r="1.8" fill={isSimulating ? "#ef4444" : "#7f1d1d"} />
            {isSimulating && <circle cx="36" cy="77" r="3.5" fill="#ef4444" opacity="0.4" />}
            {/* GPIO 2 User LED (Blue/Cyan Blink) */}
            <circle cx="64" cy="77" r="1.8" fill={isBlinking ? "#06b6d4" : "#164e63"} />
            {isBlinking && <circle cx="64" cy="77" r="3.5" fill="#06b6d4" opacity="0.6" />}
          </svg>
        );
      }

      case "arduino_uno": {
        const isBlinking = isSimulating && ((simState?.tick ?? 0) % 2 === 0);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="15" width="76" height="70" rx="4" fill="#00878F" stroke="#005B60" strokeWidth="2" />
            <rect x="6" y="22" width="16" height="20" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            <rect x="6" y="26" width="6" height="12" fill="#d4d4d8" />
            <rect x="6" y="58" width="18" height="22" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <rect x="38" y="50" width="38" height="12" rx="1" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />
            <circle cx="41" cy="56" r="1" fill="#71717a" />
            <rect x="38" y="32" width="10" height="6" rx="2" fill="#d4d4d8" stroke="#a1a1aa" strokeWidth="0.8" />
            <rect x="76" y="22" width="8" height="8" rx="1" fill="#dc2626" stroke="#b91c1c" strokeWidth="0.8" />
            <text x="56" y="28" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">UNO</text>
            <text x="56" y="36" fill="#e0f2fe" fontSize="4" fontFamily="sans-serif">Arduino</text>
            {/* ON LED (Green) */}
            <circle cx="72" cy="40" r="1.5" fill={isSimulating ? "#22c55e" : "#14532d"} />
            {/* Pin 13 LED "L" (Yellow Blink) */}
            <circle cx="72" cy="46" r="1.5" fill={isBlinking ? "#facc15" : "#713f12"} />
            {isBlinking && <circle cx="72" cy="46" r="3.5" fill="#facc15" opacity="0.6" />}
          </svg>
        );
      }

      case "arduino_nano": {
        const isBlinking = isSimulating && ((simState?.tick ?? 0) % 2 === 0);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="10" width="50" height="80" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
            <rect x="38" y="8" width="24" height="8" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            <rect x="40" y="38" width="20" height="20" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <circle cx="45" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="50" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="55" cy="70" r="1.5" fill="#f59e0b" />
            <circle cx="45" cy="76" r="1.5" fill="#f59e0b" />
            <circle cx="50" cy="76" r="1.5" fill="#f59e0b" />
            <circle cx="55" cy="76" r="1.5" fill="#f59e0b" />
            <text x="50" y="26" fill="#ffffff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">NANO</text>
            {/* Nano LED Blink */}
            <circle cx="50" cy="32" r="1.5" fill={isBlinking ? "#38bdf8" : "#075985"} />
          </svg>
        );
      }

      case "pico": {
        const isBlinking = isSimulating && ((simState?.tick ?? 0) % 2 === 0);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="10" width="50" height="80" rx="3" fill="#15803d" stroke="#166534" strokeWidth="2" />
            <rect x="38" y="8" width="24" height="6" rx="1" fill="#e4e4e7" stroke="#71717a" strokeWidth="1" />
            <rect x="42" y="44" width="16" height="16" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            <circle cx="50" cy="32" r="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            {[18, 26, 34, 42, 50, 58, 66, 74].map((y) => (
              <React.Fragment key={y}>
                <rect x="25" y={y} width="3" height="3" fill="#f59e0b" />
                <rect x="72" y={y} width="3" height="3" fill="#f59e0b" />
              </React.Fragment>
            ))}
            <text x="50" y="72" fill="#ffffff" fontSize="5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">Raspberry Pi</text>
            <text x="50" y="78" fill="#86efac" fontSize="4" fontFamily="sans-serif" textAnchor="middle">Pico</text>
            {/* Pico LED Blink */}
            <circle cx="36" cy="32" r="1.5" fill={isBlinking ? "#4ade80" : "#14532d"} />
          </svg>
        );
      }

      case "ultrasonic_sensor": {
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="24" width="80" height="52" rx="3" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2" />
            {/* T (Transmitter) */}
            <circle cx="32" cy="50" r="16" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="2" />
            <circle cx="32" cy="50" r="12" fill="#71717a" />
            <circle cx="32" cy="50" r="8" fill="#3f3f46" />
            <text x="32" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
            {/* Sonar pulses if simulating */}
            {isSimulating && (
              <>
                <circle cx="32" cy="50" r="19" stroke="#38bdf8" strokeWidth="1.2" opacity="0.6" />
                <circle cx="32" cy="50" r="23" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3" />
              </>
            )}
            {/* R (Receiver) */}
            <circle cx="68" cy="50" r="16" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="2" />
            <circle cx="68" cy="50" r="12" fill="#71717a" />
            <circle cx="68" cy="50" r="8" fill="#3f3f46" />
            <text x="68" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">R</text>
            <rect x="47" y="36" width="6" height="12" rx="1" fill="#a1a1aa" />
            <text x="50" y="70" fill="#ffffff" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">HC-SR04</text>
          </svg>
        );
      }

      case "dht22_sensor": {
        const isSampling = isSimulating && ((simState?.tick ?? 0) % 2 === 1);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="22" y="16" width="56" height="64" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            {[26, 34, 42, 50, 58].map((y) => (
              <rect key={y} x="30" y={y} width="40" height="3" rx="1.5" fill={isSampling ? "#38bdf8" : "#94a3b8"} />
            ))}
            <rect x="36" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="44" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="52" y="80" width="4" height="12" fill="#a1a1aa" />
            <rect x="60" y="80" width="4" height="12" fill="#a1a1aa" />
            <text x="50" y="70" fill="#475569" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">DHT22</text>
            {isSampling && <circle cx="68" cy="22" r="2" fill="#22c55e" />}
          </svg>
        );
      }

      case "soil_moisture_sensor": {
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="26" y="10" width="48" height="32" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            <circle cx="38" cy="18" r="2.5" fill="#f59e0b" />
            <circle cx="50" cy="18" r="2.5" fill="#f59e0b" />
            <circle cx="62" cy="18" r="2.5" fill="#f59e0b" />
            <path d="M34 42 V88 C34 92 42 92 42 88 V42 Z" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            <path d="M58 42 V88 C58 92 66 92 66 88 V42 Z" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            {[50, 60, 70, 80].map((y) => (
              <React.Fragment key={y}>
                <line x1="36" y1={y} x2="40" y2={y} stroke={isSimulating ? "#38bdf8" : "#f4f4f5"} strokeWidth="1" />
                <line x1="60" y1={y} x2="64" y2={y} stroke={isSimulating ? "#38bdf8" : "#f4f4f5"} strokeWidth="1" />
              </React.Fragment>
            ))}
            <text x="50" y="34" fill="#a1a1aa" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle">Capacitive</text>
            {isSimulating && <circle cx="30" cy="16" r="2" fill="#38bdf8" />}
          </svg>
        );
      }

      case "oled_display": {
        const oledMsg = simState?.oledMessage || "TEMP: 24.5°C";
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="12" width="70" height="76" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            <circle cx="35" cy="18" r="2" fill="#f59e0b" />
            <circle cx="45" cy="18" r="2" fill="#f59e0b" />
            <circle cx="55" cy="18" r="2" fill="#f59e0b" />
            <circle cx="65" cy="18" r="2" fill="#f59e0b" />
            {/* Screen */}
            <rect
              x="20"
              y="28"
              width="60"
              height="46"
              rx="2"
              fill={isSimulating ? "#031522" : "#09090b"}
              stroke={isSimulating ? "#06b6d4" : "#38bdf8"}
              strokeWidth="1.5"
            />
            {isSimulating ? (
              <>
                <text x="50" y="40" fill="#38bdf8" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {oledMsg}
                </text>
                <path d="M25 54 L33 54 L39 44 L45 62 L51 50 L57 54 L75 54" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
                <text x="50" y="66" fill="#4ade80" fontSize="4.5" fontFamily="monospace" textAnchor="middle">
                  SYS: RUNNING
                </text>
              </>
            ) : (
              <>
                <path d="M26 54 L34 54 L40 42 L46 60 L52 48 L60 54 L74 54" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="26" y="34" width="20" height="4" rx="1" fill="#facc15" />
                <text x="50" y="66" fill="#38bdf8" fontSize="5" fontFamily="monospace" textAnchor="middle">128x64 SSD1306</text>
              </>
            )}
          </svg>
        );
      }

      case "ldr_sensor": {
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="22" y="18" width="56" height="64" rx="3" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
            <circle cx="50" cy="38" r="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            <path d="M42 34 H58 M42 38 H58 M42 42 H58" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="42" y="58" width="16" height="14" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="50" cy="65" r="3" fill="#cbd5e1" />
            {isSimulating && <circle cx="30" cy="24" r="2.5" fill="#facc15" className="animate-pulse" />}
          </svg>
        );
      }

      case "servo_motor": {
        const angle = isSimulating ? (simState?.servoAngle ?? 90) : 0;
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="32" width="50" height="48" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" opacity="0.9" />
            <rect x="15" y="44" width="10" height="8" rx="1" fill="#0369a1" />
            <circle cx="20" cy="48" r="1.5" fill="#f8fafc" />
            <rect x="75" y="44" width="10" height="8" rx="1" fill="#0369a1" />
            <circle cx="80" cy="48" r="1.5" fill="#f8fafc" />
            <circle cx="42" cy="32" r="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            {/* Dynamic Rotating Horn Arm */}
            <g
              style={{
                transformOrigin: "42px 24px",
                transform: `rotate(${angle}deg)`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <path d="M42 22 L72 16 C76 15 78 20 74 23 L46 28 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="42" cy="24" r="3" fill="#64748b" />
              <circle cx="68" cy="19" r="1.2" fill="#64748b" />
            </g>
            <path d="M40 80 V92" stroke="#ea580c" strokeWidth="2.5" />
            <path d="M50 80 V92" stroke="#dc2626" strokeWidth="2.5" />
            <path d="M60 80 V92" stroke="#78350f" strokeWidth="2.5" />
            <text x="50" y="60" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SG90</text>
          </svg>
        );
      }

      case "motor_driver": {
        const isSpinning = isSimulating && (simState?.motorRunning ?? true);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="12" width="76" height="76" rx="4" fill="#b91c1c" stroke="#991b1b" strokeWidth="2" />
            <rect x="30" y="24" width="40" height="34" rx="2" fill="#18181b" stroke="#27272a" strokeWidth="1" />
            {[34, 40, 46, 52, 58, 64].map((x) => (
              <line key={x} x1={x} y1="24" x2={x} y2="58" stroke="#3f3f46" strokeWidth="1.5" />
            ))}
            <rect x="14" y="32" width="12" height="22" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="20" cy="38" r="2" fill="#f8fafc" />
            <circle cx="20" cy="48" r="2" fill="#f8fafc" />
            <rect x="74" y="32" width="12" height="22" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
            <circle cx="80" cy="38" r="2" fill="#f8fafc" />
            <circle cx="80" cy="48" r="2" fill="#f8fafc" />
            <circle cx="32" cy="70" r="7" fill="#18181b" stroke="#71717a" strokeWidth="1.2" />
            <text x="50" y="74" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">L298N</text>
            {isSpinning && (
              <circle cx="70" cy="70" r="6" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
            )}
          </svg>
        );
      }

      case "relay_module": {
        const isRelayOn = isSimulating && (simState?.relayActive ?? true);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="14" width="64" height="72" rx="3" fill="#1e3a8a" stroke="#172554" strokeWidth="2" />
            <rect x="24" y="20" width="52" height="38" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            <text x="50" y="36" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SONGLE</text>
            <text x="50" y="44" fill="#e0f2fe" fontSize="4" fontFamily="monospace" textAnchor="middle">5VDC RELAY</text>
            <rect x="28" y="64" width="44" height="16" rx="2" fill="#0369a1" stroke="#075985" strokeWidth="1" />
            <circle cx="36" cy="72" r="2.5" fill="#f8fafc" />
            <circle cx="50" cy="72" r="2.5" fill="#f8fafc" />
            <circle cx="64" cy="72" r="2.5" fill="#f8fafc" />
            {/* Status LED */}
            <circle cx="70" cy="24" r="2.5" fill={isRelayOn ? "#22c55e" : "#ef4444"} />
            {isRelayOn && <circle cx="70" cy="24" r="5" fill="#22c55e" opacity="0.4" />}
          </svg>
        );
      }

      case "led": {
        const isGlowing = isSimulating && (simState?.isLedOn ?? true);
        return (
          <div className="relative flex items-center justify-center w-full h-full">
            {isGlowing && (
              <div
                className="absolute inset-0 rounded-full bg-red-500/50 blur-md pointer-events-none"
                style={{
                  boxShadow: "0 0 25px #ef4444, 0 0 50px #ef4444",
                }}
              />
            )}
            <svg
              viewBox="0 0 100 100"
              className={`w-full h-full transition-all ${
                isGlowing ? "drop-shadow-[0_0_15px_#ef4444]" : "drop-shadow-sm"
              }`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="ledGlowGrad" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </radialGradient>
              </defs>
              {/* LED Bulb */}
              <path
                d="M35 52 V36 C35 24 65 24 65 36 V52 Z"
                fill={isGlowing ? "url(#ledGlowGrad)" : "#ef4444"}
                stroke={isGlowing ? "#ff8888" : "#b91c1c"}
                strokeWidth="2"
              />
              <rect
                x="32"
                y="52"
                width="36"
                height="6"
                rx="1"
                fill={isGlowing ? "#ff1111" : "#dc2626"}
                stroke="#991b1b"
                strokeWidth="1.5"
              />
              {/* Internal Filament */}
              <path
                d="M42 52 V40 L48 36"
                stroke={isGlowing ? "#fff" : "#ffffff"}
                strokeWidth="1.5"
                opacity={isGlowing ? "1" : "0.8"}
              />
              <path
                d="M56 52 V36"
                stroke={isGlowing ? "#fff" : "#ffffff"}
                strokeWidth="1.5"
                opacity={isGlowing ? "1" : "0.8"}
              />
              <line x1="42" y1="58" x2="42" y2="88" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
              <line x1="56" y1="58" x2="56" y2="80" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
              {isGlowing && (
                <circle cx="50" cy="38" r="10" fill="#fff" opacity="0.35" className="animate-pulse" />
              )}
            </svg>
          </div>
        );
      }

      case "resistor": {
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="50" x2="90" y2="50" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
            <rect x="28" y="38" width="44" height="24" rx="6" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
            <rect x="36" y="38" width="4" height="24" fill="#78350f" />
            <rect x="44" y="38" width="4" height="24" fill="#18181b" />
            <rect x="52" y="38" width="4" height="24" fill="#dc2626" />
            <rect x="62" y="38" width="4" height="24" fill="#ca8a04" />
          </svg>
        );
      }

      case "push_button": {
        const isPressed = isSimulating && ((simState?.tick ?? 0) % 3 === 0);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="25" width="50" height="50" rx="3" fill="#e4e4e7" stroke="#71717a" strokeWidth="2" />
            <circle cx="31" cy="31" r="2" fill="#71717a" />
            <circle cx="69" cy="31" r="2" fill="#71717a" />
            <circle cx="31" cy="69" r="2" fill="#71717a" />
            <circle cx="69" cy="69" r="2" fill="#71717a" />
            {/* Button Cap */}
            <circle
              cx="50"
              cy="50"
              r={isPressed ? "13" : "16"}
              fill={isPressed ? "#06b6d4" : "#18181b"}
              stroke="#3f3f46"
              strokeWidth="2"
            />
            <path d="M25 36 H14 M25 64 H14 M75 36 H86 M75 64 H86" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      }

      case "buzzer": {
        const isBeeping = isSimulating && (simState?.buzzerActive ?? false);
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="32" fill="#18181b" stroke={isBeeping ? "#f59e0b" : "#3f3f46"} strokeWidth="2.5" />
            <circle cx="50" cy="50" r="8" fill="#09090b" stroke="#52525b" strokeWidth="1" />
            <text x="32" y="38" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="sans-serif">+</text>
            <circle cx="42" cy="74" r="2" fill="#a1a1aa" />
            <circle cx="58" cy="74" r="2" fill="#a1a1aa" />
            {isBeeping && (
              <>
                <path d="M78 36 A28 28 0 0 1 78 64" stroke="#f59e0b" strokeWidth="2" fill="none" />
                <path d="M85 30 A38 38 0 0 1 85 70" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.6" />
              </>
            )}
          </svg>
        );
      }

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
