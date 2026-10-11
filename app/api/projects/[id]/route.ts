import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject } from "@/lib/db";

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

    return NextResponse.json({ ok: true, project });
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateProject(id, body);
    return NextResponse.json({ ok: true, project: updated });
  } catch (error: any) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ ok: true, id });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
