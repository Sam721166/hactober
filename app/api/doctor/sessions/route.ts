import { NextRequest, NextResponse } from "next/server";
import { getDebugSessions, createDebugSession } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const sessions = await getDebugSessions(projectId);
    return NextResponse.json({ ok: true, sessions });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await createDebugSession(body);
    return NextResponse.json({ ok: true, session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
