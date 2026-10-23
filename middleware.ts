import { NextRequest, NextResponse } from "next/server";

// Simple password gate so nobody can see your server data or run commands.
// Replace with Discord OAuth + roles for a multi-user setup.
export function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("DASHBOARD_PASSWORD is not set.", { status: 503 });
    }
    return NextResponse.next();
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === password) return NextResponse.next();
    } catch {
      /* fall through */
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Liberty CAD"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
