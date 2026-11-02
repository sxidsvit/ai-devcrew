import type { WorkspaceActivityItem } from "@/lib/activity";
import { formatCents, timeAgo } from "@/lib/format";
import { IconTile } from "@/components/dashboard/icon-tile";
import { WORKSPACE_ACTIVITY_STYLES } from "@/components/activity/activity-styles";

export function ActivityTimeline({ activity }: { activity: WorkspaceActivityItem[] }) {
  return (
    <ol aria-label="Workspace activity" className="relative space-y-5">
      {/* The timeline's spine, behind the icons. */}
      <span aria-hidden className="absolute top-2 bottom-2 left-4 w-px bg-border" />
      {activity.map((item) => {
        const { icon: Icon, tone } = WORKSPACE_ACTIVITY_STYLES[item.kind];
        return (
          <li key={item.id} className="relative flex gap-3">
            {/* Opaque backing so the spine doesn't show through the soft tile. */}
            <span className="h-fit rounded-lg bg-card ring-4 ring-card">
              <IconTile tone={tone} className="[&_svg]:size-4">
                <Icon />
              </IconTile>
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm text-body">
                  <span className="font-medium text-heading">{item.actor}</span> · {item.title}
                </p>
                {item.costCents > 0 && (
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-body ring-1 ring-border ring-inset">
                    {formatCents(item.costCents)}
                  </span>
                )}
              </div>
              {item.detail && <p className="mt-0.5 text-sm break-words text-subtle">{item.detail}</p>}
              <time dateTime={item.createdAt} className="mt-1 block text-xs text-faint">
                {timeAgo(item.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
