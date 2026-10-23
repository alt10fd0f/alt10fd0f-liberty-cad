import { NextResponse } from "next/server";
import { ErlcError, runCommand } from "@/lib/erlc";

export const dynamic = "force-dynamic";

let lastRun = 0;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const command = typeof body.command === "string" ? body.command.trim() : "";

  if (!command || command.length > 300 || !command.startsWith(":")) {
    return NextResponse.json({ error: "Commands must start with ':' and be under 300 characters." }, { status: 400 });
  }

  // ER:LC allows 1 command per 5s; fail fast instead of burning the limit.
  const wait = lastRun + 5000 - Date.now();
  if (wait > 0) {
    return NextResponse.json({ error: `Wait ${Math.ceil(wait / 1000)}s before the next command.` }, { status: 429 });
  }
  lastRun = Date.now();

  try {
    const result = await runCommand(command);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ErlcError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
