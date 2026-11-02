import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDbUser, safeRedirect } from "@/lib/auth";
import { GITHUB_SCOPES, GITHUB_STATE_COOKIE } from "@/lib/github";

// Starts linking a GitHub account. `mode=popup` means the flow runs in a popup
// window that reports back to the opener instead of navigating the main tab.
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const returnTo = safeRedirect(request.nextUrl.searchParams.get("returnTo"), "/workspaces/new");

  if (!(await getDbUser())) {
    const signIn = new URL("/sign-in", origin);
    signIn.searchParams.set("next", returnTo);
    return NextResponse.redirect(signIn);
  }

  // Fail before sending the user to GitHub, not after they've approved access.
  const clientId = process.env.GITHUB_CLIENT_ID;
  const missing = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "TOKEN_ENCRYPTION_KEY"].filter((name) => !process.env[name]);
  if (!clientId || missing.length) {
    console.error(`GitHub connect is not configured. Missing: ${missing.join(", ")}`);
    const done = new URL("/github/connected", origin);
    done.searchParams.set("returnTo", returnTo);
    if (request.nextUrl.searchParams.get("mode") === "popup") done.searchParams.set("popup", "1");
    done.searchParams.set("error", "GitHub connection isn't configured on the server yet.");
    return NextResponse.redirect(done);
  }

  const state = randomBytes(24).toString("base64url");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", new URL("/api/github/callback", origin).toString());
  authorize.searchParams.set("scope", GITHUB_SCOPES);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(
    GITHUB_STATE_COOKIE,
    JSON.stringify({ state, returnTo, popup: request.nextUrl.searchParams.get("mode") === "popup" }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/github",
      maxAge: 60 * 10,
    },
  );
  return response;
}
