import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, GitBranch, Globe, Lock } from "lucide-react";
import type { User, Workspace } from "@/db";
import { getCurrentUser, getDbUser, type AuthUser } from "@/lib/auth";
import { getGithubConnection } from "@/lib/github";
import { getCurrentWorkspace, workspaceLogoUrl } from "@/lib/workspaces";
import { SETTINGS_NAV } from "@/components/dashboard/nav-items";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { UserAvatar } from "@/components/layout/user-avatar";
import { GithubConnectionCard } from "@/components/settings/github-connection-card";
import { WorkflowSettingsForm } from "@/components/settings/workflow-settings-form";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ github_error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const item = SETTINGS_NAV.find((entry) => entry.slug === section);
  return { title: `${item?.title ?? "Settings"} · DevCrew` };
}

export default async function SettingsSectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const item = SETTINGS_NAV.find((entry) => entry.slug === section);
  if (!item) notFound();

  const [authUser, user] = await Promise.all([getCurrentUser(), getDbUser()]);
  if (!authUser || !user) redirect(`/sign-in?next=${item.href}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
        <p className="text-base text-subtle">{item.description}</p>
      </div>
      {item.slug === "account" && <AccountSettings authUser={authUser} user={user} githubError={(await searchParams).github_error} />}
      {/* Keyed by workspace so switching workspaces resets the forms. */}
      {item.slug === "workspace" && <WorkspaceSettings key={workspace.id} workspace={workspace} />}
      {item.slug === "workflow" && (
        <WorkflowSettingsForm
          key={workspace.id}
          taskPickup={workspace.taskPickup}
          mergeMode={workspace.mergeMode}
          repoFullName={workspace.repoFullName}
        />
      )}
    </div>
  );
}

async function AccountSettings({ authUser, user, githubError }: { authUser: AuthUser; user: User; githubError?: string }) {
  const connection = await getGithubConnection(user.id);
  const memberSince = user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-xs">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <UserAvatar user={authUser} className="size-14 [&_[data-slot=avatar-fallback]]:text-base" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-heading">{authUser.name || "No name set"}</p>
            <p className="truncate text-sm text-subtle">{authUser.email}</p>
            <p className="mt-1 text-xs text-faint">Member since {memberSince}</p>
          </div>
        </div>
      </section>
      <GithubConnectionCard
        account={connection ? { login: connection.login, avatarUrl: connection.avatarUrl } : null}
        error={githubError}
      />
    </div>
  );
}

function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
  return (
    <div className="space-y-6">
      <WorkspaceSettingsForm name={workspace.name} icon={workspace.icon} logoUrl={workspaceLogoUrl(workspace)} />
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Repository</h2>
          <p className="text-sm text-subtle">
            Tasks, branches and pull requests belong to this repository, so it can&apos;t be changed. Create a new workspace to work on
            another one.
          </p>
        </div>
        <a
          href={workspace.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors outline-none hover:border-brand-accent hover:bg-brand-tint focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <GitHubIcon className="size-6 shrink-0 text-heading" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-heading">{workspace.repoFullName}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
              <span className="flex items-center gap-1">
                <GitBranch className="size-3.5" />
                <span className="font-mono text-body">{workspace.repoDefaultBranch}</span>
              </span>
              <span className="flex items-center gap-1">
                {workspace.repoPrivate ? <Lock className="size-3.5" /> : <Globe className="size-3.5" />}
                {workspace.repoPrivate ? "Private" : "Public"}
              </span>
            </p>
          </div>
          <ArrowUpRight aria-hidden className="size-4 shrink-0 text-faint group-hover:text-primary" />
        </a>
      </section>
    </div>
  );
}
