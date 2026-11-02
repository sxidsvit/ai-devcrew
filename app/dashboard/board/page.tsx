import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";
import { GithubAuthError } from "@/lib/github";
import { syncGithubIssues } from "@/lib/github-issues";
import { pickUpNextTask } from "@/lib/task-runs";
import { listBoardTasks } from "@/lib/tasks";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { KanbanBoard, type SyncError } from "@/components/board/kanban-board";

export const metadata: Metadata = { title: "Board · DevCrew" };

export default async function BoardPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/dashboard/board");

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  // Pull new issues before rendering; a GitHub outage shouldn't keep the board from loading.
  let syncError: SyncError | null = null;
  try {
    await syncGithubIssues(user.id, workspace);
  } catch (error) {
    if (error instanceof GithubAuthError) syncError = { message: error.message, reconnect: true };
    else {
      console.error("GitHub issue sync failed", error);
      syncError = { message: "We couldn't load new issues from GitHub. Showing the board as last synced." };
    }
  }

  await pickUpNextTask(workspace.id);
  const tasks = await listBoardTasks(workspace);

  // Keyed by workspace so switching workspaces resets the board's local state.
  return (
    <KanbanBoard key={workspace.id} initialTasks={tasks} repoFullName={workspace.repoFullName} initialSyncError={syncError} />
  );
}
