import { NextRequest, NextResponse } from "next/server";
import { getDebugSessionById, updateDebugSession } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getDebugSessionById(id);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, session });
  } catch (error: any) {
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
    const updated = await updateDebugSession(id, body);
    return NextResponse.json({ ok: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
