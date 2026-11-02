import { NextRequest, NextResponse } from "next/server";

// Optimistic check only: pages still validate the session with getCurrentUser().
export function proxy(request: NextRequest) {
  if (!request.cookies.has("devcrew_session")) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspaces/:path*"],
};
