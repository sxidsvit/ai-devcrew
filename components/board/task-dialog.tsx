"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { GitBranch, GitPullRequest, Loader2, Plus, Trash2 } from "lucide-react";
import { createTaskAction, updateTaskAction, type TaskFormState } from "@/app/dashboard/board/actions";
import {
  TASK_DESCRIPTION_MAX,
  TASK_ESTIMATES,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TASK_TITLE_MAX,
  TASK_TITLE_MIN,
  TASK_TYPE_LABELS,
  TASK_TYPES,
  type BoardTask,
  type TaskStatus,
  type TaskType,
} from "@/lib/board";
import { cn } from "@/lib/utils";
import { TASK_RUN_STAGE_LABELS } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { PRIORITY_STYLES, TYPE_STYLES } from "@/components/board/task-styles";

// Create opens from the "New" menu or a column's + button; edit opens when a card is clicked.
export type TaskDialogTarget =
  | { mode: "create"; type: TaskType; status: TaskStatus }
  | { mode: "edit"; task: BoardTask };

const STATUS_ITEMS = TASK_STATUSES.map((status) => ({ value: status, label: TASK_STATUS_LABELS[status] }));
const ESTIMATE_ITEMS = [
  { value: "", label: "No estimate" },
  ...TASK_ESTIMATES.map((points) => ({ value: String(points), label: `${points} point${points === 1 ? "" : "s"}` })),
];

export function TaskDialog({
  target,
  onOpenChange,
  onDelete,
}: {
  target: TaskDialogTarget | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {target && (
          <TaskForm
            key={target.mode === "edit" ? target.task.id : "create"}
            target={target}
            onDone={() => onOpenChange(false)}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({
  target,
  onDone,
  onDelete,
}: {
  target: TaskDialogTarget;
  onDone: () => void;
  onDelete: (taskId: string) => void;
}) {
  const task = target.mode === "edit" ? target.task : null;
  const [state, dispatch, pending] = useActionState<TaskFormState, FormData>(
    task ? updateTaskAction : createTaskAction,
    {},
  );
  const [type, setType] = useState<TaskType>(task?.type ?? (target.mode === "create" ? target.type : "issue"));
  const [title, setTitle] = useState(task?.title ?? "");

  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Dispatched by hand so React doesn't reset the fields when the server returns an error.
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  const trimmed = title.trim();
  const canSubmit = trimmed.length >= TASK_TITLE_MIN && !pending;
  const invalid = (field: TaskFormState["field"]) => state.field === field || undefined;
  const typeLabel = TASK_TYPE_LABELS[type].toLowerCase();

  return (
    <form onSubmit={submit} noValidate>
      {task && <input type="hidden" name="taskId" value={task.id} />}

      <DialogHeader className="gap-1 border-b px-6 pt-6 pb-5">
        <DialogTitle className="text-lg font-semibold tracking-tight">
          {task ? `${TASK_TYPE_LABELS[type]} details` : `New ${typeLabel}`}
        </DialogTitle>
        <DialogDescription>
          {task?.github ? (
            <>
              <span className="font-mono text-body">{task.key}</span> · Synced from{" "}
              <a
                href={task.github.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-sm font-medium text-primary outline-none hover:text-primary-hover hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <GitHubIcon aria-hidden className="size-3.5" />
                issue #{task.github.number}
              </a>
              . Title and description update when the issue changes on GitHub.
            </>
          ) : task ? (
            <>
              <span className="font-mono text-body">{task.key}</span> · Edit the details below and save your changes.
            </>
          ) : (
            "Add it to the board. You can drag it to another column at any time."
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 px-6 py-5">
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
        {task && <RunPanel task={task} />}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {TASK_TYPES.map((option) => {
              const { icon: Icon, tile, description } = TYPE_STYLES[option];
              return (
                <label
                  key={option}
                  className="flex cursor-pointer flex-col items-start gap-2 rounded-xl border bg-card p-3 transition-colors hover:border-brand-accent hover:bg-brand-tint has-checked:border-primary has-checked:bg-brand-tint has-focus-visible:ring-3 has-focus-visible:ring-ring/40"
                >
                  <input
                    type="radio"
                    name="type"
                    value={option}
                    checked={type === option}
                    onChange={() => setType(option)}
                    className="sr-only"
                  />
                  <span className={cn("flex size-7 items-center justify-center rounded-lg [&_svg]:size-4", tile)}>
                    <Icon aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-heading">{TASK_TYPE_LABELS[option]}</span>
                    <span className="hidden text-xs text-subtle sm:block">{description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={type === "bug" ? "e.g. Login button does nothing on Safari" : "e.g. Add CSV export to reports"}
            maxLength={TASK_TITLE_MAX}
            autoComplete="off"
            aria-invalid={invalid("title")}
            autoFocus={!task}
          />
          <p className="flex justify-between text-xs text-faint">
            <span>A short summary the team can scan.</span>
            <span>
              {trimmed.length}/{TASK_TITLE_MAX}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">
            Description <span className="font-normal text-faint">(optional)</span>
          </Label>
          <Textarea
            id="task-description"
            name="description"
            defaultValue={task?.description ?? ""}
            placeholder={
              type === "bug"
                ? "Steps to reproduce, what you expected, and what happened instead."
                : "Context, acceptance criteria and anything the agent should know."
            }
            maxLength={TASK_DESCRIPTION_MAX}
            className="max-h-48"
            aria-invalid={invalid("description")}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Priority</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TASK_PRIORITIES.map((priority) => {
              const { icon: Icon, badge } = PRIORITY_STYLES[priority];
              return (
                <label
                  key={priority}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:border-brand-accent hover:bg-brand-tint has-checked:border-primary has-checked:bg-brand-tint has-checked:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/40"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    defaultChecked={priority === (task?.priority ?? "medium")}
                    className="sr-only"
                  />
                  <span className={cn("flex size-5 items-center justify-center rounded-md", badge)}>
                    <Icon aria-hidden className="size-3.5" />
                  </span>
                  {TASK_PRIORITY_LABELS[priority]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormSelect
            id="task-status"
            name="status"
            label="Column"
            items={STATUS_ITEMS}
            defaultValue={task?.status ?? (target.mode === "create" ? target.status : "todo")}
          />
          <FormSelect
            id="task-estimate"
            name="estimate"
            label="Estimate"
            items={ESTIMATE_ITEMS}
            defaultValue={task?.estimate ? String(task.estimate) : ""}
          />
          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input id="task-due" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} aria-invalid={invalid("dueDate")} />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t bg-muted px-6 py-4 sm:flex-row sm:items-center">
        {task && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-10 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
            onClick={() => {
              onDelete(task.id);
              onDone();
            }}
            disabled={pending}
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        )}
        <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
          <DialogClose render={<Button type="button" variant="outline" size="lg" className="h-10 px-4" />}>Cancel</DialogClose>
          <Button type="submit" size="lg" className="h-10 px-5" disabled={!canSubmit}>
            {pending ? <Loader2 className="animate-spin" /> : task ? null : <Plus />}
            {task ? (pending ? "Saving…" : "Save changes") : pending ? "Creating…" : `Create ${typeLabel}`}
          </Button>
        </div>
      </div>
    </form>
  );
}

// Where the AI team is with this task, and the branch and pull request it produced.
function RunPanel({ task }: { task: BoardTask }) {
  const run = task.latestRun;
  if (!run) return null;
  const running = task.run === "running";

  let alert: React.ReactNode = null;
  if (running) {
    alert = (
      <FormAlert tone="info">
        {TASK_RUN_STAGE_LABELS[run.stage]}
        {task.assignee ? ` · ${task.assignee} is working on this task.` : "."}
      </FormAlert>
    );
  } else if (run.status === "needs_input") {
    alert = <FormAlert tone="info">{run.note} Add the answer to the description, then run the task again.</FormAlert>;
  } else if (run.status === "failed") {
    alert = <FormAlert tone="error">{run.note ?? "The last run stopped before it finished."}</FormAlert>;
  } else if (run.note) {
    alert = <FormAlert tone="info">{run.note}</FormAlert>;
  }

  return (
    <div className="space-y-3">
      {alert}
      {(run.branch || task.pullRequest) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-subtle">
          {run.branch && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <GitBranch aria-hidden className="size-3.5 shrink-0" />
              <span className="sr-only">Branch</span>
              <span className="truncate font-mono text-body">{run.branch}</span>
            </span>
          )}
          {task.pullRequest && (
            <a
              href={task.pullRequest.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm font-medium text-primary outline-none hover:text-primary-hover hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <GitPullRequest aria-hidden className="size-3.5" />
              Pull request #{task.pullRequest.number} · {task.pullRequest.state}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function FormSelect({
  id,
  name,
  label,
  items,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  items: { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} items={items} defaultValue={defaultValue}>
        <SelectTrigger id={id} className="h-10 w-full bg-background px-3 shadow-xs data-[size=default]:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
