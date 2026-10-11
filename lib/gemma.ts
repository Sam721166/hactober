import { GoogleGenAI } from "@google/genai";
import {
  executeWithKeyRotation,
  getPrioritizedKeysForFeature,
  getClientForKey,
} from "./ai/key-manager";

export const DEFAULT_GEMMA_MODEL =
  process.env.GEMMA_MODEL || "gemini-3.8-flash";

export interface GemmaModelInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  contextWindow: string;
  isDefault: boolean;
}

export const AVAILABLE_GEMMA_MODELS: GemmaModelInfo[] = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    badge: "Recommended • Ultra Fast",
    description: "High-efficiency multimodal intelligence with swift generation and low latency.",
    contextWindow: "1M tokens",
    isDefault: true,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    badge: "Lightweight & Resilient",
    description: "Fast and versatile performance across text, multimodal inputs, and code.",
    contextWindow: "1M tokens",
    isDefault: false,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    badge: "Flagship Reasoning",
    description: "Advanced reasoning, circuit analysis, and comprehensive firmware generation.",
    contextWindow: "2M tokens",
    isDefault: false,
  },
];

export interface GemmaMessage {
  role: "user" | "assistant" | "model" | "system";
  content: string;
}

export interface GemmaGenerationOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  enableFallback?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Returns an authenticated GoogleGenAI client configured with GEMMA_API_KEY.
 */
export function getGemmaClient(): GoogleGenAI {
  const keys = getPrioritizedKeysForFeature("chat");
  if (keys.length === 0) {
    throw new Error(
      "Missing Gemma API key in environment variables. Please add GEMMA_API_KEY or GEMMA_API_KEY_CHAT to your .env file."
    );
  }
  return getClientForKey(keys[0].key);
}

/**
 * Validates and normalizes model name
 */
export function resolveModelName(modelName?: string): string {
  if (!modelName) return DEFAULT_GEMMA_MODEL;
  return modelName.startsWith("models/") ? modelName.replace("models/", "") : modelName;
}

/**
 * Gets the alternative Gemma model for fallback
 */
export function getFallbackModel(currentModel: string): string {
  const normalized = resolveModelName(currentModel);
  if (normalized === "gemma-4-31b-it") return "gemma-4-26b-a4b-it";
  return "gemma-4-31b-it";
}

/**
 * Generate text completion using Gemma free model with auto-fallback and multi-key rotation
 */
export async function generateGemmaResponse(
  prompt: string,
  options: GemmaGenerationOptions = {}
): Promise<{ text: string; model: string; fallbackUsed?: boolean }> {
  return await executeWithKeyRotation("chat", async (ai, keyEntry) => {
    const primaryModel = resolveModelName(options.model);
    const enableFallback = options.enableFallback !== false;

    const tryGenerate = async (model: string) => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options.temperature ?? 0.7,
          topP: options.topP,
          maxOutputTokens: options.maxOutputTokens,
          systemInstruction: options.systemInstruction,
        },
      });
    };

    try {
      const response = await tryGenerate(primaryModel);
      return {
        text: response.text || "",
        model: primaryModel,
      };
    } catch (error: unknown) {
      console.warn(`Gemma model ${primaryModel} failed on key ${keyEntry.source}:`, getErrorMessage(error));

      if (enableFallback) {
        const fallbackModel = getFallbackModel(primaryModel);
        try {
          const fallbackResponse = await tryGenerate(fallbackModel);
          return {
            text: fallbackResponse.text || "",
            model: fallbackModel,
            fallbackUsed: true,
          };
        } catch {
          // let outer loop rotate key
        }
      }

      throw error;
    }
  });
}

/**
 * Multi-turn chat completion using Gemma free model with auto-fallback and multi-key rotation
 */
export async function generateGemmaChat(
  messages: GemmaMessage[],
  options: GemmaGenerationOptions = {}
): Promise<{ text: string; model: string; fallbackUsed?: boolean }> {
  return await executeWithKeyRotation("chat", async (ai, keyEntry) => {
    const primaryModel = resolveModelName(options.model);
    const enableFallback = options.enableFallback !== false;

    let systemInstruction = options.systemInstruction;
    const conversationMessages = messages.filter((msg) => {
      if (msg.role === "system") {
        systemInstruction = msg.content;
        return false;
      }
      return true;
    });

    const contents = conversationMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const tryChat = async (model: string) => {
      return await ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: options.temperature ?? 0.7,
          topP: options.topP,
          maxOutputTokens: options.maxOutputTokens,
          systemInstruction,
        },
      });
    };

    try {
      const response = await tryChat(primaryModel);
      return {
        text: response.text || "",
        model: primaryModel,
      };
    } catch (error: unknown) {
      console.warn(`Gemma chat model ${primaryModel} failed on key ${keyEntry.source}:`, getErrorMessage(error));

      if (enableFallback) {
        const fallbackModel = getFallbackModel(primaryModel);
        try {
          const fallbackResponse = await tryChat(fallbackModel);
          return {
            text: fallbackResponse.text || "",
            model: fallbackModel,
            fallbackUsed: true,
          };
        } catch {
          // let outer loop rotate key
        }
      }

      throw error;
    }
  });
}

/**
 * Stream text generation using Gemma free model with auto-fallback and cross-key rotation
 */
export async function* streamGemmaResponse(
  promptOrMessages: string | GemmaMessage[],
  options: GemmaGenerationOptions = {}
): AsyncGenerator<{ chunk: string; model: string }, void, unknown> {
  const keys = getPrioritizedKeysForFeature("chat");
  if (keys.length === 0) {
    throw new Error("Missing Gemma API key. Please add GEMMA_API_KEY to your .env file.");
  }

  const primaryModel = resolveModelName(options.model);
  const enableFallback = options.enableFallback !== false;

  let systemInstruction = options.systemInstruction;

  const contents =
    typeof promptOrMessages === "string"
      ? promptOrMessages
      : promptOrMessages
          .filter((msg) => {
            if (msg.role === "system") {
              systemInstruction = msg.content;
              return false;
            }
            return true;
          })
          .map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          }));

  let activeModel = primaryModel;
  let stream: any = null;

  // Try creating the stream with prioritized keys
  for (let i = 0; i < keys.length; i++) {
    const keyEntry = keys[i];
    const ai = getClientForKey(keyEntry.key);

    try {
      stream = await ai.models.generateContentStream({
        model: activeModel,
        contents,
        config: {
          temperature: options.temperature ?? 0.7,
          topP: options.topP,
          maxOutputTokens: options.maxOutputTokens,
          systemInstruction,
        },
      });
      break;
    } catch (error: unknown) {
      console.warn(
        `Gemma stream creation failed with key ${keyEntry.source}:`,
        getErrorMessage(error)
      );
      if (enableFallback && i === keys.length - 1) {
        activeModel = getFallbackModel(primaryModel);
        console.log(`Falling back stream to model ${activeModel}...`);
        stream = await ai.models.generateContentStream({
          model: activeModel,
          contents,
          config: {
            temperature: options.temperature ?? 0.7,
            topP: options.topP,
            maxOutputTokens: options.maxOutputTokens,
            systemInstruction,
          },
        });
        break;
      }
      if (i === keys.length - 1) throw error;
    }
  }

  if (stream) {
    for await (const chunk of stream) {
      if (chunk.text) {
        yield { chunk: chunk.text, model: activeModel };
      }
    }
  }
}

/**
 * Health check to verify API connectivity and Gemma model access
 */
export async function testGemmaConnection(): Promise<{
  ok: boolean;
  model: string;
  message: string;
}> {
  try {
    const result = await generateGemmaResponse("Ping", {
      model: DEFAULT_GEMMA_MODEL,
      temperature: 0.1,
    });
    return {
      ok: true,
      model: result.model,
      message: "Gemma model responded successfully",
    };
  } catch (error: unknown) {
    return {
      ok: false,
      model: DEFAULT_GEMMA_MODEL,
      message: getErrorMessage(error) || "Failed to connect to Gemma model",
    };
  }
}
