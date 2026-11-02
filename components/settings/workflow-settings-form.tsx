"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AGENT_MAX_TURNS_MAX,
  MAX_REWORK_ROUNDS,
  MERGE_MODE_LABELS,
  MERGE_MODES,
  TASK_PICKUP_LABELS,
  TASK_PICKUP_MODES,
  type MergeMode,
  type TaskPickupMode,
} from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { updateWorkflowSettingsAction, type WorkflowFormState } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

export function WorkflowSettingsForm({
  taskPickup,
  mergeMode,
  repoFullName,
}: {
  taskPickup: TaskPickupMode;
  mergeMode: MergeMode;
  repoFullName: string;
}) {
  const [state, dispatch, pending] = useActionState<WorkflowFormState, FormData>(updateWorkflowSettingsAction, {});
  const [pickup, setPickup] = useState(taskPickup);
  const [merge, setMerge] = useState(mergeMode);
  const dirty = pickup !== taskPickup || merge !== mergeMode;

  return (
    <form action={dispatch} className="space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.saved && !dirty && !pending && <FormAlert tone="success">Workflow settings saved.</FormAlert>}

      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Task pickup</h2>
          <p className="text-sm text-subtle">
            The Analyst reads each task and hands it to the Developer, Reviewer and Tester in turn. Work back and forth between them is
            capped at {MAX_REWORK_ROUNDS} rounds, and each agent at its own max turns (up to {AGENT_MAX_TURNS_MAX}, set on the AI team
            page).
          </p>
        </div>
        <ModeGroup
          name="taskPickup"
          label="Task pickup"
          options={TASK_PICKUP_MODES.map((mode) => ({ value: mode, ...TASK_PICKUP_LABELS[mode] }))}
          value={pickup}
          onChange={setPickup}
          invalid={state.field === "taskPickup"}
        />
        {pickup === "auto" && (
          <FormAlert tone="info">
            One task at a time, from the top of Todo. Tasks the team already worked on aren&apos;t picked up again. New tasks are picked
            up when they&apos;re created, while the board is open, and when the previous run ends.
          </FormAlert>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Pull request merging</h2>
          <p className="text-sm text-subtle">
            Once the Tester verifies a branch, it opens a pull request on <span className="font-mono text-body">{repoFullName}</span>. If
            a merge hits conflicts or failing checks, the Tester adds a task to Todo with the details.
          </p>
        </div>
        <ModeGroup
          name="mergeMode"
          label="Pull request merging"
          options={MERGE_MODES.map((mode) => ({ value: mode, ...MERGE_MODE_LABELS[mode] }))}
          value={merge}
          onChange={setMerge}
          invalid={state.field === "mergeMode"}
        />
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="h-10 px-5" disabled={pending || !dirty}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function ModeGroup<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  invalid,
}: {
  name: string;
  label: string;
  options: { value: T; label: string; description: string }[];
  value: T;
  onChange: (value: T) => void;
  invalid: boolean;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2" aria-invalid={invalid || undefined}>
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-brand-accent hover:bg-brand-tint has-checked:border-primary has-checked:bg-brand-tint has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
            invalid && "border-destructive",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className={cn("text-sm font-medium", value === option.value ? "text-primary" : "text-heading")}>{option.label}</span>
          <span className="text-xs text-subtle">{option.description}</span>
        </label>
      ))}
    </fieldset>
  );
}
