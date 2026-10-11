import { NextRequest, NextResponse } from "next/server";
import { executeWithKeyRotation } from "@/lib/ai/key-manager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "fix", code = "", board = "ESP32", errors = [], circuit = null, query = "" } = body;

    let systemInstruction = `You are an expert embedded firmware systems engineer specializing in Arduino, ESP32, and Raspberry Pi Pico firmware development.
Your job is to provide production-grade, highly efficient, non-blocking C++ embedded code with clean formatting.`;

    let userPrompt = "";

    if (mode === "fix") {
      userPrompt = `Please review and fix the following ${board} Arduino/C++ firmware code.

ERRORS & WARNINGS TO RESOLVE:
${errors.length > 0 ? errors.join("\n") : "Fix any blocking delay() calls into non-blocking millis() tasks, ensure setup() and loop() are present, and ensure syntax correctness."}

EXISTING CODE:
\`\`\`cpp
${code}
\`\`\`

REQUIREMENTS:
1. Provide the complete, working fixed code inside a single \`\`\`cpp ... \`\`\` block.
2. Provide a brief 2-3 bullet point summary of what was fixed/optimized.
3. Keep all existing pin definitions, baud rates, and application logic intact.`;
    } else if (mode === "generate_driver") {
      userPrompt = `Generate a complete, non-blocking Arduino/C++ driver routine for the following hardware setup on a ${board}:

HARDWARE COMPONENTS & PIN CONNECTIONS:
${circuit ? JSON.stringify(circuit, null, 2) : "Standard sensors and peripherals connected to digital and analog pins."}

CUSTOM REQUEST:
${query || "Initialize all sensors, read values periodically every 1000ms using millis(), and print formatted JSON or clean key-value pairs over Serial at 115200 baud."}

REQUIREMENTS:
1. Provide the complete code inside a single \`\`\`cpp ... \`\`\` block.
2. Include correct libraries (e.g. <Wire.h>, <SPI.h> if applicable) and pin constants matching the hardware setup.
3. Use non-blocking timers instead of blocking delay().`;
    } else if (mode === "explain") {
      userPrompt = `Analyze and clearly explain the following ${board} embedded firmware:

\`\`\`cpp
${code}
\`\`\`

Explain:
1. Core Program Flow & State Machine.
2. Hardware Resource Usage (GPIO pins, interrupts, timers, memory footprint).
3. Any performance bottlenecks or real-time execution risks (e.g. blocking delays, watchdog timeouts).`;
    } else {
      userPrompt = `Provide embedded assistance for ${board}: ${query}\n\nCode Context:\n\`\`\`cpp\n${code}\n\`\`\``;
    }

    const aiResponse = await executeWithKeyRotation(
      "firmware",
      async (ai: any, keyEntry: any) => {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });
        return response.text || "";
      }
    );

    // Extract code block if present
    const codeMatch = aiResponse.match(/```(?:cpp|c|arduino)?\s*([\s\S]*?)```/);
    const extractedCode = codeMatch ? codeMatch[1].trim() : code;

    // Extract explanation (text outside or after code block)
    let explanation = aiResponse;
    if (codeMatch) {
      explanation = aiResponse.replace(/```(?:cpp|c|arduino)?[\s\S]*?```/, "").trim();
    }

    return NextResponse.json({
      ok: true,
      fixedCode: extractedCode,
      code: extractedCode,
      explanation: explanation || "Firmware updated successfully.",
      fullResponse: aiResponse,
    });
  } catch (error: any) {
    console.error("POST /api/firmware/ai error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to process firmware with AI." },
      { status: 500 }
    );
  }
}
