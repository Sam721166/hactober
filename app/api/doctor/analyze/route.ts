import { NextRequest, NextResponse } from "next/server";
import { analyzeCircuitImage } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      mimeType = "image/jpeg",
      boardType,
      knownComponents,
      firmwareCode,
      expectedBehavior,
      actualBehavior,
      errorLogs,
    } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid image (JPEG, PNG, WebP) in base64 format." },
        { status: 400 }
      );
    }

    // Clean data URL prefix if sent
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    const analysis = await analyzeCircuitImage({
      imageBase64: base64Data,
      mimeType,
      boardType,
      knownComponents,
      firmwareCode,
      expectedBehavior,
      actualBehavior,
      errorLogs,
    });

    return NextResponse.json({ ok: true, analysis });
  } catch (error: any) {
    console.error("Circuit Doctor Analysis failed:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to analyze circuit image" },
      { status: 500 }
    );
  }
}
