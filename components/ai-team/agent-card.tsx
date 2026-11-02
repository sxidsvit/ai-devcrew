"use client";

import { History, Loader2, Settings2, ShieldCheck } from "lucide-react";
import { nextBudgetReset, skillLabel, type AgentSummary } from "@/lib/ai-team";
import { formatCents, formatDay, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AgentAvatar } from "@/components/ai-team/agent-avatar";
import { budgetIndicatorClass, StatusBadge, trustLevel } from "@/components/ai-team/agent-styles";

const VISIBLE_SKILLS = 3;

export function AgentCard({
  agent,
  onConfigure,
  onViewActivity,
}: {
  agent: AgentSummary;
  onConfigure: () => void;
  onViewActivity: () => void;
}) {
  const ratio = agent.budgetCents ? agent.spentCents / agent.budgetCents : 0;
  const hiddenSkills = agent.skills.length - VISIBLE_SKILLS;

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-brand-accent/50 hover:shadow-sm",
        !agent.enabled && "bg-muted",
      )}
    >
      <div className="flex items-start gap-3">
        <AgentAvatar role={agent.role} status={agent.status} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight">{agent.name}</h3>
          <p className="truncate text-xs text-subtle">
            {agent.lastActiveAt ? `Active ${timeAgo(agent.lastActiveAt)}` : "No activity yet"}
          </p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <ul aria-label="Skills" className="mt-4 flex flex-wrap gap-1.5">
        {agent.skills.slice(0, VISIBLE_SKILLS).map((skill) => (
          <li key={skill} className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-primary-hover">
            {skillLabel(skill)}
          </li>
        ))}
        {hiddenSkills > 0 && (
          <li className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-subtle ring-1 ring-border ring-inset">
            +{hiddenSkills} more
          </li>
        )}
      </ul>

      <div className="mt-auto space-y-2 pt-5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-subtle">Monthly budget</span>
          <span className="text-subtle">
            <span className="font-medium text-heading">{formatCents(agent.spentCents)}</span> / {formatCents(agent.budgetCents, { whole: true })}
          </span>
        </div>
        <Progress
          value={Math.min(100, ratio * 100)}
          aria-label={`${agent.name} budget used`}
          className="[&_[data-slot=progress-track]]:h-2"
          indicatorClassName={budgetIndicatorClass(ratio)}
        />
        <div className="flex items-center justify-between gap-2 text-xs text-subtle">
          {agent.status === "over_budget" ? (
            <span className="font-medium text-destructive">Runs blocked until {formatDay(nextBudgetReset())}</span>
          ) : (
            <span>{Math.round(ratio * 100)}% used</span>
          )}
          {agent.switch.status === "queued" || agent.switch.status === "running" ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 aria-hidden className="size-3.5 animate-spin text-primary" />
              Switch scanning
            </span>
          ) : (
            <span className="inline-flex items-center gap-1" title="Switch Trust evaluation score">
              <ShieldCheck aria-hidden className={cn("size-3.5", trustLevel(agent.switch.score).text)} />
              Switch trust <span className="font-medium text-heading">{agent.switch.score ?? "–"}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
        <Button variant="outline" size="lg" className="h-9" onClick={onConfigure} aria-label={`Configure ${agent.name}`}>
          <Settings2 data-icon="inline-start" />
          Configure
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-9 text-primary hover:text-primary-hover"
          onClick={onViewActivity}
          aria-label={`View ${agent.name} activity`}
        >
          <History data-icon="inline-start" />
          {/* Four cards share a row on xl screens, so the label gets shorter there. */}
          <span className="xl:hidden">View activity</span>
          <span className="hidden xl:inline">Activity</span>
        </Button>
      </div>
    </article>
  );
}
