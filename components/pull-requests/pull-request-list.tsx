"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, GitBranch, GitMerge, GitPullRequest, GitPullRequestClosed, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PullRequestItem, PullRequestState } from "@/lib/workflow";
import { mergePullRequestAction } from "@/app/dashboard/pull-requests/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

const STATE_STYLES: Record<PullRequestState, { label: string; icon: typeof GitPullRequest; badge: string }> = {
  open: { label: "Open", icon: GitPullRequest, badge: "bg-success/10 text-success" },
  merged: { label: "Merged", icon: GitMerge, badge: "bg-brand-tint text-primary-hover" },
  closed: { label: "Closed", icon: GitPullRequestClosed, badge: "bg-muted text-subtle ring-1 ring-border ring-inset" },
};

export function PullRequestList({ pullRequests }: { pullRequests: PullRequestItem[] }) {
  if (pullRequests.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs">
          <GitPullRequest className="size-5" />
        </span>
        <h2 className="text-base font-semibold tracking-tight">No pull requests yet</h2>
        <p className="max-w-sm text-sm text-subtle">
          When the Tester verifies a task&apos;s branch, its pull request shows up here. Run a Todo task from the board to start.
        </p>
        <Link href="/dashboard/board" className={cn(buttonVariants({ size: "lg" }), "mt-2 h-10 px-4")}>
          Open the board
        </Link>
      </section>
    );
  }

  return (
    <ul className="space-y-3">
      {pullRequests.map((pr) => (
        <PullRequestRow key={pr.id} pr={pr} />
      ))}
    </ul>
  );
}

function PullRequestRow({ pr }: { pr: PullRequestItem }) {
  const [merging, startMerging] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const style = STATE_STYLES[pr.state];

  function merge() {
    setError(null);
    startMerging(async () => {
      const result = await mergePullRequestAction(pr.id).catch(() => ({ error: "We couldn't reach the server. Try again." }));
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className="rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", style.badge)}>
              <style.icon aria-hidden className="size-3.5" />
              {style.label}
            </span>
            <span className="font-mono text-xs text-subtle">#{pr.number}</span>
            {pr.taskKey && <span className="font-mono text-xs text-subtle">{pr.taskKey}</span>}
          </div>
          <h2 className="text-base font-semibold tracking-tight">
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {pr.title}
            </a>
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
            <span className="inline-flex min-w-0 items-center gap-1">
              <GitBranch aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate font-mono text-body">{pr.headBranch}</span>
              <span aria-hidden>→</span>
              <span className="sr-only">into</span>
              <span className="font-mono text-body">{pr.baseBranch}</span>
            </span>
            <span>
              {pr.changedFiles} files · <span className="text-success">+{pr.additions}</span>{" "}
              <span className="text-destructive">−{pr.deletions}</span>
            </span>
            <span>
              {pr.state === "merged" && pr.mergedAt
                ? `Merged ${pr.mergedBy === "auto" ? "automatically " : ""}${timeAgo(pr.mergedAt)}`
                : `Opened ${timeAgo(pr.createdAt)}${pr.openedBy ? ` by ${pr.openedBy}` : ""}`}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <a href={pr.url} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>
            <ExternalLink data-icon="inline-start" />
            Review<span className="hidden sm:inline"> on GitHub</span>
          </a>
          {pr.state === "open" && (
            <Button className="h-9" onClick={merge} disabled={merging}>
              {merging ? <Loader2 className="animate-spin" /> : <GitMerge data-icon="inline-start" />}
              {merging ? "Merging…" : "Merge"}
            </Button>
          )}
        </div>
      </div>

      {(error ?? (pr.state === "open" ? pr.mergeError : null)) && (
        <FormAlert tone="error" className="mt-4">
          {error ?? pr.mergeError}
          {!error && pr.followUpTaskKey && (
            <>
              {" "}
              The Tester filed <span className="font-mono">{pr.followUpTaskKey}</span> in Todo.
            </>
          )}
        </FormAlert>
      )}
    </li>
  );
}
