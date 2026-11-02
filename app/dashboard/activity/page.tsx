import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { listWorkspaceActivity } from "@/lib/activity";
import { getDbUser } from "@/lib/auth";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActivityTimeline } from "@/components/activity/activity-timeline";

export const metadata: Metadata = { title: "Activity · DevCrew" };

const ACTIVITY_LIMIT = 100;

export default async function ActivityPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/dashboard/activity");

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const activity = await listWorkspaceActivity(workspace, ACTIVITY_LIMIT);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-base text-subtle">Everything that happened in {workspace.name}, newest first.</p>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="When you add tasks or your AI team starts working on them, every step shows up here."
          action={{ label: "Go to board", href: "/dashboard/board" }}
          className="rounded-2xl py-16"
        />
      ) : (
        <section className="rounded-2xl border bg-card p-6 shadow-xs">
          <ActivityTimeline activity={activity} />
          {activity.length === ACTIVITY_LIMIT && (
            <p className="mt-6 border-t pt-4 text-center text-xs text-subtle">Showing the latest {ACTIVITY_LIMIT} events.</p>
          )}
        </section>
      )}
    </div>
  );
}
