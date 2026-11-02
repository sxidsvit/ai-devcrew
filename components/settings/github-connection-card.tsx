"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectGithubAction } from "@/app/workspaces/actions";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { GithubAccountRow, type GithubAccount } from "@/components/workspace/github-connect";

const CONNECT_HREF = `/api/github/connect?returnTo=${encodeURIComponent("/dashboard/settings/account")}`;

// The GitHub account that gives agents access to repositories: connect, reconnect or disconnect it.
export function GithubConnectionCard({ account, error }: { account: GithubAccount | null; error?: string }) {
  const router = useRouter();
  const [disconnecting, startDisconnect] = useTransition();

  function disconnect() {
    startDisconnect(async () => {
      await disconnectGithubAction();
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">GitHub</h2>
        <p className="text-sm text-subtle">
          Your AI team reads, branches and opens pull requests with this account. Task runs and issue sync stop while it&apos;s
          disconnected.
        </p>
      </div>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      {account ? (
        <GithubAccountRow account={account} disconnecting={disconnecting} onDisconnect={disconnect} />
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-muted px-3 py-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-card text-heading ring-1 ring-border">
            <GitHubIcon className="size-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-subtle">No GitHub account connected.</p>
          <a href={CONNECT_HREF} className={cn(buttonVariants({ size: "sm" }))}>
            <GitHubIcon />
            Connect GitHub
          </a>
        </div>
      )}
    </section>
  );
}
