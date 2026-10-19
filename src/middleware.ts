import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;

  // Auth disabled when SESSION_SECRET is not configured (local dev)
  if (!secret) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  const expected = await createSessionToken(secret);

  if (token !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.webmanifest).*)",
  ],
};
