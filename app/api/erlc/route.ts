import { NextResponse } from "next/server";
import { ErlcError, getServer } from "@/lib/erlc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getServer());
  } catch (e) {
    if (e instanceof ErlcError) {
      return NextResponse.json({ error: e.message, retryAfter: e.retryAfter }, { status: e.status === 403 ? 403 : e.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
