import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-process rate limiter for API routes.
 *
 * Uses a sliding-window counter stored in a module-level Map.
 * This is sufficient for single-instance deployments (Vercel serverless
 * functions share memory within a single invocation). For multi-instance
 * or high-traffic deployments, replace with a Redis-backed solution like
 * @upstash/ratelimit.
 *
 * Limits:
 *   - /api/reservations  (POST) — 10 req / 60 s per IP  (booking form)
 *   - /api/*             (all)  — 60 req / 60 s per IP  (general API)
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) {
    return true;
  }

  return false;
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const ip = getIP(req);

  // Stricter limit for reservation creation (public-facing booking form)
  if (pathname.startsWith("/api/reservations") && method === "POST") {
    const key = `reservations:${ip}`;
    if (isRateLimited(key, 10, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many reservation requests. Please try again in a minute." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  } else if (pathname.startsWith("/api/contact-messages") && method === "POST") {
    const key = `contact:${ip}`;
    if (isRateLimited(key, 5, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many contact requests. Please try again in a minute." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  return NextResponse.next();
}

// Only run middleware on the two public-facing write endpoints that need rate limiting.
// All other API routes (Payload auth, preferences, admin panel, etc.) are untouched.
export const config = {
  matcher: [
    "/api/reservations/:path*",
    "/api/contact-messages/:path*",
  ],
};
