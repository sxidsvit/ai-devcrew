import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, getDbUser } from "@/lib/auth";
import { getCurrentWorkspace, listWorkspaces, workspaceLogoUrl } from "@/lib/workspaces";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [authUser, user] = await Promise.all([getCurrentUser(), getDbUser()]);
  if (!authUser || !user) redirect("/sign-in?next=/dashboard");

  const [workspace, workspaces, cookieStore] = await Promise.all([
    getCurrentWorkspace(user.id),
    listWorkspaces(user.id),
    cookies(),
  ]);
  if (!workspace) redirect("/workspaces/new");

  // The sidebar component saves its expanded/collapsed state in this cookie.
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const userSummary = { name: authUser.name, email: authUser.email, image: authUser.image };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar
          user={userSummary}
          currentWorkspaceId={workspace.id}
          workspaces={workspaces.map((item) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            logoUrl: workspaceLogoUrl(item),
            repoFullName: item.repoFullName,
          }))}
        />
        <SidebarInset className="min-w-0">
          <DashboardHeader user={userSummary} repoFullName={workspace.repoFullName} repoUrl={workspace.repoUrl} />
          <DashboardContent>{children}</DashboardContent>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
