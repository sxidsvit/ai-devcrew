import { CirclePlus, type LucideIcon } from "lucide-react";
import type { WorkspaceActivityKind } from "@/lib/activity";
import type { Tone } from "@/components/dashboard/icon-tile";
import { ACTIVITY_STYLES } from "@/components/ai-team/agent-styles";

export const WORKSPACE_ACTIVITY_STYLES: Record<WorkspaceActivityKind, { icon: LucideIcon; tone: Tone }> = {
  ...ACTIVITY_STYLES,
  task_created: { icon: CirclePlus, tone: "blue" },
};
