"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Landing page at the end of the GitHub OAuth flow. In a popup it hands the
// result to the opener and closes; otherwise it navigates back to `returnTo`.
export default function GithubConnectedPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const returnTo = params.get("returnTo") ?? "/workspaces/new";
    const safeReturn = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/workspaces/new";

    if (params.get("popup") && window.opener) {
      window.opener.postMessage({ type: "devcrew:github", error }, window.location.origin);
      window.close();
      return;
    }

    const target = new URL(safeReturn, window.location.origin);
    if (error) target.searchParams.set("github_error", error);
    window.location.replace(target.pathname + target.search);
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex items-center gap-3 text-sm text-subtle">
        <Loader2 className="size-4 animate-spin text-primary" />
        Finishing GitHub connection…
      </div>
    </main>
  );
}
