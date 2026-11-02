import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  labelClassName,
}: {
  href?: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <Link href={href} className={cn("flex w-fit items-center gap-2.5 font-semibold tracking-tight text-heading", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        D
      </span>
      <span className={labelClassName}>DevCrew</span>
    </Link>
  );
}
