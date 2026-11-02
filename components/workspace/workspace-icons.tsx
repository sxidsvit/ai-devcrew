import {
  Bot,
  Boxes,
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Built-in workspace icons. The key is what we store in workspaces.icon.
export const WORKSPACE_ICONS = {
  rocket: Rocket,
  code: Code2,
  terminal: Terminal,
  bot: Bot,
  sparkles: Sparkles,
  zap: Zap,
  layers: Layers,
  boxes: Boxes,
  cpu: Cpu,
  database: Database,
  globe: Globe,
  shield: Shield,
} satisfies Record<string, LucideIcon>;

export type WorkspaceIconKey = keyof typeof WORKSPACE_ICONS;

export const DEFAULT_WORKSPACE_ICON: WorkspaceIconKey = "rocket";

export function isWorkspaceIcon(value: unknown): value is WorkspaceIconKey {
  return typeof value === "string" && Object.hasOwn(WORKSPACE_ICONS, value);
}
