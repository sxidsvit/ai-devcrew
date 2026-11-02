import { Bug, CircleDot, SignalHigh, SignalLow, SignalMedium, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import { TASK_PRIORITY_LABELS, TASK_TYPE_LABELS, type TaskPriority, type TaskStatus, type TaskType } from "@/lib/board";
import { cn } from "@/lib/utils";

// Full class strings so Tailwind can see them.
export const TYPE_STYLES: Record<TaskType, { icon: LucideIcon; tile: string; description: string }> = {
  issue: { icon: CircleDot, tile: "bg-tone-blue/12 text-tone-blue", description: "A task or chore" },
  bug: { icon: Bug, tile: "bg-destructive/10 text-destructive", description: "Something is broken" },
  feature: { icon: Sparkles, tile: "bg-tone-violet/12 text-tone-violet", description: "New functionality" },
};

export const PRIORITY_STYLES: Record<TaskPriority, { icon: LucideIcon; badge: string }> = {
  urgent: { icon: TriangleAlert, badge: "bg-destructive/10 text-destructive" },
  high: { icon: SignalHigh, badge: "bg-warning/15 text-warning" },
  medium: { icon: SignalMedium, badge: "bg-brand-tint text-primary-hover" },
  low: { icon: SignalLow, badge: "bg-muted text-subtle ring-1 ring-border ring-inset" },
};

export const COLUMN_STYLES: Record<TaskStatus, { column: string; dot: string }> = {
  todo: { column: "bg-subtle/5 border-subtle/15", dot: "bg-subtle" },
  in_development: { column: "bg-tone-blue/5 border-tone-blue/15", dot: "bg-tone-blue" },
  in_review: { column: "bg-tone-violet/5 border-tone-violet/15", dot: "bg-tone-violet" },
  testing: { column: "bg-tone-amber/6 border-tone-amber/20", dot: "bg-tone-amber" },
  done: { column: "bg-tone-emerald/5 border-tone-emerald/15", dot: "bg-tone-emerald" },
};

export function TaskTypeIcon({ type, className }: { type: TaskType; className?: string }) {
  const { icon: Icon, tile } = TYPE_STYLES[type];
  return (
    <span
      title={TASK_TYPE_LABELS[type]}
      className={cn("flex size-5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5", tile, className)}
    >
      <Icon aria-hidden />
      <span className="sr-only">{TASK_TYPE_LABELS[type]}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { icon: Icon, badge } = PRIORITY_STYLES[priority];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", badge)}>
      <Icon aria-hidden className="size-3.5" />
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
