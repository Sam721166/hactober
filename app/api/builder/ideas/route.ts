import { NextRequest, NextResponse } from "next/server";
import { generateProjectIdeas } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interests, budgetInr, board, experienceLevel } = body;

    const ideas = await generateProjectIdeas({
      interests,
      budgetInr: budgetInr ? parseInt(budgetInr, 10) : undefined,
      board,
      experienceLevel,
    });

    return NextResponse.json({ ok: true, ideas });
  } catch (error: any) {
    console.error("AI Idea Generator failed:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate project ideas" },
      { status: 500 }
    );
  }
}
