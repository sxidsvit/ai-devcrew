import { NextRequest, NextResponse } from "next/server";
import { db, githubConnections } from "@/db";
import { getDbUser, safeRedirect } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { githubFetch, GITHUB_STATE_COOKIE } from "@/lib/github";

type OAuthState = { state: string; returnTo: string; popup: boolean };

function readState(raw: string | undefined): OAuthState | null {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return typeof parsed?.state === "string" ? parsed : null;
  } catch {
    return null;
  }
}

// GitHub redirects here after the user approves (or cancels) access.
export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const saved = readState(request.cookies.get(GITHUB_STATE_COOKIE)?.value);

  const finish = (error?: string) => {
    // /github/connected hands the result to the opener window, or navigates back.
    const done = new URL("/github/connected", origin);
    done.searchParams.set("returnTo", safeRedirect(saved?.returnTo, "/workspaces/new"));
    if (saved?.popup) done.searchParams.set("popup", "1");
    if (error) done.searchParams.set("error", error);
    const response = NextResponse.redirect(done);
    response.cookies.delete({ name: GITHUB_STATE_COOKIE, path: "/api/github" });
    return response;
  };

  if (params.get("error")) {
    return finish(params.get("error") === "access_denied" ? "GitHub access was cancelled." : "GitHub sign-in failed.");
  }
  if (!saved || saved.state !== params.get("state") || !params.get("code")) {
    return finish("This GitHub connection link expired. Please try again.");
  }

  const user = await getDbUser();
  if (!user) return finish("Your session ended. Sign in and try again.");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: params.get("code"),
      redirect_uri: new URL("/api/github/callback", origin).toString(),
    }),
    cache: "no-store",
  }).catch(() => null);
  const token = (await tokenRes?.json().catch(() => null)) as
    | { access_token?: string; scope?: string; error?: string; error_description?: string }
    | null;
  if (!token?.access_token) {
    // e.g. bad_verification_code, incorrect_client_credentials, redirect_uri_mismatch
    console.error("GitHub token exchange failed", token?.error, token?.error_description);
    return finish("We couldn't connect your GitHub account. Please try again.");
  }

  const account = await githubFetch<{ id: number; login: string; avatar_url: string }>(
    token.access_token,
    "/user",
  ).catch(() => null);
  if (!account) return finish("We couldn't read your GitHub profile. Please try again.");

  try {
    const values = {
      githubUserId: account.id,
      login: account.login,
      avatarUrl: account.avatar_url,
      accessToken: encrypt(token.access_token),
      scope: token.scope ?? null,
      updatedAt: new Date(),
    };
    await db
      .insert(githubConnections)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: githubConnections.userId, set: values });
  } catch (error) {
    console.error("Saving GitHub connection failed", error);
    return finish("We couldn't save your GitHub connection. Please try again.");
  }

  return finish();
}
