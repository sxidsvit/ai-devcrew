import { Bot, ShieldCheck, Wallet } from "lucide-react";
import type { AgentSummary } from "@/lib/ai-team";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { IconTile, type Tone } from "@/components/dashboard/icon-tile";
import { budgetIndicatorClass, trustLevel } from "@/components/ai-team/agent-styles";

const monthName = new Intl.DateTimeFormat("en", { month: "long" });

export function TeamStats({ agents }: { agents: AgentSummary[] }) {
  // Over-budget agents are enabled but can't run, so they don't count as active.
  const active = agents.filter((agent) => agent.status === "working" || agent.status === "idle");
  const paused = agents.filter((agent) => agent.status === "paused").length;
  const overBudget = agents.filter((agent) => agent.status === "over_budget").length;
  const working = agents.filter((agent) => agent.status === "working").length;

  const scoreOf = (agent: AgentSummary) => agent.switch.score;
  const scored = agents.filter((agent) => scoreOf(agent) !== null);
  const trust = scored.length ? Math.round(scored.reduce((sum, agent) => sum + (scoreOf(agent) ?? 0), 0) / scored.length) : null;
  const lowest = scored.reduce<AgentSummary | null>(
    (low, agent) => (!low || (scoreOf(agent) ?? 0) < (scoreOf(low) ?? 0) ? agent : low),
    null,
  );
  const level = trustLevel(trust);

  const spent = agents.reduce((sum, agent) => sum + agent.spentCents, 0);
  const budget = agents.reduce((sum, agent) => sum + agent.budgetCents, 0);
  const ratio = budget ? spent / budget : 0;

  return (
    <section aria-label="AI team summary" className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Active agents" icon={<Bot />} tone="pink">
        <p className="mt-3 text-3xl font-semibold tracking-tight text-heading">
          {active.length}
          <span className="text-base font-medium text-faint"> / {agents.length}</span>
        </p>
        <p className="mt-1 text-xs text-subtle">
          {working > 0 ? `${working} working now` : "None working right now"}
          {paused > 0 && ` · ${paused} paused`}
          {overBudget > 0 && <span className="text-destructive"> · {overBudget} over budget</span>}
        </p>
      </StatCard>

      <StatCard label="Switch trust score" icon={<ShieldCheck />} tone="emerald">
        <p className="mt-3 text-3xl font-semibold tracking-tight text-heading">
          {trust ?? "–"}
          <span className="text-base font-medium text-faint"> / 100</span>
        </p>
        <p className="mt-1 text-xs text-subtle">
          <span className={cn("font-medium", level.text)}>{level.label}</span>
          {lowest && scored.length > 1 && ` · lowest: ${lowest.name} (${scoreOf(lowest)})`}
        </p>
      </StatCard>

      <StatCard label="Monthly spending" icon={<Wallet />} tone="violet">
        <p className="mt-3 text-3xl font-semibold tracking-tight text-heading">{formatCents(spent)}</p>
        <Progress
          value={Math.min(100, ratio * 100)}
          aria-label="Share of the team's monthly budget spent"
          className="mt-2.5 [&_[data-slot=progress-track]]:h-1.5"
          indicatorClassName={budgetIndicatorClass(ratio)}
        />
        <p className="mt-2 text-xs text-subtle">
          {Math.round(ratio * 100)}% of {formatCents(budget, { whole: true })} budget in {monthName.format(new Date())}
        </p>
      </StatCard>
    </section>
  );
}

function StatCard({ label, icon, tone, children }: { label: string; icon: React.ReactNode; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-subtle">{label}</p>
        <IconTile tone={tone} active className="size-10 rounded-xl [&_svg]:size-5">
          {icon}
        </IconTile>
      </div>
      {children}
    </div>
  );
}
