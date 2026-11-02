"use client";

import { startTransition, useActionState, useEffect, useState, useTransition } from "react";
import { Check, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import {
  AGENT_BUDGET_MAX,
  AGENT_BUDGET_MIN,
  AGENT_DESCRIPTION_MAX,
  AGENT_INSTRUCTIONS_MAX,
  AGENT_SKILLS,
  AGENT_SKILLS_MAX,
  BUDGET_WARNING_RATIO,
  DEFAULT_AGENT_SKILLS,
  MIN_BALANCE_TO_RUN_CENTS,
  nextBudgetReset,
  type AgentSummary,
} from "@/lib/ai-team";
import { formatCents, formatDay, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AGENT_MAX_TURNS_MAX, AGENT_MAX_TURNS_MIN, DEFAULT_MAX_TURNS } from "@/lib/workflow";
import {
  generateInstructionsAction,
  scanWithSwitchAction,
  updateAgentAction,
  type AgentFormState,
} from "@/app/dashboard/ai-team/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AgentAvatar } from "@/components/ai-team/agent-avatar";
import { budgetIndicatorClass, trustLevel } from "@/components/ai-team/agent-styles";
import { TrustGauge } from "@/components/ai-team/trust-gauge";

export function AgentConfigDialog({
  agent,
  repoFullName,
  aiEnabled,
  switchConnected,
  onOpenChange,
}: {
  agent: AgentSummary | null;
  repoFullName: string;
  aiEnabled: boolean;
  switchConnected: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!agent} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        {agent && (
          <AgentConfigForm
            key={agent.id}
            agent={agent}
            repoFullName={repoFullName}
            aiEnabled={aiEnabled}
            switchConnected={switchConnected}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AgentConfigForm({
  agent,
  repoFullName,
  aiEnabled,
  switchConnected,
  onDone,
}: {
  agent: AgentSummary;
  repoFullName: string;
  aiEnabled: boolean;
  switchConnected: boolean;
  onDone: () => void;
}) {
  const [state, dispatch, pending] = useActionState<AgentFormState, FormData>(updateAgentAction, {});
  const [description, setDescription] = useState(agent.description);
  const [instructions, setInstructions] = useState(agent.instructions);
  const [skills, setSkills] = useState<string[]>(agent.skills);
  const [budget, setBudget] = useState(String(agent.budgetCents / 100));
  const [maxTurns, setMaxTurns] = useState(String(agent.maxTurns));
  const [enabled, setEnabled] = useState(agent.enabled);
  const [generating, startGenerating] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Dispatched by hand so React doesn't reset the fields when the server returns an error.
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  function toggleSkill(id: string) {
    setSkills((current) => (current.includes(id) ? current.filter((skill) => skill !== id) : [...current, id]));
  }

  function generate() {
    setAiError(null);
    startGenerating(async () => {
      const result = await generateInstructionsAction({ agentId: agent.id, description, skills }).catch(() => ({
        error: "We couldn't reach the server. Check your connection and try again.",
        instructions: undefined,
      }));
      if (result.instructions) setInstructions(result.instructions);
      else setAiError(result.error ?? "OpenAI didn't return any instructions.");
    });
  }

  const defaults = DEFAULT_AGENT_SKILLS[agent.role] as string[];
  // The role's default skills come first, then the rest of the catalog.
  const orderedSkills = [...AGENT_SKILLS].sort((a, b) => Number(defaults.includes(b.id)) - Number(defaults.includes(a.id)));
  const isDefaultSkills = skills.length === defaults.length && defaults.every((skill) => skills.includes(skill));
  const budgetCents = Math.round(Number(budget) * 100);
  const invalid = (field: AgentFormState["field"]) => state.field === field || undefined;

  return (
    <form onSubmit={submit} noValidate>
      <input type="hidden" name="agentId" value={agent.id} />

      <DialogHeader className="flex-row items-center gap-4 border-b px-6 pt-6 pb-5">
        <AgentAvatar role={agent.role} status={agent.status} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight">Configure {agent.name}</DialogTitle>
          <DialogDescription className="truncate">
            Works on <span className="font-mono text-body">{repoFullName}</span>. Changes apply to its next run.
          </DialogDescription>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-heading">
          <span className="hidden sm:inline">{enabled ? "Active" : "Paused"}</span>
          <Switch name="enabled" checked={enabled} onCheckedChange={setEnabled} aria-label={`${agent.name} active`} />
        </label>
      </DialogHeader>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-5 px-6 py-5">
          {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

          <div className="space-y-2">
            <Label htmlFor="agent-description">Description</Label>
            <Textarea
              id="agent-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={AGENT_DESCRIPTION_MAX}
              placeholder="What this agent is responsible for, in a sentence or two."
              className="min-h-16"
              aria-invalid={invalid("description")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="agent-instructions">Instructions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={!aiEnabled || generating || pending}
                title={aiEnabled ? undefined : "Add OPENAI_API_KEY to enable"}
              >
                {generating ? <Loader2 className="animate-spin" /> : <Sparkles className="text-primary" />}
                {generating ? "Writing…" : "Write with AI"}
              </Button>
            </div>
            <Textarea
              id="agent-instructions"
              name="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={AGENT_INSTRUCTIONS_MAX}
              spellCheck={false}
              disabled={generating}
              className={cn("max-h-80 min-h-48 font-mono text-xs leading-5 text-body", generating && "animate-pulse")}
              aria-invalid={invalid("instructions")}
              aria-describedby="agent-instructions-hint"
            />
            {aiError && <FormAlert tone="error">{aiError}</FormAlert>}
            <p id="agent-instructions-hint" className="flex justify-between gap-3 text-xs text-faint">
              <span>The agent&apos;s system prompt, in Markdown.</span>
              <span className="shrink-0">
                {instructions.trim().length}/{AGENT_INSTRUCTIONS_MAX}
              </span>
            </p>
          </div>

          <fieldset className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-medium">
                Skills <span className="font-normal text-faint">({skills.length} attached)</span>
              </legend>
              {!isDefaultSkills && (
                <Button type="button" variant="ghost" size="xs" onClick={() => setSkills(defaults)}>
                  <RotateCcw />
                  Reset to defaults
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" aria-invalid={invalid("skills")}>
              {orderedSkills.map((skill) => {
                const checked = skills.includes(skill.id);
                return (
                  <label
                    key={skill.id}
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                      checked
                        ? "border-primary bg-brand-tint text-primary"
                        : "bg-card text-body hover:border-brand-accent hover:bg-brand-tint",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill.id}
                      checked={checked}
                      onChange={() => toggleSkill(skill.id)}
                      disabled={!checked && skills.length >= AGENT_SKILLS_MAX}
                      className="sr-only"
                    />
                    {checked && <Check aria-hidden className="size-3.5" />}
                    {skill.label}
                    {defaults.includes(skill.id) && <span className="sr-only"> (default)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="agent-budget">Monthly budget</Label>
              <div className="relative">
                <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle">
                  $
                </span>
                <Input
                  id="agent-budget"
                  name="budget"
                  type="number"
                  inputMode="numeric"
                  min={AGENT_BUDGET_MIN}
                  max={AGENT_BUDGET_MAX}
                  step={1}
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="h-10 pr-16 pl-7"
                  aria-invalid={invalid("budget")}
                  aria-describedby="agent-budget-hint"
                />
                <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">
                  / month
                </span>
              </div>
              <BudgetHint agent={agent} budgetCents={budgetCents} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-max-turns">Max turns</Label>
              <Input
                id="agent-max-turns"
                name="maxTurns"
                type="number"
                inputMode="numeric"
                min={AGENT_MAX_TURNS_MIN}
                max={AGENT_MAX_TURNS_MAX}
                step={1}
                value={maxTurns}
                onChange={(event) => setMaxTurns(event.target.value)}
                className="h-10 sm:w-32"
                aria-invalid={invalid("maxTurns")}
                aria-describedby="agent-max-turns-hint"
              />
              <p id="agent-max-turns-hint" className="text-xs text-faint">
                Model calls it can make per task step, from {AGENT_MAX_TURNS_MIN} to {AGENT_MAX_TURNS_MAX}. Its last turn must hand
                in the work. Default for this role: {DEFAULT_MAX_TURNS[agent.role]}.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4 border-t bg-muted px-6 py-5 lg:border-t-0 lg:border-l">
          <SwitchPanel agent={agent} connected={switchConnected} />
          <SpendingPanel agent={agent} budgetCents={Number.isFinite(budgetCents) && budgetCents > 0 ? budgetCents : agent.budgetCents} />
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t bg-muted px-6 py-4 sm:flex-row sm:justify-end">
        <DialogClose render={<Button type="button" variant="outline" size="lg" className="h-10 px-4" />}>Cancel</DialogClose>
        <Button type="submit" size="lg" className="h-10 px-5" disabled={pending || generating}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// Explains what the budget being typed means for runs, using the same rule as the server's run gate.
function BudgetHint({ agent, budgetCents }: { agent: AgentSummary; budgetCents: number }) {
  const reset = formatDay(nextBudgetReset());
  const valid = Number.isFinite(budgetCents) && budgetCents > 0;
  const blocked = valid && budgetCents - agent.spentCents < MIN_BALANCE_TO_RUN_CENTS;

  let hint = <>Covers model and tool spend. New runs are blocked once it&apos;s used up, until it resets on {reset}.</>;
  if (valid && blocked) {
    hint = (
      <span className="text-destructive">
        {agent.name} has already spent {formatCents(agent.spentCents)} this month, so runs will stay blocked until {reset}.
      </span>
    );
  } else if (valid && agent.status === "over_budget") {
    hint = (
      <span className="text-success">
        This unblocks runs, with {formatCents(budgetCents - agent.spentCents)} left this month.
      </span>
    );
  }

  return (
    <p id="agent-budget-hint" className="text-xs text-faint" aria-live="polite">
      {hint}
    </p>
  );
}

function SwitchPanel({ agent, connected }: { agent: AgentSummary; connected: boolean }) {
  const [starting, startScan] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { status, score, report, scannedAt, stale } = agent.switch;
  const scanning = starting || status === "queued" || status === "running";
  const level = trustLevel(score);

  function scan() {
    setError(null);
    startScan(async () => {
      const result = await scanWithSwitchAction(agent.id).catch(() => ({ error: "We couldn't reach the server. Try again." }));
      if (result.error) setError(result.error);
    });
  }

  return (
    <section aria-labelledby="switch-title" className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h3 id="switch-title" className="text-sm font-semibold tracking-tight">
          Switch Trust score
        </h3>
        {connected && (
          <Button type="button" variant="ghost" size="sm" onClick={scan} disabled={scanning || !agent.enabled}>
            {scanning ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {scanning ? "Scanning…" : "Scan with Switch"}
          </Button>
        )}
      </div>

      {!connected ? (
        <p className="mt-2 text-xs text-subtle">Connect Switch Trust on the AI Team page to red-team this agent and track its cost.</p>
      ) : (
        <>
          {score === null ? (
            <p className="mt-2 text-xs text-subtle" aria-live="polite">
              {status === "queued"
                ? "Starting in the background. You can close this and keep working."
                : status === "running"
                  ? "Switch Trust is attacking this agent in the background. Its score appears here when the scan ends."
                  : "Not scanned yet. Scan with Switch to get this agent's evaluation score."}
            </p>
          ) : (
            <div className={cn("mt-3 flex items-center gap-4 transition-opacity", scanning && "opacity-50")}>
              <TrustGauge score={score} />
              <div className="min-w-0 space-y-0.5">
                <p className={cn("text-sm font-semibold", level.text)}>{level.label}</p>
                <p className="text-xs text-faint" aria-live="polite">
                  {scanning
                    ? "Scanning again in the background…"
                    : scannedAt
                      ? `Scanned ${timeAgo(scannedAt)}${report?.costCents ? ` · cost ${formatCents(report.costCents)}` : ""}`
                      : null}
                </p>
              </div>
            </div>
          )}

          {stale && !scanning && (
            <FormAlert tone="info" className="mt-3 text-xs">
              Changed since the last Switch scan. Scan again to update the score.
            </FormAlert>
          )}
          {(error ?? (status === "failed" || status === "done" ? agent.switch.error : null)) && (
            <FormAlert tone={error || status === "failed" ? "error" : "info"} className="mt-3 text-xs">
              {error ?? agent.switch.error}
            </FormAlert>
          )}
        </>
      )}
    </section>
  );
}

const monthName = new Intl.DateTimeFormat("en", { month: "long" });

function SpendingPanel({ agent, budgetCents }: { agent: AgentSummary; budgetCents: number }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = Math.round((agent.spentCents / now.getDate()) * daysInMonth);
  const ratio = agent.spentCents / budgetCents;

  return (
    <section aria-labelledby="spending-title" className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="spending-title" className="text-sm font-semibold tracking-tight">
          Spending
        </h3>
        <span className="text-xs text-subtle">{monthName.format(now)}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-heading">
        {formatCents(agent.spentCents)}
        <span className="text-sm font-medium text-faint"> / {formatCents(budgetCents, { whole: true })}</span>
      </p>
      <Progress
        value={Math.min(100, ratio * 100)}
        aria-label="Budget used"
        className="mt-2.5 [&_[data-slot=progress-track]]:h-2"
        indicatorClassName={budgetIndicatorClass(ratio)}
      />
      <p className="mt-1.5 text-xs text-subtle">
        {Math.round(ratio * 100)}% used · {agent.runs} {agent.runs === 1 ? "run" : "runs"}
      </p>
      {budgetCents - agent.spentCents < MIN_BALANCE_TO_RUN_CENTS ? (
        <FormAlert tone="error" className="mt-3 text-xs">
          Budget reached. New runs are blocked until {formatDay(nextBudgetReset())}, or until you raise the budget.
        </FormAlert>
      ) : ratio >= BUDGET_WARNING_RATIO ? (
        <p className="mt-2 text-xs text-warning">
          {formatCents(Math.max(0, budgetCents - agent.spentCents))} left. Runs stop when the budget is used up.
        </p>
      ) : (
        projected > budgetCents && (
          <p className="mt-2 text-xs text-warning">On pace for {formatCents(projected)}, over budget by month end.</p>
        )
      )}
    </section>
  );
}
