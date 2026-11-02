"use client";

import { usePathname } from "next/navigation";
import { navItemForPath } from "@/components/dashboard/nav-items";

// Names the current dashboard section in the header.
export function PageTitle() {
  const pathname = usePathname();
  const item = navItemForPath(pathname);

  return <p className="truncate text-sm font-semibold text-heading">{item?.title ?? "Dashboard"}</p>;
}
