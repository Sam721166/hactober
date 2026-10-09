import { NextRequest, NextResponse } from "next/server";
import { saveFirmware } from "@/lib/db";
import { extractPinsFromCode } from "@/lib/analysis/firmware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { filename = "main.ino", content } = body;

    if (typeof content !== "string") {
      return NextResponse.json({ ok: false, error: "Content must be string" }, { status: 400 });
    }

    const extractedPins = extractPinsFromCode(content);
    await saveFirmware(id, filename, content, extractedPins);

    return NextResponse.json({
      ok: true,
      filename,
      extractedPins,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
