import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listWorkspaceActivity } from "@/lib/activity";
import { listOfficeAgents } from "@/lib/agents";
import { getCurrentUser, getDbUser } from "@/lib/auth";
import { getOverviewStats, listUpcomingTasks } from "@/lib/overview";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { RecentActivity } from "@/components/overview/recent-activity";
import { StatCards } from "@/components/overview/stat-cards";
import { TeamStatus } from "@/components/overview/team-status";
import { UpcomingTasks } from "@/components/overview/upcoming-tasks";

export const metadata: Metadata = { title: "Overview · DevCrew" };

export default async function DashboardPage() {
  const [authUser, user] = await Promise.all([getCurrentUser(), getDbUser()]);
  if (!authUser || !user) redirect("/sign-in?next=/dashboard");

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const [stats, upcoming, activity, officeAgents] = await Promise.all([
    getOverviewStats(workspace),
    listUpcomingTasks(workspace),
    listWorkspaceActivity(workspace, 6),
    listOfficeAgents(workspace),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {authUser.name || "there"}</h1>
        <p className="text-base text-subtle">Here&apos;s what&apos;s happening in {workspace.name}.</p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingTasks tasks={upcoming} />
        <TeamStatus key={workspace.id} agents={officeAgents} />
      </div>

      <RecentActivity activity={activity} />
    </div>
  );
}
