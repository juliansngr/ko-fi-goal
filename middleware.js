import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/_next", "/favicon.ico"];
const PROTECTED_PATHS = ["/goal", "/api/goal", "/"];

export function middleware(req) {
  // Nur schützen, wenn Pfad gematcht wird
  const { pathname } = req.nextUrl;
  if (!PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // HTTP-Basic aus Header extrahieren
  const auth = req.headers.get("authorization") ?? "";
  const [, encoded] = auth.split(" "); // ["Basic", "xxxxx"]
  if (encoded) {
    const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
    if (user === process.env.AUTH_USER && pass === process.env.AUTH_PASS) {
      return NextResponse.next();
    }
  }

  // 401 & WWW-Authenticate, wenn keine oder falsche Credentials
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Protected Area"' },
  });
}

// Auf welche Routen die Middleware angewendet wird
export const config = {
  matcher: ["/goal", "/api/goal", "/"],
};
