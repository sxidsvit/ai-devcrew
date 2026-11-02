import type { AgentRole, AgentStatus } from "@/lib/ai-team";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/dashboard/icon-tile";
import { ROLE_STYLES, statusDotClass } from "@/components/ai-team/agent-styles";

// An agent's identity: its role icon on a filled tone tile, with an optional status dot.
export function AgentAvatar({
  role,
  status,
  size = "md",
  className,
}: {
  role: AgentRole;
  status?: AgentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { icon: Icon, tone } = ROLE_STYLES[role];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <IconTile
        tone={tone}
        active
        className={cn(
          size === "sm" && "size-8 rounded-lg [&_svg]:size-4",
          size === "md" && "size-12 rounded-2xl [&_svg]:size-5.5",
          size === "lg" && "size-14 rounded-2xl [&_svg]:size-6.5",
        )}
      >
        <Icon />
      </IconTile>
      {status && (
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-card",
            size === "sm" ? "size-2.5" : "size-3",
            statusDotClass(status),
          )}
        />
      )}
    </span>
  );
}
