"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Globe, Lock, RefreshCw, Search } from "lucide-react";
import type { GithubRepo } from "@/lib/github";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; repos: GithubRepo[] };

export function RepoPicker({
  login,
  selectedId,
  onSelect,
  onReconnectNeeded,
}: {
  login: string;
  selectedId: number | null;
  onSelect: (repo: GithubRepo) => void;
  onReconnectNeeded: () => void;
}) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github/repos")
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (body.reconnect) return onReconnectNeeded();
        if (!res.ok) return setLoad({ status: "error", message: body.error ?? "Couldn't load repositories." });
        setLoad({ status: "ready", repos: body.repos });
      })
      .catch(() => !cancelled && setLoad({ status: "error", message: "Couldn't reach the server. Check your connection." }));
    return () => {
      cancelled = true;
    };
  }, [login, attempt, onReconnectNeeded]);

  const filtered = useMemo(() => {
    if (load.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    return q ? load.repos.filter((repo) => repo.fullName.toLowerCase().includes(q)) : load.repos;
  }, [load, query]);

  if (load.status === "error") {
    return (
      <FormAlert tone="error">
        <div className="flex items-center justify-between gap-3">
          {load.message}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoad({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            <RefreshCw />
            Retry
          </Button>
        </div>
      </FormAlert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input
          type="search"
          placeholder="Search repositories"
          aria-label="Search repositories"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
          disabled={load.status === "loading"}
        />
      </div>

      <div role="radiogroup" aria-label="Repository" className="max-h-80 divide-y overflow-y-auto rounded-xl border bg-card">
        {load.status === "loading" &&
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="size-4 animate-pulse rounded bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/5 animate-pulse rounded bg-border" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}

        {load.status === "ready" && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-subtle">
            {load.repos.length === 0 ? "This GitHub account has no repositories yet." : "No repositories match your search."}
          </p>
        )}

        {filtered.map((repo) => {
          const selected = repo.id === selectedId;
          const Visibility = repo.private ? Lock : Globe;
          return (
            <button
              key={repo.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(repo)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-brand-tint focus-visible:bg-brand-tint",
                selected && "bg-brand-tint",
              )}
            >
              <Visibility className="mt-0.5 size-4 shrink-0 text-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-body">
                  {repo.owner}/<span className="font-semibold text-heading">{repo.name}</span>
                </p>
                {repo.description && <p className="mt-0.5 truncate text-xs text-subtle">{repo.description}</p>}
                <p className="mt-1 flex items-center gap-2 text-xs text-faint">
                  {repo.language && <span>{repo.language}</span>}
                  {repo.language && <span aria-hidden>·</span>}
                  <span>Updated {timeAgo(repo.updatedAt)}</span>
                </p>
              </div>
              {repo.private && (
                <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-subtle">Private</span>
              )}
              <CheckCircle2
                className={cn("mt-0.5 size-5 shrink-0 text-primary transition-opacity", selected ? "opacity-100" : "opacity-0")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
