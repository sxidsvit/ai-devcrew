"use server";

import { and, eq, inArray, min, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, tasks } from "@/db";
import { getDbUser } from "@/lib/auth";
import {
  isTaskPriority,
  isTaskStatus,
  isTaskType,
  TASK_DESCRIPTION_MAX,
  TASK_ESTIMATES,
  TASK_TITLE_MAX,
  TASK_TITLE_MIN,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/board";
import { GithubAuthError } from "@/lib/github";
import { syncGithubIssues } from "@/lib/github-issues";
import { hasRunningTask, pickUpNextTask, startTaskRun } from "@/lib/task-runs";
import { getTask, insertTasks, POSITION_STEP } from "@/lib/tasks";
import { getCurrentWorkspace } from "@/lib/workspaces";

const BOARD_PATH = "/dashboard/board";
const MAX_COLUMN_SIZE = 1000;

export type TaskFormState = {
  error?: string;
  field?: "type" | "title" | "description" | "priority" | "status" | "estimate" | "dueDate";
  // Bumped on every successful save so the dialog can close itself.
  saved?: number;
};

type TaskFields = {
  type: TaskType;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimate: number | null;
  dueDate: string | null;
};

async function requireWorkspace() {
  const user = await getDbUser();
  if (!user) redirect(`/sign-in?next=${BOARD_PATH}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");
  return { user, workspace };
}

// Validates the fields of the task dialog, shared by create and update.
function parseTaskForm(formData: FormData): { fields: TaskFields } | TaskFormState {
  const type = formData.get("type");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const priority = formData.get("priority");
  const status = formData.get("status");
  const estimate = formData.get("estimate")?.toString() ?? "";
  const dueDate = formData.get("dueDate")?.toString() ?? "";

  if (!isTaskType(type)) return { error: "Choose whether this is an issue, bug or feature.", field: "type" };
  if (title.length < TASK_TITLE_MIN || title.length > TASK_TITLE_MAX) {
    return { error: `Title must be between ${TASK_TITLE_MIN} and ${TASK_TITLE_MAX} characters.`, field: "title" };
  }
  if (description.length > TASK_DESCRIPTION_MAX) {
    return { error: `Description must be ${TASK_DESCRIPTION_MAX} characters or fewer.`, field: "description" };
  }
  if (!isTaskPriority(priority)) return { error: "Choose a priority.", field: "priority" };
  if (!isTaskStatus(status)) return { error: "Choose a column.", field: "status" };
  const estimatePoints = estimate ? Number(estimate) : null;
  if (estimatePoints !== null && !(TASK_ESTIMATES as readonly number[]).includes(estimatePoints)) {
    return { error: "Choose an estimate from the list.", field: "estimate" };
  }
  if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate)))) {
    return { error: "Enter a valid due date.", field: "dueDate" };
  }

  return {
    fields: {
      type,
      title,
      description: description || null,
      priority,
      status,
      estimate: estimatePoints,
      dueDate: dueDate || null,
    },
  };
}

export async function createTaskAction(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const { user, workspace } = await requireWorkspace();

  const parsed = parseTaskForm(formData);
  if (!("fields" in parsed)) return parsed;

  try {
    await insertTasks(workspace.id, [{ ...parsed.fields, createdById: user.id }]);
  } catch (error) {
    console.error("Task create failed", error);
    return { error: "We couldn't create this task. Please try again." };
  }

  await pickUpNextTask(workspace.id);
  revalidatePath(BOARD_PATH);
  return { saved: Date.now() };
}

export async function updateTaskAction(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const { workspace } = await requireWorkspace();

  const task = await getTask(workspace.id, formData.get("taskId")?.toString() ?? "");
  if (!task) return { error: "This task no longer exists. Close the dialog and refresh the board." };

  const parsed = parseTaskForm(formData);
  if (!("fields" in parsed)) return parsed;

  let position = task.position;
  if (parsed.fields.status !== task.status) {
    // Changing the column from the dialog puts the task at the top of its new column.
    const [{ top }] = await db
      .select({ top: min(tasks.position) })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspace.id), eq(tasks.status, parsed.fields.status)));
    position = (top ?? 0) - POSITION_STEP;
  }

  await db
    .update(tasks)
    .set({ ...parsed.fields, position, updatedAt: new Date() })
    .where(and(eq(tasks.id, task.id), eq(tasks.workspaceId, workspace.id)));

  revalidatePath(BOARD_PATH);
  return { saved: Date.now() };
}

// Moves a task to `status` and saves the new order of that column, given as task ids from top to bottom.
export async function moveTaskAction(input: {
  taskId: string;
  status: TaskStatus;
  orderedIds: string[];
}): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();

  const { taskId, status, orderedIds } = input;
  if (
    !isTaskStatus(status) ||
    !Array.isArray(orderedIds) ||
    orderedIds.length > MAX_COLUMN_SIZE ||
    !orderedIds.includes(taskId) ||
    orderedIds.some((id) => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
  ) {
    return { error: "That move isn't valid. Refresh the board and try again." };
  }

  const task = await getTask(workspace.id, taskId);
  if (!task) return { error: "This task no longer exists. Refresh the board." };

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tasks.id, task.id), eq(tasks.workspaceId, workspace.id)));

    // Rewrite the column's positions in one statement; ids from other workspaces or columns match nothing.
    const cases = sql.join(
      orderedIds.map((id, i) => sql`when ${id}::uuid then ${i * POSITION_STEP}::double precision`),
      sql` `,
    );
    await tx
      .update(tasks)
      .set({ position: sql`case ${tasks.id} ${cases} end` })
      .where(and(eq(tasks.workspaceId, workspace.id), eq(tasks.status, status), inArray(tasks.id, orderedIds)));
  });

  return {};
}

export async function deleteTaskAction(taskId: string): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();

  const task = typeof taskId === "string" ? await getTask(workspace.id, taskId) : null;
  if (!task) return { error: "This task no longer exists. Refresh the board." };

  await db.delete(tasks).where(and(eq(tasks.id, task.id), eq(tasks.workspaceId, workspace.id)));
  revalidatePath(BOARD_PATH);
  return {};
}

// Pulls new and changed issues from the workspace's repository. `force` skips the throttle (the Refresh button).
export async function syncGithubIssuesAction(input: { force?: boolean } = {}): Promise<{ error?: string; reconnect?: boolean; changed?: number }> {
  const { user, workspace } = await requireWorkspace();

  try {
    const result = await syncGithubIssues(user.id, workspace, { force: input.force === true });
    await pickUpNextTask(workspace.id);
    // While agents work, their progress moves cards, so the board refreshes on every poll.
    if (result.changed > 0 || (await hasRunningTask(workspace.id))) revalidatePath(BOARD_PATH);
    return { changed: result.changed };
  } catch (error) {
    if (error instanceof GithubAuthError) return { error: error.message, reconnect: true };
    console.error("GitHub issue sync failed", error);
    return { error: "We couldn't load issues from GitHub. Try again in a moment." };
  }
}

// Hands a task to the workspace's Analyst, which starts the AI team's pipeline on it.
export async function runTaskAction(taskId: string): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();

  const task = typeof taskId === "string" ? await getTask(workspace.id, taskId) : null;
  if (!task) return { error: "This task no longer exists. Refresh the board." };

  const result = await startTaskRun(workspace, task);
  if (result.error) return result;

  revalidatePath(BOARD_PATH);
  revalidatePath("/dashboard/ai-team");
  return {};
}
