import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { OfficeAgent } from "@/lib/office";
import { AgentOffice } from "@/components/office/agent-office";

export function TeamStatus({ agents }: { agents: OfficeAgent[] }) {
  return (
    <section className="flex flex-col rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold tracking-tight">AI team</h2>
        <Link
          href="/dashboard/ai-team"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary outline-none hover:text-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          View team
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="flex flex-1 items-center px-6 pb-6">
        <AgentOffice agents={agents} />
      </div>
    </section>
  );
}
