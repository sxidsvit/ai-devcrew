"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/auth/provider-icons";

export type GithubAccount = { login: string; avatarUrl: string | null };

export function GithubConnectPrompt({ connecting, onConnect }: { connecting: boolean; onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-muted px-6 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-card text-heading ring-1 ring-border">
        <GitHubIcon className="size-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">Connect your GitHub account</h3>
      <p className="mt-1 max-w-sm text-sm text-subtle">
        DevCrew agents need access to the repository they work on. You can pick it right after connecting.
      </p>
      <Button type="button" size="lg" className="mt-5 px-4" onClick={onConnect} disabled={connecting}>
        {connecting ? <Loader2 className="animate-spin" /> : <GitHubIcon />}
        {connecting ? "Waiting for GitHub…" : "Connect GitHub"}
      </Button>
    </div>
  );
}

export function GithubAccountRow({
  account,
  disconnecting,
  onDisconnect,
}: {
  account: GithubAccount;
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      {account.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={account.avatarUrl} alt="" className="size-8 rounded-full" />
      ) : (
        <GitHubIcon className="size-8 text-heading" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">@{account.login}</p>
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="size-1.5 rounded-full bg-success" />
          GitHub connected
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onDisconnect} disabled={disconnecting}>
        {disconnecting && <Loader2 className="animate-spin" />}
        Disconnect
      </Button>
    </div>
  );
}
