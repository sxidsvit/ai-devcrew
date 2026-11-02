import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import type { WorkspaceActivityItem } from "@/lib/activity";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/dashboard/empty-state";
import { IconTile } from "@/components/dashboard/icon-tile";
import { WORKSPACE_ACTIVITY_STYLES } from "@/components/activity/activity-styles";

export function RecentActivity({ activity }: { activity: WorkspaceActivityItem[] }) {
  return (
    <section className="rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold tracking-tight">Recent activity</h2>
        <Link
          href="/dashboard/activity"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>
      {activity.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Tasks you create and work your AI team does will show up here."
          className="mx-6 mb-6"
        />
      ) : (
        <ul className="divide-y border-t">
          {activity.map((item) => {
            const { icon: Icon, tone } = WORKSPACE_ACTIVITY_STYLES[item.kind];
            return (
              <li key={item.id} className="flex items-center gap-3 px-6 py-3.5">
                <IconTile tone={tone} className="[&_svg]:size-4">
                  <Icon />
                </IconTile>
                <p className="min-w-0 flex-1 truncate text-sm text-body">
                  <span className="font-medium text-heading">{item.actor}</span> · {item.title}
                </p>
                <time dateTime={item.createdAt} className="shrink-0 text-xs text-subtle">
                  {timeAgo(item.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
