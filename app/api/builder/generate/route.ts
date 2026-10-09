import { NextRequest, NextResponse } from "next/server";
import { generateProjectPlan } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, board, budgetInr, experienceLevel, category, availableComponents } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "Please provide a descriptive project idea (at least 3 characters)." },
        { status: 400 }
      );
    }

    const plan = await generateProjectPlan({
      idea: idea.trim(),
      board,
      budgetInr: budgetInr ? parseInt(budgetInr, 10) : undefined,
      experienceLevel,
      category,
      availableComponents,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error: any) {
    console.error("Project Builder generation failed:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate project plan" },
      { status: 500 }
    );
  }
}
