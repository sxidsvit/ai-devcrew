"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";
import { GithubAuthError } from "@/lib/github";
import { attemptMerge, getPullRequest, ownerGithubToken } from "@/lib/pull-requests";
import { getCurrentWorkspace } from "@/lib/workspaces";

const PULL_REQUESTS_PATH = "/dashboard/pull-requests";

// Merges an open pull request now. Conflicts and failed checks come back as an error, and the Tester files a Todo task for them.
export async function mergePullRequestAction(id: string): Promise<{ error?: string; reconnect?: boolean }> {
  const user = await getDbUser();
  if (!user) redirect(`/sign-in?next=${PULL_REQUESTS_PATH}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const pr = typeof id === "string" ? await getPullRequest(workspace.id, id) : null;
  if (!pr) return { error: "This pull request no longer exists. Refresh the page." };
  if (pr.state !== "open") return { error: `#${pr.number} is already ${pr.state}.` };

  let result: Awaited<ReturnType<typeof attemptMerge>>;
  try {
    result = await attemptMerge(workspace, pr, await ownerGithubToken(workspace), "user");
  } catch (error) {
    if (error instanceof GithubAuthError) return { error: error.message, reconnect: true };
    console.error("Pull request merge failed", error);
    return { error: "We couldn't reach GitHub to merge this pull request. Try again in a moment." };
  }

  revalidatePath(PULL_REQUESTS_PATH);
  revalidatePath("/dashboard/board");
  switch (result.outcome) {
    case "merged":
      return {};
    case "closed":
      return { error: `#${pr.number} was closed on GitHub.` };
    case "pending":
      return { error: result.message };
    case "blocked":
      return { error: result.block === "error" ? result.message : `${result.message} The Tester added a task to Todo with the details.` };
  }
}
