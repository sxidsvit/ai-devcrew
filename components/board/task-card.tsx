"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Check, CircleAlert, GitMerge, GitPullRequest, Loader2, MessageCircleQuestion, MoreHorizontal, Play, Trash2 } from "lucide-react";
import { type BoardTask } from "@/lib/board";
import { formatShortDate, isPastDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { PriorityBadge, TaskTypeIcon } from "@/components/board/task-styles";

type CardActions = {
  onOpen: (taskId: string) => void;
  onRun: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskCard({
  task,
  actions,
  overlay = false,
  className,
}: {
  task: BoardTask;
  actions?: CardActions;
  overlay?: boolean;
  className?: string;
}) {
  const overdue = task.dueDate && task.status !== "done" && isPastDate(task.dueDate);
  const prReady = hasActivePullRequest(task);

  return (
    <article
      className={cn(
        "group/card rounded-xl border bg-card p-3.5 shadow-xs transition-[border-color,box-shadow]",
        overlay ? "rotate-2 cursor-grabbing border-brand-accent/60 shadow-lg ring-3 ring-primary/10" : "hover:border-brand-accent/50 hover:shadow-sm",
        // The AI team finished: its pull request is open or merged.
        prReady && "border-success/40 bg-success/5 hover:border-success/60",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <TaskTypeIcon type={task.type} />
        <span className="font-mono text-xs text-subtle">{task.key}</span>
        {task.github && (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-subtle">
            <GitHubIcon aria-hidden className="size-3" />
            <span className="sr-only">GitHub issue</span>#{task.github.number}
          </span>
        )}
        {task.pullRequest && <PullRequestBadge pullRequest={task.pullRequest} />}
        {task.run !== "running" && <RunNotice task={task} />}
        {actions && (
          <div className="-my-1 ml-auto flex items-center gap-0.5">
            <RunButton task={task} onRun={actions.onRun} />
            <TaskCardMenu task={task} actions={actions} />
          </div>
        )}
      </div>

      <h3 className={cn("mt-2 line-clamp-2 text-sm leading-snug font-medium", task.status === "done" && "text-subtle")}>
        {task.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <PriorityBadge priority={task.priority} />
        {task.estimate !== null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-subtle ring-1 ring-border ring-inset">
            {task.estimate} pt{task.estimate === 1 ? "" : "s"}
          </span>
        )}
        {task.dueDate && (
          <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "font-medium text-destructive" : "text-subtle")}>
            <CalendarDays aria-hidden className="size-3.5" />
            <span className="sr-only">{overdue ? "Overdue, due" : "Due"}</span>
            {formatShortDate(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <span
            title={task.assignee}
            className="ml-auto flex size-6 items-center justify-center rounded-full bg-brand-soft text-[0.625rem] font-semibold text-primary-hover ring-2 ring-card"
          >
            <span aria-hidden>{initials(task.assignee)}</span>
            <span className="sr-only">Assigned to {task.assignee}</span>
          </span>
        )}
      </div>
    </article>
  );
}

// The AI team finished this task: it has an open or merged pull request and no run in progress.
function hasActivePullRequest(task: BoardTask): task is BoardTask & { pullRequest: NonNullable<BoardTask["pullRequest"]> } {
  return !!task.pullRequest && task.pullRequest.state !== "closed" && task.run !== "running";
}

function stopPropagation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

// Keep clicks and keys on the card's controls from dragging or opening the card.
const controlEvents = { onPointerDown: stopPropagation, onKeyDown: stopPropagation };

function PullRequestBadge({ pullRequest }: { pullRequest: NonNullable<BoardTask["pullRequest"]> }) {
  const Icon = pullRequest.state === "merged" ? GitMerge : GitPullRequest;
  return (
    <a
      href={pullRequest.url}
      target="_blank"
      rel="noreferrer"
      {...controlEvents}
      onClick={stopPropagation}
      title={`Pull request #${pullRequest.number} (${pullRequest.state})`}
      className="inline-flex items-center gap-1 rounded-sm font-mono text-xs text-subtle outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <Icon aria-hidden className={cn("size-3", pullRequest.state === "merged" ? "text-tone-violet" : pullRequest.state === "open" && "text-success")} />
      <span className="sr-only">Pull request</span>#{pullRequest.number}
    </a>
  );
}

// Why the last run stopped short: it failed, or the Analyst has a question.
function RunNotice({ task }: { task: BoardTask }) {
  const run = task.latestRun;
  if (!run || (run.status !== "failed" && run.status !== "needs_input")) return null;
  const needsInput = run.status === "needs_input";
  const Icon = needsInput ? MessageCircleQuestion : CircleAlert;
  return (
    <span title={run.note ?? undefined} className={cn("inline-flex", needsInput ? "text-warning" : "text-destructive")}>
      <Icon aria-hidden className="size-3.5" />
      <span className="sr-only">{needsInput ? "The Analyst needs input" : "The last run failed"}</span>
    </span>
  );
}

function RunButton({ task, onRun }: { task: BoardTask; onRun: (taskId: string) => void }) {
  if (task.run === "running") {
    const who = task.assignee ?? "The AI team";
    return (
      <span
        role="status"
        title={`${who} is working on this task`}
        className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success"
      >
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
        <span className="sr-only">
          {who} is working on {task.key}
        </span>
      </span>
    );
  }

  if (hasActivePullRequest(task)) {
    const { number, url, state } = task.pullRequest;
    const label = `Pull request #${number} ${state === "merged" ? "merged" : "opened"}`;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        {...controlEvents}
        onClick={stopPropagation}
        aria-label={`${label} for ${task.key}`}
        title={label}
        className="flex size-6 items-center justify-center rounded-full bg-success text-success-foreground outline-none hover:bg-success/90 focus-visible:ring-3 focus-visible:ring-success/40"
      >
        <Check aria-hidden className="size-3.5" strokeWidth={3} />
      </a>
    );
  }

  return (
    <Button
      size="icon-xs"
      aria-label={`Run ${task.key} with the AI team`}
      title="Run with the AI team"
      className="rounded-full bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/40"
      {...controlEvents}
      onClick={(event) => {
        event.stopPropagation();
        onRun(task.id);
      }}
    >
      <Play className="fill-current" />
    </Button>
  );
}

function TaskCardMenu({ task, actions }: { task: BoardTask; actions: CardActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Actions for ${task.key}`}
            className="text-faint hover:text-heading aria-expanded:text-heading"
            {...controlEvents}
            onClick={stopPropagation}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      {/* React events bubble out of the portal to the card, so stop them here too. */}
      <DropdownMenuContent align="end" className="w-40" onClick={stopPropagation} onKeyDown={stopPropagation}>
        {hasActivePullRequest(task) ? (
          <DropdownMenuItem onClick={() => window.open(task.pullRequest.url, "_blank", "noopener,noreferrer")}>
            <Check className="text-success" />
            View pull request
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={task.run === "running"} onClick={() => actions.onRun(task.id)}>
            <Play className="text-success" />
            {task.run === "running" ? "Running…" : "Run"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(task.id)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SortableTaskCard({ task, actions }: { task: BoardTask; actions: CardActions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => actions.onOpen(task.id)}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event);
        // Space picks the card up (see the board's KeyboardSensor); Enter opens it.
        if (event.key === "Enter" && event.target === event.currentTarget) actions.onOpen(task.id);
      }}
      aria-label={`${task.key}: ${task.title}`}
      className="cursor-grab rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <TaskCard
        task={task}
        actions={actions}
        className={cn(isDragging && "border-dashed border-brand-accent/50 bg-brand-tint/50 opacity-50 shadow-none")}
      />
    </div>
  );
}
