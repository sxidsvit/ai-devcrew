import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Dashed well with an icon, a short title and at most one action.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-xs">
        <Icon aria-hidden className="size-5" />
      </span>
      <p className="text-sm font-semibold text-heading">{title}</p>
      <p className="max-w-xs text-sm text-subtle">{description}</p>
      {action && (
        <Link href={action.href} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-1 h-10 px-4")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
