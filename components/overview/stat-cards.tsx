import { CircleDot, GitPullRequestArrow, Timer, type LucideIcon } from "lucide-react";
import type { OverviewStats } from "@/lib/overview";
import { IconTile, type Tone } from "@/components/dashboard/icon-tile";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function StatCards({ stats }: { stats: OverviewStats }) {
  const cards: { label: string; icon: LucideIcon; tone: Tone; value: number; note: string }[] = [
    {
      label: "Open tasks",
      icon: CircleDot,
      tone: "blue",
      value: stats.openTasks,
      note: `${stats.createdThisWeek} created this week`,
    },
    {
      label: "In progress",
      icon: Timer,
      tone: "amber",
      value: stats.inProgress,
      note: stats.runningRuns > 0 ? `${plural(stats.runningRuns, "run")} in progress` : "No agents working",
    },
    {
      label: "PR ready",
      icon: GitPullRequestArrow,
      tone: "emerald",
      value: stats.openPullRequests,
      note: stats.blockedPullRequests > 0 ? `${stats.blockedPullRequests} blocked from merging` : "Open pull requests",
    },
  ];

  return (
    <section aria-label="Task summary" className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ label, icon: Icon, tone, value, note }) => (
        <div key={label} className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-subtle">{label}</p>
            <IconTile tone={tone} active className="size-10 rounded-xl [&_svg]:size-5">
              <Icon />
            </IconTile>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-heading tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-subtle">{note}</p>
        </div>
      ))}
    </section>
  );
}
