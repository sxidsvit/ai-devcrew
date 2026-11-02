"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { TASK_STATUS_LABELS, type BoardTask, type TaskStatus } from "@/lib/board";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COLUMN_STYLES } from "@/components/board/task-styles";
import { SortableTaskCard } from "@/components/board/task-card";

export function BoardColumn({
  status,
  tasks,
  total,
  highlighted,
  filtered,
  onAdd,
  onOpen,
  onRun,
  onDelete,
}: {
  status: TaskStatus;
  // The cards shown, after search and filters
  tasks: BoardTask[];
  // Every card in the column, for the count
  total: number;
  highlighted: boolean;
  filtered: boolean;
  onAdd: (status: TaskStatus) => void;
  onOpen: (taskId: string) => void;
  onRun: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const styles = COLUMN_STYLES[status];
  const label = TASK_STATUS_LABELS[status];
  const headingId = `board-column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex w-70 shrink-0 snap-start flex-col rounded-2xl border transition-shadow xl:w-auto xl:min-w-54 xl:flex-1",
        styles.column,
        highlighted && "ring-3 ring-primary/15",
      )}
    >
      <header className="flex items-center gap-2 px-3.5 pt-3.5 pb-2.5">
        <span aria-hidden className={cn("size-2 rounded-full", styles.dot)} />
        <h2 id={headingId} className="text-sm font-semibold tracking-tight">
          {label}
        </h2>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-subtle tabular-nums ring-1 ring-border">
          {filtered ? `${tasks.length}/${total}` : total}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Add task to ${label}`}
          className="ml-auto text-subtle hover:bg-card hover:text-heading"
          onClick={() => onAdd(status)}
        >
          <Plus />
        </Button>
      </header>

      <SortableContext id={status} items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-36 flex-1 flex-col gap-2.5 px-2.5 pb-2.5">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} actions={{ onOpen, onRun, onDelete }} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center text-xs text-faint">
              {filtered && total > 0 ? "No matching tasks" : "Drop tasks here"}
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
