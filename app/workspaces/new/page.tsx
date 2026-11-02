import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, getDbUser } from "@/lib/auth";
import { getGithubConnection } from "@/lib/github";
import { listWorkspaces } from "@/lib/workspaces";
import { AppHeader } from "@/components/layout/app-header";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

export const metadata: Metadata = { title: "Create workspace · DevCrew" };

export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ github_error?: string }>;
}) {
  const [authUser, user] = await Promise.all([getCurrentUser(), getDbUser()]);
  if (!authUser || !user) redirect("/sign-in?next=/workspaces/new");

  const [connection, workspaces, { github_error }] = await Promise.all([
    getGithubConnection(user.id),
    listWorkspaces(user.id),
    searchParams,
  ]);
  const isFirst = workspaces.length === 0;

  return (
    <div className="min-h-svh bg-background">
      <AppHeader user={authUser} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {!isFirst && (
          <Link
            href="/workspaces"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-subtle hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            All workspaces
          </Link>
        )}
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">{isFirst ? "Welcome to DevCrew" : "New workspace"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Create your workspace</h1>
          <p className="text-base text-subtle">
            A workspace connects your team and AI agents to a single GitHub repository.
          </p>
        </div>
        <CreateWorkspaceForm
          githubAccount={connection ? { login: connection.login, avatarUrl: connection.avatarUrl } : null}
          githubError={github_error}
        />
      </main>
    </div>
  );
}
