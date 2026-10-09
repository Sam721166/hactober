import { NextRequest, NextResponse } from "next/server";
import { AVAILABLE_GEMMA_MODELS, DEFAULT_GEMMA_MODEL, testGemmaConnection } from "@/lib/gemma";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(req: NextRequest) {
  try {
    const isConfigured = Boolean(process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY);

    if (!isConfigured) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          error: "GEMMA_API_KEY is not set in environment variables.",
          models: AVAILABLE_GEMMA_MODELS,
          defaultModel: DEFAULT_GEMMA_MODEL,
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const runPing = searchParams.get("test") === "true";

    let health = { ok: true, model: DEFAULT_GEMMA_MODEL, message: "API key configured" };
    if (runPing) {
      health = await testGemmaConnection();
    }

    return NextResponse.json({
      ok: health.ok,
      configured: true,
      health,
      models: AVAILABLE_GEMMA_MODELS,
      defaultModel: DEFAULT_GEMMA_MODEL,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error) || "Failed to fetch Gemma models",
        models: AVAILABLE_GEMMA_MODELS,
        defaultModel: DEFAULT_GEMMA_MODEL,
      },
      { status: 500 }
    );
  }
}
