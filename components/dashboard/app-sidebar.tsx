"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { IconTile } from "@/components/dashboard/icon-tile";
import { DASHBOARD_NAV, isNavActive } from "@/components/dashboard/nav-items";
import { SidebarUserMenu } from "@/components/dashboard/user-menu";
import { WorkspaceSwitcher, type WorkspaceOption } from "@/components/dashboard/workspace-switcher";
import { Logo } from "@/components/layout/logo";
import type { UserSummary } from "@/components/layout/user-avatar";

export function AppSidebar({
  user,
  workspaces,
  currentWorkspaceId,
}: {
  user: UserSummary;
  workspaces: WorkspaceOption[];
  currentWorkspaceId: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Close the mobile drawer once a link has navigated.
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:px-2">
        <Logo href="/dashboard" className="h-9 px-1 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" labelClassName="truncate group-data-[collapsible=icon]:hidden" />
        <WorkspaceSwitcher workspaces={workspaces} currentId={currentWorkspaceId} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-9 px-3 text-xs font-semibold tracking-wide text-faint uppercase">Menu</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {DASHBOARD_NAV.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                    className="h-11 gap-3 rounded-xl px-1.5 text-sm font-medium text-body hover:bg-muted hover:text-heading data-active:bg-sidebar-accent data-active:font-semibold data-active:text-heading group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden [&_svg]:size-4.5"
                  >
                    <IconTile tone={item.tone} active={active} className="group-hover/menu-button:scale-105">
                      <item.icon />
                    </IconTile>
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <div className="mt-auto p-3 group-data-[collapsible=icon]:hidden">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-tone-violet to-tone-pink p-4 text-primary-foreground shadow-lg shadow-tone-violet/25">
            <span aria-hidden className="absolute -top-8 -right-8 size-24 rounded-full bg-primary-foreground/15" />
            <span aria-hidden className="absolute -bottom-10 -left-6 size-20 rounded-full bg-primary-foreground/10" />
            <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur">
              <Sparkles className="size-4.5" />
            </span>
            <p className="relative mt-3 text-sm font-semibold">Build with your AI team</p>
            <p className="relative mt-1 text-xs text-primary-foreground/80">
              Agents that pick up issues and open pull requests for you.
            </p>
            <Link
              href="/dashboard/ai-team"
              className="relative mt-3 inline-flex h-8 items-center gap-1 rounded-lg bg-card px-3 text-xs font-semibold text-primary shadow-xs transition-transform outline-none hover:-translate-y-px focus-visible:ring-3 focus-visible:ring-primary-foreground/50"
            >
              Meet the team
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 group-data-[collapsible=icon]:px-2">
        <SidebarUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
