"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { OFFICE_IDLE_REFRESH_MS, OFFICE_REFRESH_MS, type OfficeAgent } from "@/lib/office";
import { OFFICE_SCENE } from "@/lib/office-scene";
import { cn } from "@/lib/utils";
import { getOfficeAgentsAction } from "@/app/dashboard/ai-team/actions";
import { OfficeDesk } from "@/components/office/office-desk";

// The AI team at their desks. Each agent sits on a seat of the scene, in role order, and the
// statuses refresh in the background while the tab is visible.
export function AgentOffice({ agents: initialAgents, className }: { agents: OfficeAgent[]; className?: string }) {
  const [agents, setAgents] = useState(initialAgents);
  const [serverAgents, setServerAgents] = useState(initialAgents);

  // Take fresh server data after the page revalidates.
  if (initialAgents !== serverAgents) {
    setServerAgents(initialAgents);
    setAgents(initialAgents);
  }

  const working = agents.filter((agent) => agent.status === "working").length;
  useEffect(() => {
    let active = true;
    async function poll() {
      if (document.visibilityState !== "visible") return;
      const result = await getOfficeAgentsAction().catch(() => null);
      if (active && result) setAgents(result.agents);
    }
    const interval = window.setInterval(poll, working > 0 ? OFFICE_REFRESH_MS : OFFICE_IDLE_REFRESH_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [working]);

  const { width, height, seats } = OFFICE_SCENE;

  return (
    <div
      role="group"
      aria-label="Live agent office"
      className={cn("@container relative w-full overflow-hidden rounded-xl border bg-muted", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image src={OFFICE_SCENE.background} alt="" fill sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover select-none" draggable={false} />

      {seats.map((seat, index) => {
        const agent = agents[index];
        return agent ? <OfficeDesk key={seat.id} seat={seat} agent={agent} sceneWidth={width} sceneHeight={height} /> : null;
      })}

      <div className="pointer-events-none absolute top-2 left-2 z-40 flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium text-heading shadow-sm @md:top-3 @md:left-3 @md:px-2.5 @md:py-1 @md:text-xs">
        <span aria-hidden className="relative flex size-1.5 @md:size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-destructive/60" />
          <span className="relative size-full rounded-full bg-destructive" />
        </span>
        Live
        <span className="text-subtle" aria-live="polite">
          · {working} of {Math.min(agents.length, seats.length)} working
        </span>
      </div>
    </div>
  );
}
