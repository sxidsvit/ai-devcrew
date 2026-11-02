import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Lock, Plus } from "lucide-react";
import { getCurrentUser, getDbUser } from "@/lib/auth";
import { listWorkspaces, workspaceLogoUrl } from "@/lib/workspaces";
import { selectWorkspaceAction } from "@/app/workspaces/actions";
import { AppHeader } from "@/components/layout/app-header";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";

export const metadata: Metadata = { title: "Workspaces · DevCrew" };

// Landing page after sign-in. New users have nothing to pick, so they go straight to setup.
export default async function WorkspacesPage() {
  const [authUser, user] = await Promise.all([getCurrentUser(), getDbUser()]);
  if (!authUser || !user) redirect("/sign-in?next=/workspaces");

  const workspaces = await listWorkspaces(user.id);
  if (workspaces.length === 0) redirect("/workspaces/new");

  return (
    <div className="min-h-svh bg-background">
      <AppHeader user={authUser} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Your workspaces</h1>
            <p className="text-base text-subtle">Pick a workspace to open its dashboard.</p>
          </div>
          <Link
            href="/workspaces/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="size-4" />
            New workspace
          </Link>
        </div>

        <ul className="space-y-3">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <form action={selectWorkspaceAction}>
                <input type="hidden" name="id" value={workspace.id} />
                <button
                  type="submit"
                  className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors outline-none hover:border-brand-accent hover:bg-brand-tint focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <WorkspaceAvatar icon={workspace.icon} logoUrl={workspaceLogoUrl(workspace)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-heading">{workspace.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-subtle">
                      <GitHubIcon className="size-3.5 shrink-0" />
                      {workspace.repoFullName}
                      {workspace.repoPrivate && <Lock className="size-3 shrink-0 text-faint" />}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
