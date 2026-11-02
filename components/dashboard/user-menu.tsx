"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronsUpDown, Loader2, LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
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
import { IconTile } from "@/components/dashboard/icon-tile";
import { SETTINGS_NAV } from "@/components/dashboard/nav-items";
import { UserAvatar, type UserSummary } from "@/components/layout/user-avatar";

function UserIdentity({ user }: { user: UserSummary }) {
  return (
    <>
      <UserAvatar user={user} />
      <span className="grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium text-heading">{user.name || "Your account"}</span>
        <span className="truncate text-xs text-subtle">{user.email}</span>
      </span>
    </>
  );
}

// Settings links and sign out, shared by the sidebar footer and the header avatar.
function UserMenuContent({
  user,
  side,
  align,
}: {
  user: UserSummary;
  side: "top" | "right" | "bottom";
  align: "start" | "end";
}) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-64 min-w-56">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex items-center gap-2 px-1.5 py-1.5 font-normal">
          <UserIdentity user={user} />
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        {SETTINGS_NAV.map((item) => (
          <DropdownMenuLinkItem key={item.href} render={<Link href={item.href} />} className="gap-2.5 py-1.5">
            <IconTile tone={item.tone} className="size-7 [&_svg]:size-3.5">
              <item.icon />
            </IconTile>
            {item.title}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        closeOnClick={false}
        className="gap-2.5 py-1.5"
        disabled={signingOut}
        onClick={() => startSignOut(() => signOutAction())}
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 [&_svg]:size-3.5">
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
        </span>
        {signingOut ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function SidebarUserMenu({ user }: { user: UserSummary }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden" />}
          >
            <UserIdentity user={user} />
            <ChevronsUpDown className="ml-auto text-faint" />
          </DropdownMenuTrigger>
          <UserMenuContent user={user} side={isMobile ? "top" : "right"} align="end" />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function HeaderUserMenu({ user }: { user: UserSummary }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <UserMenuContent user={user} side="bottom" align="end" />
    </DropdownMenu>
  );
}
