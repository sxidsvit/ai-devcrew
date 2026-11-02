import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";
import { GithubAuthError } from "@/lib/github";
import { listPullRequests, refreshOpenPullRequests } from "@/lib/pull-requests";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { FormAlert } from "@/components/ui/form-alert";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";

export const metadata: Metadata = { title: "Pull Requests · DevCrew" };

export default async function PullRequestsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/dashboard/pull-requests");

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  // Pick up merges and closes made on GitHub; an outage shouldn't keep the page from loading.
  let syncError: string | null = null;
  try {
    await refreshOpenPullRequests(workspace);
  } catch (error) {
    if (error instanceof GithubAuthError) syncError = error.message;
    else {
      console.error("Pull request refresh failed", error);
      syncError = "We couldn't check GitHub for updates. Showing pull requests as last synced.";
    }
  }

  const pullRequests = await listPullRequests(workspace);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Pull Requests</h1>
        <p className="text-base text-subtle">
          Pull requests the AI team opened on <span className="font-mono text-body">{workspace.repoFullName}</span>.{" "}
          {workspace.mergeMode === "auto"
            ? "They merge automatically once checks pass."
            : "Review them on GitHub, then merge them here."}
        </p>
      </div>
      {syncError && <FormAlert tone="error">{syncError}</FormAlert>}
      <PullRequestList key={workspace.id} pullRequests={pullRequests} />
    </div>
  );
}
