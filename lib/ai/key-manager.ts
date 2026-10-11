import { GoogleGenAI } from "@google/genai";

export type AiFeatureType = "doctor" | "builder" | "chat" | "firmware" | "general";

interface KeyEntry {
  key: string;
  source: string;
  label: string;
  isRateLimitedUntil?: number; // timestamp in ms
}

const clientCache = new Map<string, GoogleGenAI>();

/**
 * Normalizes and strips quotes/whitespace from API keys
 */
function cleanKey(val?: string | null): string {
  if (!val) return "";
  return val.replace(/["']/g, "").trim();
}

/**
 * Returns a list of all distinct, non-empty Gemma/Gemini API keys configured in the environment.
 */
export function getAllAvailableKeys(): KeyEntry[] {
  if (!process.env.GEMMA_API_KEY && typeof (process as any).loadEnvFile === "function") {
    try {
      (process as any).loadEnvFile();
    } catch {
      // ignore
    }
  }
  const env = process.env;
  const rawList: { key: string; source: string; label: string }[] = [];

  // 1. Feature-dedicated keys
  if (cleanKey(env.GEMMA_API_KEY_DOCTOR)) {
    rawList.push({
      key: cleanKey(env.GEMMA_API_KEY_DOCTOR),
      source: "GEMMA_API_KEY_DOCTOR",
      label: "Circuit Doctor (Vision & Diagnostics)",
    });
  }
  if (cleanKey(env.GEMMA_API_KEY_BUILDER)) {
    rawList.push({
      key: cleanKey(env.GEMMA_API_KEY_BUILDER),
      source: "GEMMA_API_KEY_BUILDER",
      label: "Project Builder (Schematics & BOM)",
    });
  }
  if (cleanKey(env.GEMMA_API_KEY_CHAT)) {
    rawList.push({
      key: cleanKey(env.GEMMA_API_KEY_CHAT),
      source: "GEMMA_API_KEY_CHAT",
      label: "Firmware IDE & Assistant Chat",
    });
  }
  if (cleanKey(env.GEMMA_API_KEY_IDE)) {
    rawList.push({
      key: cleanKey(env.GEMMA_API_KEY_IDE),
      source: "GEMMA_API_KEY_IDE",
      label: "Firmware IDE (Auto-fix & Compiling)",
    });
  }

  // 2. Sequential numbered keys
  const numberedKeys = [
    { source: "GEMMA_API_KEY_1", key: cleanKey(env.GEMMA_API_KEY_1) },
    { source: "GEMMA_API_KEY_2", key: cleanKey(env.GEMMA_API_KEY_2) },
    { source: "GEMMA_API_KEY_3", key: cleanKey(env.GEMMA_API_KEY_3) },
    { source: "GEMMA_API_KEY_4", key: cleanKey(env.GEMMA_API_KEY_4) },
  ];
  for (const item of numberedKeys) {
    if (item.key) {
      rawList.push({
        key: item.key,
        source: item.source,
        label: `Numbered Slot (${item.source})`,
      });
    }
  }

  // 3. Comma-separated list if provided
  if (env.GEMMA_API_KEYS) {
    const split = env.GEMMA_API_KEYS.split(",")
      .map((k) => cleanKey(k))
      .filter(Boolean);
    split.forEach((k, idx) => {
      rawList.push({
        key: k,
        source: `GEMMA_API_KEYS[${idx}]`,
        label: `Pool Key #${idx + 1}`,
      });
    });
  }

  // 4. Default / primary keys
  if (cleanKey(env.GEMMA_API_KEY)) {
    rawList.push({
      key: cleanKey(env.GEMMA_API_KEY),
      source: "GEMMA_API_KEY",
      label: "Default Primary Key",
    });
  }
  if (cleanKey(env.GEMINI_API_KEY)) {
    rawList.push({
      key: cleanKey(env.GEMINI_API_KEY),
      source: "GEMINI_API_KEY",
      label: "Fallback Gemini Key",
    });
  }

  // Deduplicate by key content while preserving source labels
  const seenKeys = new Set<string>();
  const uniqueKeys: KeyEntry[] = [];

  for (const item of rawList) {
    if (item.key && !seenKeys.has(item.key)) {
      seenKeys.add(item.key);
      uniqueKeys.push(item);
    }
  }

  return uniqueKeys;
}

/**
 * Returns prioritized keys for a specific feature, followed by the rest of the pool as fallbacks.
 */
export function getPrioritizedKeysForFeature(feature: AiFeatureType): KeyEntry[] {
  const allKeys = getAllAvailableKeys();
  if (allKeys.length === 0) return [];

  // Match preferred source name based on feature
  let preferredSource: string = "";
  let numberedFallbackIndex: number = -1;

  switch (feature) {
    case "doctor":
      preferredSource = "GEMMA_API_KEY_DOCTOR";
      numberedFallbackIndex = 0; // Key 1
      break;
    case "builder":
      preferredSource = "GEMMA_API_KEY_BUILDER";
      numberedFallbackIndex = 1; // Key 2
      break;
    case "chat":
      preferredSource = "GEMMA_API_KEY_CHAT";
      numberedFallbackIndex = 2; // Key 3
      break;
    case "firmware":
      preferredSource = "GEMMA_API_KEY_IDE";
      numberedFallbackIndex = 3; // Key 4 or 0
      break;
    default:
      preferredSource = "GEMMA_API_KEY";
      numberedFallbackIndex = 0;
      break;
  }

  // 1. Try exact match on feature-dedicated source
  const primaryMatch = allKeys.find((k) => k.source === preferredSource);

  // 2. If not found, use numbered slot index if available
  const numberedMatch =
    numberedFallbackIndex >= 0 && numberedFallbackIndex < allKeys.length
      ? allKeys[numberedFallbackIndex]
      : null;

  const chosenPrimary = primaryMatch || numberedMatch || allKeys[0];

  // Order with chosenPrimary first, then remaining keys for seamless failover
  const remaining = allKeys.filter((k) => k.key !== chosenPrimary.key);
  return [chosenPrimary, ...remaining];
}

/**
 * Gets or creates a cached GoogleGenAI instance for a given key string.
 */
export function getClientForKey(apiKey: string): GoogleGenAI {
  let client = clientCache.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, client);
  }
  return client;
}

/**
 * Inspects an error to determine if it is a rate limit or quota issue
 */
export function isRateLimitOrQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  return (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("overloaded") ||
    lower.includes("503")
  );
}

/**
 * Executes an AI operation with automatic cross-key rotation and failover.
 * If the primary key for the feature is rate-limited (429 or quota), it automatically
 * retries the operation with the other available keys in the pool.
 */
export async function executeWithKeyRotation<T>(
  feature: AiFeatureType,
  operation: (ai: GoogleGenAI, keyEntry: KeyEntry, attemptIndex: number) => Promise<T>
): Promise<T> {
  const keys = getPrioritizedKeysForFeature(feature);

  if (keys.length === 0) {
    throw new Error(
      "No Gemma/Gemini API keys configured. Please add GEMMA_API_KEY, GEMMA_API_KEY_DOCTOR, GEMMA_API_KEY_BUILDER, or GEMMA_API_KEY_CHAT to your .env file."
    );
  }

  let lastError: unknown = null;

  for (let i = 0; i < keys.length; i++) {
    const keyEntry = keys[i];
    const client = getClientForKey(keyEntry.key);

    try {
      if (i > 0) {
        console.log(
          `[KeyManager] Rotated to fallback key #${i + 1} (${keyEntry.source} - ${keyEntry.label}) for feature '${feature}'`
        );
      }
      return await operation(client, keyEntry, i);
    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = isRateLimitOrQuotaError(error);

      if (isRateLimit && i < keys.length - 1) {
        console.warn(
          `[KeyManager] Key ${keyEntry.source} (${keyEntry.label}) hit rate limit or capacity issue for '${feature}'. Automatically failing over to next available key...`
        );
        // Short pause before switching key to allow network queue to breathe
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }

      // If it's not a rate limit error or we've exhausted all keys, stop rotating
      if (!isRateLimit) {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Returns a summary of the multi-key pool for diagnostic logs (keys masked for security).
 */
export function getKeyPoolStatus(): {
  totalKeys: number;
  features: Record<AiFeatureType, { source: string; label: string }>;
  pool: Array<{ source: string; label: string; preview: string }>;
} {
  const allKeys = getAllAvailableKeys();

  const maskKey = (k: string) => {
    if (!k || k.length < 8) return "***";
    return `${k.slice(0, 4)}...${k.slice(-4)}`;
  };

  const getFeatureAssignment = (feature: AiFeatureType) => {
    const keys = getPrioritizedKeysForFeature(feature);
    if (keys.length === 0) return { source: "None", label: "No key configured" };
    return { source: keys[0].source, label: keys[0].label };
  };

  return {
    totalKeys: allKeys.length,
    features: {
      doctor: getFeatureAssignment("doctor"),
      builder: getFeatureAssignment("builder"),
      chat: getFeatureAssignment("chat"),
      firmware: getFeatureAssignment("firmware"),
      general: getFeatureAssignment("general"),
    },
    pool: allKeys.map((k) => ({
      source: k.source,
      label: k.label,
      preview: maskKey(k.key),
    })),
  };
}
