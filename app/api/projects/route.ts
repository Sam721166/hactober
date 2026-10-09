import { NextRequest, NextResponse } from "next/server";
import { getProjects, createProject } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const board = searchParams.get("board") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const search = searchParams.get("search") || undefined;
    const isSampleParam = searchParams.get("isSample");
    const isSample = isSampleParam !== null ? isSampleParam === "true" : undefined;

    const projects = await getProjects({
      category,
      board,
      difficulty,
      search,
      isSample,
    });

    return NextResponse.json({ ok: true, projects });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.description || !body.board) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: title, description, board" },
        { status: 400 }
      );
    }

    const project = await createProject(body);
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
