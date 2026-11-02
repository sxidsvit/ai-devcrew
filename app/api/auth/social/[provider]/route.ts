import { NextRequest, NextResponse } from "next/server";
import { safeRedirect } from "@/lib/auth";

const PROVIDERS = new Set(["google", "github"]);

// Starts GitHub / Google sign-in. The auth service sends the browser back to
// /auth/callback with the session token in the URL fragment.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ message: "Unsupported provider" }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeRedirect(request.nextUrl.searchParams.get("next")));

  const target = `${process.env.AUTH_URL}/social/${provider}?to=${encodeURIComponent(callback.toString())}`;
  return NextResponse.redirect(target);
}
