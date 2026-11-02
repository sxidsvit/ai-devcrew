import { ArrowUpRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { PageTitle } from "@/components/dashboard/page-title";
import { HeaderUserMenu } from "@/components/dashboard/user-menu";
import type { UserSummary } from "@/components/layout/user-avatar";

export function DashboardHeader({
  user,
  repoFullName,
  repoUrl,
}: {
  user: UserSummary;
  repoFullName: string;
  repoUrl: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1 text-subtle" />
      <span aria-hidden className="h-5 w-px bg-border" />
      <PageTitle />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden h-8 max-w-64 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-sm font-medium text-heading transition-colors outline-none hover:border-brand-accent hover:bg-brand-tint focus-visible:ring-3 focus-visible:ring-ring/40 sm:inline-flex"
        >
          <GitHubIcon className="size-4 shrink-0" />
          <span className="truncate">{repoFullName}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-faint" />
        </a>
        <HeaderUserMenu user={user} />
      </div>
    </header>
  );
}
