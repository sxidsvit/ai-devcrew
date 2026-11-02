"use client";

import { useEffect, useState, useTransition } from "react";
import { History, Loader2 } from "lucide-react";
import { nextBudgetReset, type AgentActivityItem, type AgentSummary } from "@/lib/ai-team";
import { formatCents, formatDay, timeAgo } from "@/lib/format";
import { addSampleActivityAction, getAgentActivityAction } from "@/app/dashboard/ai-team/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IconTile } from "@/components/dashboard/icon-tile";
import { AgentAvatar } from "@/components/ai-team/agent-avatar";
import { ACTIVITY_STYLES, StatusBadge } from "@/components/ai-team/agent-styles";

export function AgentActivitySheet({ agent, onOpenChange }: { agent: AgentSummary | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!agent} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">{agent && <ActivityPanel key={agent.id} agent={agent} />}</SheetContent>
    </Sheet>
  );
}

function ActivityPanel({ agent }: { agent: AgentSummary }) {
  const [activity, setActivity] = useState<AgentActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, startSeeding] = useTransition();

  // Reload whenever the agent records something new, for example after a scan or a save.
  useEffect(() => {
    let cancelled = false;
    getAgentActivityAction(agent.id)
      .then((result) => {
        if (cancelled) return;
        setActivity(result.activity ?? []);
        setError(result.error ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load this agent's activity. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [agent.id, agent.lastActiveAt]);

  function addSamples() {
    setError(null);
    startSeeding(async () => {
      const result = await addSampleActivityAction().catch(() => ({ error: "We couldn't add sample activity. Try again." }));
      if (result.error) setError(result.error);
    });
  }

  const ratio = agent.budgetCents ? agent.spentCents / agent.budgetCents : 0;
  const hasRuns = activity?.some((item) => item.costCents > 0);

  return (
    <>
      <SheetHeader className="gap-4 border-b px-6 pt-6 pb-5">
        <div className="flex items-center gap-3 pr-8">
          <AgentAvatar role={agent.role} status={agent.status} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <SheetTitle className="text-lg font-semibold tracking-tight">{agent.name} activity</SheetTitle>
            <SheetDescription>Everything {agent.name} did, newest first.</SheetDescription>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={agent.status} />
          <span className="text-xs text-subtle">
            {agent.lastActiveAt ? `Last active ${timeAgo(agent.lastActiveAt)}` : "No activity yet"}
          </span>
        </div>
        <dl className="grid grid-cols-3 divide-x rounded-xl border bg-muted">
          <Summary label="Spent" value={formatCents(agent.spentCents)} />
          <Summary label="Runs" value={String(agent.runs)} />
          <Summary label="Budget used" value={`${Math.round(ratio * 100)}%`} />
        </dl>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && <FormAlert tone="error" className="mb-4">{error}</FormAlert>}
        {agent.status === "over_budget" && (
          <FormAlert tone="error" className="mb-4">
            Budget reached. {agent.name} won&apos;t start new runs until {formatDay(nextBudgetReset())}, or until you raise its
            budget in Configure.
          </FormAlert>
        )}

        {activity === null && !error ? (
          <ActivitySkeleton />
        ) : activity && activity.length > 0 ? (
          <ol aria-label={`${agent.name} activity`} className="relative space-y-5">
            {/* The timeline's spine, behind the icons. */}
            <span aria-hidden className="absolute top-2 bottom-2 left-4 w-px bg-border" />
            {activity.map((item) => {
              const { icon: Icon, tone } = ACTIVITY_STYLES[item.kind];
              return (
                <li key={item.id} className="relative flex gap-3">
                  {/* Opaque backing so the spine doesn't show through the soft tile. */}
                  <span className="h-fit rounded-lg bg-popover ring-4 ring-popover">
                    <IconTile tone={tone} className="[&_svg]:size-4">
                      <Icon />
                    </IconTile>
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-heading">{item.title}</p>
                      {item.costCents > 0 && (
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-body ring-1 ring-border ring-inset">
                          {formatCents(item.costCents)}
                        </span>
                      )}
                    </div>
                    {item.detail && <p className="mt-0.5 text-sm text-subtle">{item.detail}</p>}
                    <time dateTime={item.createdAt} className="mt-1 block text-xs text-faint">
                      {timeAgo(item.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        {activity && !hasRuns && (
          <section className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted px-6 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs">
              <History className="size-5" />
            </span>
            <h3 className="text-base font-semibold tracking-tight">No runs yet</h3>
            <p className="max-w-xs text-sm text-subtle">
              {agent.name} hasn&apos;t worked on a task yet. Add sample activity to see how runs and spending show up here.
            </p>
            <Button variant="outline" size="lg" className="mt-1 h-10 px-4" onClick={addSamples} disabled={seeding}>
              {seeding && <Loader2 className="animate-spin" />}
              {seeding ? "Adding samples…" : "Add sample activity"}
            </Button>
          </section>
        )}
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-heading tabular-nums">{value}</dd>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading activity" className="space-y-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <div className="size-8 shrink-0 animate-pulse rounded-lg bg-border" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-border" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}
