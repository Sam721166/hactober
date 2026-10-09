import { NextRequest, NextResponse } from "next/server";
import { getProjectById, saveCircuitDesign } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, circuit: project.circuit });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { components, connections } = body;

    if (!Array.isArray(components) || !Array.isArray(connections)) {
      return NextResponse.json(
        { ok: false, error: "Invalid circuit structure. Expected components and connections arrays." },
        { status: 400 }
      );
    }

    const result = await saveCircuitDesign(id, { components, connections });
    return NextResponse.json({ ...result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
