import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // CSRF protection for tRPC mutations
  if (request.nextUrl.pathname.startsWith("/api/trpc")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Only check mutations (POST requests)
    if (request.method === "POST" && origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF: Origin mismatch" },
          { status: 403 }
        );
      }
    }
  }

  // Update Supabase auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
