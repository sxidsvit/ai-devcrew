"use client";

import { startTransition, useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ChevronDown, Loader2, Plus, RefreshCw, Search, SquareKanban } from "lucide-react";
import { deleteTaskAction, moveTaskAction, runTaskAction, syncGithubIssuesAction } from "@/app/dashboard/board/actions";
import {
  ISSUE_SYNC_INTERVAL_MS,
  isTaskStatus,
  RUN_REFRESH_INTERVAL_MS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TASK_TYPE_LABELS,
  TASK_TYPES,
  type BoardTask,
  type TaskStatus,
  type TaskType,
} from "@/lib/board";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCard } from "@/components/board/task-card";
import { TaskDialog, type TaskDialogTarget } from "@/components/board/task-dialog";
import { TYPE_STYLES } from "@/components/board/task-styles";

type TypeFilter = TaskType | "all";

// `reconnect` means the GitHub token is missing or revoked, so the fix is to connect again.
export type SyncError = { message: string; reconnect?: boolean };

export function KanbanBoard({
  initialTasks,
  repoFullName,
  initialSyncError,
}: {
  initialTasks: BoardTask[];
  repoFullName: string;
  initialSyncError: SyncError | null;
}) {
  const dndId = useId();
  // Cards in board order: within a status, array order is top to bottom.
  const [tasks, setTasks] = useState(initialTasks);
  const [serverTasks, setServerTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dialog, setDialog] = useState<TaskDialogTarget | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(initialSyncError);
  const [refreshing, startRefreshing] = useTransition();
  const [, startSaving] = useTransition();
  const dragStart = useRef<BoardTask[]>([]);
  const lastDragEnd = useRef(0);
  const dragging = useRef(false);

  // Take fresh server data after a create or delete revalidates the page.
  if (initialTasks !== serverTasks) {
    setServerTasks(initialTasks);
    setTasks(initialTasks);
  }

  // `force` is the Refresh button; background polls let the server throttle them.
  const syncIssues = useCallback(async (force: boolean) => {
    const result = await syncGithubIssuesAction({ force }).catch(() => ({
      error: "We couldn't reach GitHub. Check your connection and try again.",
      reconnect: false,
    }));
    setSyncError(result.error ? { message: result.error, reconnect: result.reconnect } : null);
  }, []);

  // Poll for new issues while the board is visible, and catch up as soon as the tab comes back.
  // While an agent is working, poll faster so cards follow the run through the columns.
  const anyRunning = tasks.some((task) => task.run === "running");
  useEffect(() => {
    function poll() {
      // A refresh mid-drag would reset the cards under the pointer.
      if (document.visibilityState !== "visible" || dragging.current) return;
      startTransition(() => syncIssues(false));
    }
    const interval = window.setInterval(poll, anyRunning ? RUN_REFRESH_INTERVAL_MS : ISSUE_SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [syncIssues, anyRunning]);

  function refresh() {
    startRefreshing(() => syncIssues(true));
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A short press before dragging, so touch users can still scroll the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Only Space picks a card up, so Enter is free to open it.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const search = query.trim().toLowerCase();
  const filtered = search !== "" || typeFilter !== "all";
  const columns = useMemo(
    () =>
      TASK_STATUSES.map((status) => {
        const all = tasks.filter((task) => task.status === status);
        const visible = all.filter(
          (task) =>
            (typeFilter === "all" || task.type === typeFilter) &&
            (!search ||
              task.title.toLowerCase().includes(search) ||
              task.key.toLowerCase().includes(search) ||
              (task.github !== null && `#${task.github.number}`.includes(search))),
        );
        return { status, total: all.length, visible };
      }),
    [tasks, search, typeFilter],
  );

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : undefined;

  function statusOf(id: UniqueIdentifier, list = tasks): TaskStatus | undefined {
    if (isTaskStatus(id)) return id;
    return list.find((task) => task.id === id)?.status;
  }

  // Saves the column a task ended up in, rolling back if the server refuses.
  function persistMove(taskId: string, next: BoardTask[], previous: BoardTask[]) {
    const status = statusOf(taskId, next);
    if (!status) return;
    const orderedIds = next.filter((task) => task.status === status).map((task) => task.id);
    const before = previous.filter((task) => task.status === status).map((task) => task.id);
    if (statusOf(taskId, previous) === status && before.join() === orderedIds.join()) return;

    setError(null);
    startSaving(async () => {
      const result = await moveTaskAction({ taskId, status, orderedIds }).catch(() => ({
        error: "We couldn't save that move. Check your connection and try again.",
      }));
      if (result.error) {
        setTasks(previous);
        setError(result.error);
      }
    });
  }

  function handleDragStart({ active }: DragStartEvent) {
    dragStart.current = tasks;
    dragging.current = true;
    setActiveId(active.id);
  }

  // Moving into another column happens while dragging, so the card makes room there.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = statusOf(active.id);
    const to = statusOf(over.id);
    if (!from || !to || from === to) return;

    setTasks((prev) => {
      const moving = prev.find((task) => task.id === active.id);
      if (!moving) return prev;
      const rest = prev.filter((task) => task.id !== active.id);
      let insertAt: number;
      if (isTaskStatus(over.id)) {
        // Over the column itself (empty space): go to the bottom.
        const last = rest.findLastIndex((task) => task.status === to);
        insertAt = last === -1 ? rest.length : last + 1;
      } else {
        const overIndex = rest.findIndex((task) => task.id === over.id);
        const dragged = active.rect.current.translated;
        const below = dragged ? dragged.top > over.rect.top + over.rect.height / 2 : false;
        insertAt = overIndex + (below ? 1 : 0);
      }
      return [...rest.slice(0, insertAt), { ...moving, status: to }, ...rest.slice(insertAt)];
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    dragging.current = false;
    lastDragEnd.current = Date.now();
    const previous = dragStart.current;
    if (!over) {
      setTasks(previous);
      return;
    }

    let next = tasks;
    if (over.id !== active.id && !isTaskStatus(over.id) && statusOf(over.id) === statusOf(active.id)) {
      const from = next.findIndex((task) => task.id === active.id);
      const to = next.findIndex((task) => task.id === over.id);
      next = arrayMove(next, from, to);
      setTasks(next);
    }
    persistMove(String(active.id), next, previous);
  }

  function handleDragCancel() {
    setActiveId(null);
    dragging.current = false;
    lastDragEnd.current = Date.now();
    setTasks(dragStart.current);
  }

  function openTask(taskId: string) {
    // The click that can follow dropping a card shouldn't open it.
    if (activeId || Date.now() - lastDragEnd.current < 250) return;
    const task = tasks.find((item) => item.id === taskId);
    if (task) setDialog({ mode: "edit", task });
  }

  // Hands the task to the AI team. The card shows it running right away; the server's copy follows on revalidation.
  function run(taskId: string) {
    const previous = tasks;
    setTasks(previous.map((task) => (task.id === taskId ? { ...task, run: "running" } : task)));
    setError(null);
    startSaving(async () => {
      const result = await runTaskAction(taskId).catch(() => ({ error: "We couldn't start the Analyst. Try again." }));
      if (result.error) {
        setTasks(previous);
        setError(result.error);
      }
    });
  }

  function remove(taskId: string) {
    const previous = tasks;
    setTasks(previous.filter((task) => task.id !== taskId));
    setError(null);
    startSaving(async () => {
      const result = await deleteTaskAction(taskId).catch(() => ({ error: "We couldn't delete that task. Try again." }));
      if (result.error) {
        setTasks(previous);
        setError(result.error);
      }
    });
  }

  const closeDialog = useCallback((open: boolean) => {
    if (!open) setDialog(null);
  }, []);

  const taskLabel = (id: UniqueIdentifier) => tasks.find((task) => task.id === id)?.title ?? "task";
  const placeLabel = (id: UniqueIdentifier) => {
    const status = statusOf(id);
    return status ? TASK_STATUS_LABELS[status] : "the board";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${taskLabel(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${taskLabel(active.id)} is over ${placeLabel(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `${taskLabel(active.id)} was dropped in ${placeLabel(over.id)}.` : `${taskLabel(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${taskLabel(active.id)} was cancelled.`,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Board</h1>
          <p className="text-base text-subtle">
            Issues from <span className="font-mono text-body">{repoFullName}</span> appear here automatically. Drag cards
            between columns.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" size="lg" className="h-10 px-4" onClick={refresh} disabled={refreshing}>
            <RefreshCw data-icon="inline-start" className={cn(refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <NewTaskMenu onPick={(type) => setDialog({ mode: "create", type, status: "todo" })} />
        </div>
      </div>

      {syncError && (
        <FormAlert tone="error">
          {syncError.message}{" "}
          {syncError.reconnect && (
            <a
              href="/api/github/connect?returnTo=/dashboard/board"
              className="inline-flex items-center gap-1 rounded-sm font-medium underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <GitHubIcon className="size-3.5" />
              Reconnect GitHub
            </a>
          )}
        </FormAlert>
      )}

      {tasks.length === 0 ? (
        <EmptyBoard
          repoFullName={repoFullName}
          refreshing={refreshing}
          onRefresh={refresh}
          onCreate={() => setDialog({ mode: "create", type: "issue", status: "todo" })}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-72">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, key or #issue"
                aria-label="Search tasks"
                className="bg-card pl-9"
              />
            </div>
            <TypeFilterGroup value={typeFilter} onChange={setTypeFilter} />
          </div>

          {error && <FormAlert tone="error">{error}</FormAlert>}

          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCorners}
            accessibility={{ announcements }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:snap-none">
              {columns.map((column) => (
                <BoardColumn
                  key={column.status}
                  status={column.status}
                  tasks={column.visible}
                  total={column.total}
                  filtered={filtered}
                  highlighted={activeTask?.status === column.status}
                  onAdd={(status) => setDialog({ mode: "create", type: "issue", status })}
                  onOpen={openTask}
                  onRun={run}
                  onDelete={remove}
                />
              ))}
            </div>
            <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
          </DndContext>
        </>
      )}

      <TaskDialog target={dialog} onOpenChange={closeDialog} onDelete={remove} />
    </div>
  );
}

function NewTaskMenu({ onPick }: { onPick: (type: TaskType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="lg" className="h-10 self-start px-4 sm:self-auto" />}>
        <Plus data-icon="inline-start" />
        New
        <ChevronDown data-icon="inline-end" className="opacity-80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56">
        {TASK_TYPES.map((type) => {
          const { icon: Icon, tile, description } = TYPE_STYLES[type];
          return (
            <DropdownMenuItem key={type} onClick={() => onPick(type)} className="gap-2.5 py-1.5">
              <span className={cn("flex size-7 items-center justify-center rounded-lg", tile)}>
                <Icon />
              </span>
              <span className="grid leading-tight">
                <span className="font-medium text-heading">{TASK_TYPE_LABELS[type]}</span>
                <span className="text-xs text-subtle">{description}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TypeFilterGroup({ value, onChange }: { value: TypeFilter; onChange: (value: TypeFilter) => void }) {
  const options: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    ...TASK_TYPES.map((type) => ({ value: type, label: `${TASK_TYPE_LABELS[type]}s` })),
  ];

  return (
    <div role="radiogroup" aria-label="Filter by type" className="inline-flex self-start rounded-lg border bg-card p-0.5 shadow-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium text-subtle transition-colors outline-none hover:text-heading focus-visible:ring-3 focus-visible:ring-ring/40",
            value === option.value && "bg-brand-tint text-primary hover:text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function EmptyBoard({
  repoFullName,
  refreshing,
  onRefresh,
  onCreate,
}: {
  repoFullName: string;
  refreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs">
        <SquareKanban className="size-5" />
      </span>
      <h2 className="text-base font-semibold tracking-tight">No open issues yet</h2>
      <p className="max-w-sm text-sm text-subtle">
        New issues opened in <span className="font-mono text-body">{repoFullName}</span> show up here automatically. You
        can also create a task for your AI team directly.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button size="lg" className="h-10 px-4" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          Create a task
        </Button>
        <Button variant="outline" size="lg" className="h-10 px-4" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw data-icon="inline-start" />}
          {refreshing ? "Checking GitHub…" : "Check for issues"}
        </Button>
      </div>
    </section>
  );
}
