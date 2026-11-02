"use client";

import { startTransition, useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, GitBranch, Loader2 } from "lucide-react";
import {
  createWorkspaceAction,
  disconnectGithubAction,
  type CreateWorkspaceState,
} from "@/app/workspaces/actions";
import type { GithubRepo } from "@/lib/github";
import { MAX_LOGO_BYTES, WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from "@/lib/workspace-limits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GithubAccountRow, GithubConnectPrompt, type GithubAccount } from "@/components/workspace/github-connect";
import { IconPicker } from "@/components/workspace/icon-picker";
import { RepoPicker } from "@/components/workspace/repo-picker";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { DEFAULT_WORKSPACE_ICON, isWorkspaceIcon, type WorkspaceIconKey } from "@/components/workspace/workspace-icons";

const RETURN_TO = "/workspaces/new";
// Name and icon survive the full-page GitHub redirect used when popups are blocked.
const DRAFT_KEY = "devcrew:new-workspace-draft";

export function CreateWorkspaceForm({
  githubAccount,
  githubError,
}: {
  githubAccount: GithubAccount | null;
  githubError?: string;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<CreateWorkspaceState, FormData>(createWorkspaceAction, {});

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<WorkspaceIconKey>(DEFAULT_WORKSPACE_ICON);
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [repo, setRepo] = useState<GithubRepo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(githubError ?? null);
  const [disconnecting, startDisconnect] = useTransition();
  const popupTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
      sessionStorage.removeItem(DRAFT_KEY);
      if (typeof draft?.name === "string") setName(draft.name);
      if (isWorkspaceIcon(draft?.icon)) setIcon(draft.icon);
    } catch {
      // Storage can be unavailable (private mode); the draft is a convenience only.
    }
  }, []);

  useEffect(() => () => {
    if (logo) URL.revokeObjectURL(logo.url);
  }, [logo]);

  // The GitHub popup reports back through /github/connected.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "devcrew:github") return;
      setConnecting(false);
      if (event.data.error) setConnectError(event.data.error);
      else {
        setConnectError(null);
        router.refresh();
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (popupTimer.current) window.clearInterval(popupTimer.current);
    };
  }, [router]);

  function connectGithub() {
    setConnectError(null);
    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      `/api/github/connect?mode=popup&returnTo=${encodeURIComponent(RETURN_TO)}`,
      "devcrew-github",
      `popup,width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, icon }));
      } catch {}
      window.location.href = `/api/github/connect?returnTo=${encodeURIComponent(RETURN_TO)}`;
      return;
    }

    setConnecting(true);
    if (popupTimer.current) window.clearInterval(popupTimer.current);
    popupTimer.current = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(popupTimer.current!);
      setConnecting(false);
    }, 500);
  }

  function disconnectGithub() {
    startDisconnect(async () => {
      await disconnectGithubAction();
      setRepo(null);
      router.refresh();
    });
  }

  const handleReconnectNeeded = useCallback(() => {
    setRepo(null);
    router.refresh();
  }, [router]);

  function changeLogo(file: File | null) {
    setLogoError(null);
    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return setLogoError("Logo must be a PNG, JPG or WebP image.");
    }
    if (file && file.size > MAX_LOGO_BYTES) return setLogoError("Logo must be 1 MB or smaller.");
    setLogo(file ? { file, url: URL.createObjectURL(file) } : null);
  }

  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= WORKSPACE_NAME_MIN && trimmedName.length <= WORKSPACE_NAME_MAX;
  const canSubmit = nameValid && !!githubAccount && !!repo && !pending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !repo) return;
    // Built by hand so React doesn't reset the form (and the picked logo) after the action.
    const data = new FormData();
    data.set("name", trimmedName);
    data.set("icon", icon);
    data.set("repoId", String(repo.id));
    if (logo) data.set("logo", logo.file);
    startTransition(() => dispatch(data));
  }

  const steps = [
    { label: "Workspace details", done: nameValid },
    { label: "Connect GitHub", done: !!githubAccount },
    { label: "Select repository", done: !!repo },
  ];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                step.done ? "bg-primary text-primary-foreground" : "bg-card text-subtle ring-1 ring-border",
              )}
            >
              {step.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("font-medium", step.done ? "text-heading" : "text-subtle")}>{step.label}</span>
            {i < steps.length - 1 && <span aria-hidden className="ml-1 hidden h-px w-8 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

      <section className="rounded-2xl border bg-card p-6 shadow-xs">
        <SectionHeading step={1} title="Workspace details" description="Give your workspace a name and an identity." />
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-2 sm:w-28">
            <WorkspaceAvatar icon={icon} logoUrl={logo?.url} size="lg" />
            <p className="max-w-28 truncate text-center text-xs font-medium text-subtle">{trimmedName || "Your workspace"}</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Acme Web App"
                maxLength={WORKSPACE_NAME_MAX}
                autoComplete="off"
                aria-invalid={state.field === "name" || undefined}
                autoFocus
              />
              <p className="flex justify-between text-xs text-faint">
                <span>Usually your product or project name.</span>
                <span>
                  {trimmedName.length}/{WORKSPACE_NAME_MAX}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker icon={icon} logoPreview={logo?.url ?? null} onIconChange={setIcon} onLogoChange={changeLogo} />
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-xs">
        <SectionHeading
          step={2}
          title="GitHub repository"
          description="Each workspace is linked to one repository. AI agents work on this project."
        />
        <div className="mt-6 space-y-4">
          {connectError && <FormAlert tone="error">{connectError}</FormAlert>}
          {githubAccount ? (
            <>
              <GithubAccountRow account={githubAccount} disconnecting={disconnecting} onDisconnect={disconnectGithub} />
              <RepoPicker
                login={githubAccount.login}
                selectedId={repo?.id ?? null}
                onSelect={setRepo}
                onReconnectNeeded={handleReconnectNeeded}
              />
              {repo && (
                <p className="flex items-center gap-1.5 text-xs text-subtle">
                  <GitBranch className="size-3.5" />
                  Agents will branch from <span className="font-mono text-body">{repo.defaultBranch}</span> in{" "}
                  <span className="font-medium text-heading">{repo.fullName}</span>
                </p>
              )}
            </>
          ) : (
            <GithubConnectPrompt connecting={connecting} onConnect={connectGithub} />
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {!canSubmit && !pending && (
          <p className="text-xs text-faint">
            {!nameValid ? "Name your workspace to continue." : !githubAccount ? "Connect GitHub to continue." : "Select a repository to continue."}
          </p>
        )}
        <Button type="submit" size="lg" className="h-10 px-5" disabled={!canSubmit}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? "Creating workspace…" : "Next"}
          {!pending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </div>
    </form>
  );
}

function SectionHeading({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-xs font-semibold text-primary">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-subtle">{description}</p>
      </div>
    </div>
  );
}
