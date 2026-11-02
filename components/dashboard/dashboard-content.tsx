"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/components/dashboard/nav-items";

// Pages that need the full width, like the Kanban board; the rest stay at max-w-6xl.
const WIDE_PAGES = ["/dashboard/board"];

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = WIDE_PAGES.some((href) => isNavActive(pathname, href));

  return (
    <div className={cn("mx-auto w-full px-4 py-10 sm:px-6 sm:py-14", wide ? "max-w-[100rem]" : "max-w-6xl")}>{children}</div>
  );
}
