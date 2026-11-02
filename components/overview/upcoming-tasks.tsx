import Link from "next/link";
import { ArrowRight, CalendarClock, ListTodo, UserRound } from "lucide-react";
import { TASK_STATUS_LABELS } from "@/lib/board";
import { formatShortDate, isPastDate } from "@/lib/format";
import type { UpcomingTask } from "@/lib/overview";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PriorityBadge } from "@/components/board/task-styles";

export function UpcomingTasks({ tasks }: { tasks: UpcomingTask[] }) {
  return (
    <section className="flex flex-col rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold tracking-tight">Upcoming tasks</h2>
        <Link
          href="/dashboard/board"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          View board
          <ArrowRight className="size-4" />
        </Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No open tasks"
          description="Add a task to the board, or open an issue on your repository, and it shows up here."
          action={{ label: "Go to board", href: "/dashboard/board" }}
          className="mx-6 mb-6 flex-1"
        />
      ) : (
        <ul className="divide-y border-t">
          {tasks.map((task) => {
            const overdue = !!task.dueDate && isPastDate(task.dueDate);
            return (
              <li key={task.id} className="flex items-start gap-3 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-heading">{task.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
                    <span className="font-mono">{task.key}</span>
                    <span>{TASK_STATUS_LABELS[task.status]}</span>
                    {task.assignee && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound aria-hidden className="size-3.5" />
                        {task.assignee}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
                        <CalendarClock aria-hidden className="size-3.5" />
                        {overdue ? `Overdue · ${formatShortDate(task.dueDate)}` : formatShortDate(task.dueDate)}
                      </span>
                    )}
                  </p>
                </div>
                <PriorityBadge priority={task.priority} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
