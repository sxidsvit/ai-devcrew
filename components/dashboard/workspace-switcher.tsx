"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, LayoutGrid, Loader2, Plus } from "lucide-react";
import { selectWorkspaceAction } from "@/app/workspaces/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";

export type WorkspaceOption = {
  id: string;
  name: string;
  icon: string;
  logoUrl: string | null;
  repoFullName: string;
};

export function WorkspaceSwitcher({ workspaces, currentId }: { workspaces: WorkspaceOption[]; currentId: string }) {
  const { isMobile } = useSidebar();
  const [switching, startSwitch] = useTransition();
  const current = workspaces.find((workspace) => workspace.id === currentId) ?? workspaces[0];

  function select(id: string) {
    if (id === currentId) return;
    const formData = new FormData();
    formData.set("id", id);
    startSwitch(() => selectWorkspaceAction(formData));
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label={`Workspace: ${current.name}. Switch workspace`}
                className="border bg-card shadow-xs data-popup-open:bg-sidebar-accent group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden"
              />
            }
          >
            <WorkspaceAvatar icon={current.icon} logoUrl={current.logoUrl} size="sm" />
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium text-heading">{current.name}</span>
              <span className="truncate text-xs text-subtle">{current.repoFullName}</span>
            </span>
            {switching ? (
              <Loader2 className="ml-auto animate-spin text-faint" />
            ) : (
              <ChevronsUpDown className="ml-auto text-faint" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="start" sideOffset={8} className="w-64 min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem key={workspace.id} disabled={switching} onClick={() => select(workspace.id)} className="gap-2 py-1.5">
                  <WorkspaceAvatar
                    icon={workspace.icon}
                    logoUrl={workspace.logoUrl}
                    size="sm"
                    className="size-6 rounded-md [&_svg]:size-3.5"
                  />
                  <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                  {workspace.id === current.id && <Check className="text-primary" aria-label="Current workspace" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLinkItem render={<Link href="/workspaces/new" />} className="gap-2 py-1.5">
              <span className="flex size-6 items-center justify-center rounded-md border bg-card">
                <Plus className="size-3.5" />
              </span>
              Create new workspace
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem render={<Link href="/workspaces" />} className="gap-2 py-1.5">
              <span className="flex size-6 items-center justify-center rounded-md border bg-card">
                <LayoutGrid className="size-3.5" />
              </span>
              All workspaces
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
