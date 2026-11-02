import {
  CircleCheck,
  CodeXml,
  FlaskConical,
  GitPullRequest,
  MessageSquareText,
  Play,
  ScanEye,
  ScanSearch,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Wallet,
  WalletMinimal,
  type LucideIcon,
} from "lucide-react";
import { AGENT_STATUS_LABELS, BUDGET_WARNING_RATIO, type AgentActivityKind, type AgentRole, type AgentStatus } from "@/lib/ai-team";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/dashboard/icon-tile";

export const ROLE_STYLES: Record<AgentRole, { icon: LucideIcon; tone: Tone }> = {
  analyst: { icon: ScanSearch, tone: "blue" },
  developer: { icon: CodeXml, tone: "violet" },
  reviewer: { icon: ScanEye, tone: "amber" },
  tester: { icon: FlaskConical, tone: "emerald" },
};

export const ACTIVITY_STYLES: Record<AgentActivityKind, { icon: LucideIcon; tone: Tone }> = {
  joined: { icon: UserPlus, tone: "pink" },
  configured: { icon: Settings2, tone: "blue" },
  scan: { icon: ShieldCheck, tone: "emerald" },
  task_started: { icon: Play, tone: "amber" },
  task_completed: { icon: CircleCheck, tone: "emerald" },
  pr_opened: { icon: GitPullRequest, tone: "violet" },
  review: { icon: MessageSquareText, tone: "cyan" },
  test_run: { icon: FlaskConical, tone: "emerald" },
  error: { icon: TriangleAlert, tone: "amber" },
  budget_warning: { icon: WalletMinimal, tone: "amber" },
  budget_reached: { icon: Wallet, tone: "pink" },
};

const STATUS_STYLES: Record<AgentStatus, { dot: string; badge: string }> = {
  working: { dot: "bg-success", badge: "bg-success/10 text-success" },
  idle: { dot: "bg-faint", badge: "bg-muted text-subtle ring-1 ring-border ring-inset" },
  paused: { dot: "bg-warning", badge: "bg-warning/15 text-warning" },
  over_budget: { dot: "bg-destructive", badge: "bg-destructive/10 text-destructive" },
};

export function statusDotClass(status: AgentStatus) {
  return STATUS_STYLES[status].dot;
}

export function StatusBadge({ status, className }: { status: AgentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status].badge,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot, status === "working" && "animate-pulse")} />
      {AGENT_STATUS_LABELS[status]}
    </span>
  );
}

// Text color and label for a trust score.
export function trustLevel(score: number | null) {
  if (score === null) return { label: "Not scanned", text: "text-subtle", fill: "bg-faint" };
  if (score >= 80) return { label: "Trusted", text: "text-success", fill: "bg-success" };
  if (score >= 60) return { label: "Needs attention", text: "text-warning", fill: "bg-warning" };
  return { label: "At risk", text: "text-destructive", fill: "bg-destructive" };
}

// Budget bar color: primary until the warning threshold, then warning, then destructive at 100%.
export function budgetIndicatorClass(ratio: number) {
  return ratio >= 1 ? "bg-destructive" : ratio >= BUDGET_WARNING_RATIO ? "bg-warning" : "bg-primary";
}
