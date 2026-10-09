import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const GEMMA_KEY = process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY;
const TEXT_MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";
const VISION_MODEL = process.env.VISION_MODEL || "gemini-3.8-flash";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!GEMMA_KEY) {
    throw new Error(
      "Missing GEMMA_API_KEY in environment variables. Please add GEMMA_API_KEY to your .env file."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: GEMMA_KEY });
  }
  return aiClient;
}

// ========================================================
// 1. CIRCUIT DOCTOR: Structured Image Analysis
// ========================================================

export const CircuitObservationSchema = z.object({
  description: z.string(),
  confidence: z.enum(["High", "Medium", "Low"]),
  evidence: z.string(),
});

export const PotentialFaultSchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  confidence: z.enum(["High", "Medium", "Low"]),
  evidence: z.string(),
  recommendedTest: z.string(),
  expectedResult: z.string(),
});

export const CircuitAnalysisResultSchema = z.object({
  summary: z.string(),
  visibleObservations: z.array(CircuitObservationSchema),
  identifiedComponents: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["Observed", "Likely", "Uncertain"]),
      pinDetails: z.string().optional(),
    })
  ),
  potentialFaults: z.array(PotentialFaultSchema),
  recommendedSteps: z.array(z.string()),
  missingInformation: z.array(z.string()),
  safetyWarnings: z.array(z.string()),
});

export type CircuitAnalysisResult = z.infer<typeof CircuitAnalysisResultSchema>;

export async function analyzeCircuitImage(params: {
  imageBase64: string;
  mimeType: string;
  boardType?: string;
  knownComponents?: string;
  firmwareCode?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorLogs?: string;
}): Promise<CircuitAnalysisResult> {
  const ai = getAiClient();

  const prompt = `
You are CIRCUIT DOCTOR, a senior electrical and embedded systems engineer.
Analyze the attached circuit photograph along with the user's supplied technical context.

USER CONTEXT:
- Board Type: ${params.boardType || "Unspecified"}
- Known Components: ${params.knownComponents || "None specified"}
- Expected Behavior: ${params.expectedBehavior || "None specified"}
- Observed Behavior / Issues: ${params.actualBehavior || "None specified"}
- Error Messages / Logs: ${params.errorLogs || "None"}
${params.firmwareCode ? `- Firmware Provided:\n\`\`\`cpp\n${params.firmwareCode.slice(0, 1500)}\n\`\`\`` : ""}

CRITICAL ENGINEERING RULES:
1. Distinguish strictly between what is directly "Observed in image", "Likely", "Uncertain", and "Supplied by user".
2. Never claim electrical safety based only on a photograph.
3. Never invent connections where wires are obscured or ambiguous. Label them as uncertain.
4. For each potential fault, specify a deterministic, safe test the user can perform with their multimeter or code inspection before powering on.

Return your analysis strictly as valid JSON adhering to this schema:
{
  "summary": "Concise summary of visible hardware and diagnosed symptoms",
  "visibleObservations": [
    { "description": "e.g. Red jumper wire connects ESP32 3V3 to breadboard rail", "confidence": "High"|"Medium"|"Low", "evidence": "Clearly visible in foreground" }
  ],
  "identifiedComponents": [
    { "name": "ESP32 DevKit V1", "status": "Observed"|"Likely"|"Uncertain", "pinDetails": "Pins visible" }
  ],
  "potentialFaults": [
    {
      "id": "fault-1",
      "title": "Suspected Power Rail Short or Inversion",
      "explanation": "Detailed engineering explanation of why this creates the observed symptom",
      "confidence": "High"|"Medium"|"Low",
      "evidence": "Observed wire color or routing discrepancy",
      "recommendedTest": "With power disconnected, measure continuity between 3V3 and GND rails using a multimeter in resistance mode.",
      "expectedResult": "Resistance should measure in mega-ohms or open circuit, not zero."
    }
  ],
  "recommendedSteps": [
    "Step 1: Disconnect external power immediately",
    "Step 2: Inspect solder joints or breadboard clip tightness"
  ],
  "missingInformation": [
    "Any angle or component label obscured in photo"
  ],
  "safetyWarnings": [
    "Verify polarity before re-applying USB power to prevent thermal destruction"
  ]
}
`;

  try {
    const res = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
      },
    });

    const text = res.text || "";
    const cleanJson = extractJsonFromMarkdown(text);
    const parsed = JSON.parse(cleanJson);
    return CircuitAnalysisResultSchema.parse(parsed);
  } catch (error: any) {
    console.warn("Vision model analysis failed, attempting fallback:", error.message);
    throw new Error(`Circuit Doctor analysis error: ${error.message}`);
  }
}

// ========================================================
// 2. PROJECT BUILDER: Structured Project Generation
// ========================================================

export const ProjectPlanSchema = z.object({
  title: z.string(),
  overview: z.string(),
  problem: z.string(),
  solution: z.string(),
  features: z.array(z.string()),
  hardwareRequirements: z.array(z.string()),
  circuit: z.object({
    components: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        label: z.string(),
        x: z.number(),
        y: z.number(),
        properties: z.record(z.string(), z.any()).optional(),
      })
    ),
    connections: z.array(
      z.object({
        id: z.string(),
        sourceComponentId: z.string(),
        sourcePin: z.string(),
        targetComponentId: z.string(),
        targetPin: z.string(),
        status: z.string(),
        evidence: z.string(),
      })
    ),
  }),
  wiringInstructions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      pinFrom: z.string(),
      pinTo: z.string(),
      note: z.string().optional(),
    })
  ),
  firmware: z.object({
    filename: z.string(),
    language: z.string(),
    content: z.string(),
    explanation: z.string(),
  }),
  buildSteps: z.array(
    z.object({
      step: z.number(),
      goal: z.string(),
      instructions: z.string(),
      outcome: z.string(),
      mistakes: z.string().optional(),
      safetyNotes: z.string().optional(),
    })
  ),
  testingGuide: z.array(z.string()),
  limitations: z.array(z.string()),
  safetyNotes: z.array(z.string()),
  estimatedCost: z.string(),
  bom: z.array(
    z.object({
      ref: z.string(),
      name: z.string(),
      quantity: z.number(),
      unitPriceInr: z.number().optional(),
      notes: z.string().optional(),
    })
  ),
});

export type GeneratedProjectPlan = z.infer<typeof ProjectPlanSchema>;

export async function generateProjectPlan(params: {
  idea: string;
  board?: string;
  budgetInr?: number;
  experienceLevel?: string;
  category?: string;
  availableComponents?: string;
}): Promise<GeneratedProjectPlan> {
  const ai = getAiClient();

  const prompt = `
You are CIRCUITDOCTOR Project Builder, an expert hardware engineer.
Design a complete, production-grade hardware project based on this prompt:

USER REQUIREMENTS:
- Project Idea: "${params.idea}"
- Target Microcontroller: ${params.board || "ESP32 or Arduino Uno"}
- Budget Target: ₹${params.budgetInr || "1500"} INR
- Experience Level: ${params.experienceLevel || "Intermediate"}
- Category: ${params.category || "IoT"}
- Available Components: ${params.availableComponents || "None specified"}

ENGINEERING INSTRUCTIONS:
1. Provide REAL, electrically sound wiring instructions.
2. In the "circuit" object, use recognized component types:
   - "esp32", "arduino_uno", "arduino_nano", "pico"
   - "dht22_sensor", "ultrasonic_sensor", "soil_moisture_sensor", "ldr_sensor"
   - "oled_display", "relay_module", "servo_motor", "motor_driver"
   - "led", "push_button", "buzzer", "resistor"
3. All connections must link valid pins (e.g. VCC, GND, GPIO/Digital pins, I2C SDA/SCL, ADC pins).
4. Provide genuine, complete, compilable Arduino starter firmware in \`firmware.content\`.
5. Quote costs in Indian Rupees (₹ INR).

Output strictly valid JSON matching this schema:
{
  "title": "Clear Project Title",
  "overview": "Comprehensive 2-3 sentence overview",
  "problem": "The physical problem being solved",
  "solution": "How this circuit solves it",
  "features": ["Feature 1", "Feature 2"],
  "hardwareRequirements": ["Component 1", "Component 2"],
  "circuit": {
    "components": [
      { "id": "board-1", "type": "esp32", "label": "ESP32 DevKit", "x": 300, "y": 150 },
      { "id": "sens-1", "type": "dht22_sensor", "label": "DHT22 Sensor", "x": 80, "y": 100 }
    ],
    "connections": [
      { "id": "c1", "sourceComponentId": "sens-1", "sourcePin": "VCC", "targetComponentId": "board-1", "targetPin": "3V3", "status": "proposed", "evidence": "3.3V Power" },
      { "id": "c2", "sourceComponentId": "sens-1", "sourcePin": "GND", "targetComponentId": "board-1", "targetPin": "GND", "status": "proposed", "evidence": "Ground" },
      { "id": "c3", "sourceComponentId": "sens-1", "sourcePin": "DATA", "targetComponentId": "board-1", "targetPin": "GPIO4", "status": "proposed", "evidence": "1-Wire Data" }
    ]
  },
  "wiringInstructions": [
    { "from": "DHT22 VCC", "to": "ESP32 3V3", "pinFrom": "VCC", "pinTo": "3V3", "note": "Use 3.3V rail" }
  ],
  "firmware": {
    "filename": "main.ino",
    "language": "arduino",
    "content": "// Full working Arduino code...",
    "explanation": "Detailed explanation of pins, setup(), and loop()"
  },
  "buildSteps": [
    { "step": 1, "goal": "Mount MCU", "instructions": "Insert onto breadboard", "outcome": "Stable placement", "mistakes": "Avoid bridging opposite rails", "safetyNotes": "Power off" }
  ],
  "testingGuide": ["Step 1 testing", "Step 2 testing"],
  "limitations": ["Limitation 1", "Limitation 2"],
  "safetyNotes": ["Safety note 1"],
  "estimatedCost": "₹1,200 - ₹1,500",
  "bom": [
    { "ref": "U1", "name": "ESP32 DevKit V1", "quantity": 1, "unitPriceInr": 399, "notes": "Controller" }
  ]
}
`;

  const modelsToTry = [TEXT_MODEL, "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Generating project plan with model: ${model}...`);
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const text = res.text || "";
      const cleanJson = extractJsonFromMarkdown(text);
      const parsed = JSON.parse(cleanJson);
      return ProjectPlanSchema.parse(parsed);
    } catch (err: any) {
      console.warn(`Model ${model} failed project generation:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Project Builder generation error: ${lastError?.message || "Failed to generate project"}`);
}

// ========================================================
// 3. AI IDEA GENERATOR
// ========================================================

export async function generateProjectIdeas(params: {
  interests?: string;
  budgetInr?: number;
  board?: string;
  experienceLevel?: string;
}) {
  const ai = getAiClient();

  const prompt = `
Generate 4 unique, practical, and exciting hardware project ideas tailored to these constraints:
- Interests: ${params.interests || "General Electronics & Automation"}
- Target Budget: ₹${params.budgetInr || "1500"} INR
- Preferred Board: ${params.board || "ESP32 or Arduino"}
- Experience Level: ${params.experienceLevel || "Beginner to Intermediate"}

Return strictly valid JSON:
[
  {
    "title": "Catchy Title",
    "problem": "Brief description of problem",
    "solution": "Technical solution",
    "board": "ESP32",
    "difficulty": "Beginner" | "Intermediate" | "Advanced",
    "estimatedCost": "₹900 - ₹1,200",
    "components": ["ESP32", "Sensor X", "LED"],
    "skillsLearned": ["I2C Bus", "ADC Calibration", "Low Power Sleep"]
  }
]
`;

  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { temperature: 0.6 },
    });
    const cleanJson = extractJsonFromMarkdown(res.text || "");
    return JSON.parse(cleanJson);
  } catch (err: any) {
    // Try fallback
    const res = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { temperature: 0.6 },
    });
    return JSON.parse(extractJsonFromMarkdown(res.text || ""));
  }
}

// Helper function to extract JSON from model markdown code fence
function extractJsonFromMarkdown(text: string): string {
  let clean = text.trim();
  // Strip ```json and ```
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    return match[1].trim();
  }
  // If not fenced, find outermost { or [
  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = clean.lastIndexOf("}");
    if (lastBrace !== -1) {
      return clean.slice(firstBrace, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = clean.lastIndexOf("]");
    if (lastBracket !== -1) {
      return clean.slice(firstBracket, lastBracket + 1);
    }
  }
  return clean;
}
