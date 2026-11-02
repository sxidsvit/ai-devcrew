import {
  Activity,
  Bot,
  GitPullRequest,
  LayoutDashboard,
  SlidersHorizontal,
  SquareKanban,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/dashboard/icon-tile";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  description: string;
};

export const DASHBOARD_NAV: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    tone: "blue",
    description: "A summary of your workspace and its repository.",
  },
  {
    title: "Board",
    href: "/dashboard/board",
    icon: SquareKanban,
    tone: "violet",
    description: "Plan work and track tasks as they move from backlog to done.",
  },
  {
    title: "AI Team",
    href: "/dashboard/ai-team",
    icon: Bot,
    tone: "pink",
    description: "The AI agents that work on this workspace's repository.",
  },
  {
    title: "Pull Requests",
    href: "/dashboard/pull-requests",
    icon: GitPullRequest,
    tone: "emerald",
    description: "Pull requests opened by your team and your AI agents.",
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    tone: "amber",
    description: "Everything that happened in this workspace, newest first.",
  },
];

export const SETTINGS_NAV: (NavItem & { slug: string })[] = [
  {
    slug: "account",
    title: "Account",
    href: "/dashboard/settings/account",
    icon: UserRound,
    tone: "cyan",
    description: "Your profile and the GitHub account your AI team works with.",
  },
  {
    slug: "workspace",
    title: "Workspace settings",
    href: "/dashboard/settings/workspace",
    icon: SlidersHorizontal,
    tone: "violet",
    description: "Rename this workspace and change its icon or logo.",
  },
  {
    slug: "workflow",
    title: "AI workflow",
    href: "/dashboard/settings/workflow",
    icon: Workflow,
    tone: "pink",
    description: "How the AI team picks up tasks from the board and merges its pull requests.",
  },
];

export function isNavActive(pathname: string, href: string) {
  // Overview is the dashboard root, so it only matches exactly.
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function navItemForPath(pathname: string) {
  return [...DASHBOARD_NAV, ...SETTINGS_NAV].find((item) => isNavActive(pathname, item.href));
}
