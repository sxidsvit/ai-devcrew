"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentSummary } from "@/lib/ai-team";
import { AgentActivitySheet } from "@/components/ai-team/agent-activity-sheet";
import { AgentCard } from "@/components/ai-team/agent-card";
import { AgentConfigDialog } from "@/components/ai-team/agent-config-dialog";

const SWITCH_REFRESH_MS = 3_000;

export function AgentGrid({
  agents,
  repoFullName,
  aiEnabled,
  switchConnected,
}: {
  agents: AgentSummary[];
  repoFullName: string;
  aiEnabled: boolean;
  switchConnected: boolean;
}) {
  const router = useRouter();
  const scanning = agents.some((agent) => agent.switch.status === "queued" || agent.switch.status === "running");

  // Switch scans finish in the background, so refresh until they're done.
  useEffect(() => {
    if (!scanning) return;
    const timer = setInterval(() => router.refresh(), SWITCH_REFRESH_MS);
    return () => clearInterval(timer);
  }, [scanning, router]);

  // Ids rather than agents, so the dialog and drawer pick up fresh data after a save or scan.
  const [configId, setConfigId] = useState<string | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);

  const closeConfig = useCallback((open: boolean) => {
    if (!open) setConfigId(null);
  }, []);
  const closeActivity = useCallback((open: boolean) => {
    if (!open) setActivityId(null);
  }, []);

  return (
    <>
      <section aria-label="Agents" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onConfigure={() => setConfigId(agent.id)}
            onViewActivity={() => setActivityId(agent.id)}
          />
        ))}
      </section>

      <AgentConfigDialog
        agent={agents.find((agent) => agent.id === configId) ?? null}
        repoFullName={repoFullName}
        aiEnabled={aiEnabled}
        switchConnected={switchConnected}
        onOpenChange={closeConfig}
      />
      <AgentActivitySheet agent={agents.find((agent) => agent.id === activityId) ?? null} onOpenChange={closeActivity} />
    </>
  );
}
