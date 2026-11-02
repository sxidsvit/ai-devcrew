"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, workspaces } from "@/db";
import { getDbUser } from "@/lib/auth";
import { deleteObject, putObject } from "@/lib/storage";
import { pickUpNextTask } from "@/lib/task-runs";
import { isMergeMode, isTaskPickupMode } from "@/lib/workflow";
import { logoObjectKey, readLogoUpload } from "@/lib/workspace-logo";
import { WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from "@/lib/workspace-limits";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { isWorkspaceIcon } from "@/components/workspace/workspace-icons";

const WORKFLOW_PATH = "/dashboard/settings/workflow";
const WORKSPACE_PATH = "/dashboard/settings/workspace";

export type WorkspaceSettingsState = {
  error?: string;
  field?: "name" | "icon" | "logo";
  saved?: number;
};

// Renames the current workspace and changes its icon or logo. `logo` is "keep", "remove" or "replace" (with a `logoFile`).
export async function updateWorkspaceSettingsAction(
  _prev: WorkspaceSettingsState,
  formData: FormData,
): Promise<WorkspaceSettingsState> {
  const user = await getDbUser();
  if (!user) redirect(`/sign-in?next=${WORKSPACE_PATH}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const name = formData.get("name")?.toString().trim() ?? "";
  const icon = formData.get("icon");
  const logo = formData.get("logo");

  if (name.length < WORKSPACE_NAME_MIN || name.length > WORKSPACE_NAME_MAX) {
    return {
      error: `Workspace name must be between ${WORKSPACE_NAME_MIN} and ${WORKSPACE_NAME_MAX} characters.`,
      field: "name",
    };
  }
  if (!isWorkspaceIcon(icon)) return { error: "Choose a workspace icon.", field: "icon" };
  if (logo !== "keep" && logo !== "remove" && logo !== "replace") return { error: "Choose a logo or an icon.", field: "logo" };

  let logoKey = workspace.logoKey;
  if (logo === "remove") logoKey = null;
  if (logo === "replace") {
    const upload = await readLogoUpload(formData.get("logoFile"));
    if ("error" in upload) return { error: upload.error, field: "logo" };
    if (!upload.file) return { error: "Choose a logo to upload.", field: "logo" };
    logoKey = logoObjectKey(workspace.id, upload.file.ext);
    try {
      await putObject(logoKey, upload.file.bytes, upload.file.type);
    } catch (error) {
      console.error("Workspace logo upload failed", error);
      return { error: "We couldn't upload your logo. Please try again.", field: "logo" };
    }
  }

  await db
    .update(workspaces)
    .set({ name, icon, logoKey, updatedAt: new Date() })
    .where(and(eq(workspaces.id, workspace.id), eq(workspaces.ownerId, user.id)));

  // The old logo is unreachable once the row points elsewhere. Best effort.
  if (workspace.logoKey && workspace.logoKey !== logoKey) {
    await deleteObject(workspace.logoKey).catch((error) => console.error("Old workspace logo cleanup failed", error));
  }

  // The name and avatar show in the sidebar and workspace picker too.
  revalidatePath("/dashboard", "layout");
  revalidatePath("/workspaces");
  return { saved: Date.now() };
}

export type WorkflowFormState = {
  error?: string;
  field?: "taskPickup" | "mergeMode";
  saved?: number;
};

export async function updateWorkflowSettingsAction(_prev: WorkflowFormState, formData: FormData): Promise<WorkflowFormState> {
  const user = await getDbUser();
  if (!user) redirect(`/sign-in?next=${WORKFLOW_PATH}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const taskPickup = formData.get("taskPickup");
  const mergeMode = formData.get("mergeMode");
  if (!isTaskPickupMode(taskPickup)) return { error: "Choose how the AI team picks up tasks.", field: "taskPickup" };
  if (!isMergeMode(mergeMode)) return { error: "Choose how pull requests are merged.", field: "mergeMode" };

  await db
    .update(workspaces)
    .set({ taskPickup, mergeMode, updatedAt: new Date() })
    .where(and(eq(workspaces.id, workspace.id), eq(workspaces.ownerId, user.id)));

  // Switching to automatic pickup starts on the backlog right away.
  if (taskPickup === "auto" && workspace.taskPickup !== "auto") await pickUpNextTask(workspace.id);

  revalidatePath(WORKFLOW_PATH);
  revalidatePath("/dashboard/board");
  return { saved: Date.now() };
}
