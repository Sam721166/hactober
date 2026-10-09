import { NextRequest, NextResponse } from "next/server";
import { getCatalogueComponents } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const components = await getCatalogueComponents({ category, search });
    return NextResponse.json({ ok: true, components });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
