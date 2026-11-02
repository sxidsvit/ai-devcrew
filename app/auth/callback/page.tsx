"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { completeSocialSignIn } from "@/app/(auth)/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = new URLSearchParams(window.location.search).get("next") ?? undefined;
    const token = hash.get("token");
    const providerError = hash.get("error");
    // Drop the token from the address bar and history right away.
    window.history.replaceState(null, "", window.location.pathname);

    if (providerError || !token) {
      setError(
        providerError === "access_denied"
          ? "Sign-in was cancelled."
          : "We couldn't complete sign-in with that provider. Please try again.",
      );
      return;
    }

    completeSocialSignIn(token, next).then((result) => {
      if ("redirectTo" in result) router.replace(result.redirectTo);
      else setError(result.error);
    });
  }, [router]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-8 text-center shadow-sm">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Sign-in failed</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
            <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 size-7 animate-spin text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight">Signing you in…</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">This only takes a moment.</p>
          </>
        )}
      </div>
    </main>
  );
}
