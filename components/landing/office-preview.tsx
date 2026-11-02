import Image from "next/image";
import type { OfficeAgent } from "@/lib/office";
import { OFFICE_SCENE } from "@/lib/office-scene";
import { cn } from "@/lib/utils";
import { OfficeDesk } from "@/components/office/office-desk";

const MINUTE = 60_000;

// A sample team mid-task, so visitors can see the office the way a workspace does.
function sampleAgents(now: number): OfficeAgent[] {
  const ago = (minutes: number) => new Date(now - minutes * MINUTE).toISOString();
  const task = (stage: NonNullable<OfficeAgent["task"]>["stage"], turns: number, maxTurns: number) => ({
    key: "ACME-42",
    title: "Add password reset emails",
    stage,
    turns,
    maxTurns,
    round: 1,
    branch: "devcrew/acme-42-password-reset",
    startedAt: ago(6),
  });

  return [
    {
      id: "sample-analyst",
      role: "analyst",
      name: "Analyst",
      status: "idle",
      task: null,
      lastActivity: { title: "Planned ACME-42 Add password reset emails", createdAt: ago(7) },
      spentCents: 420,
      budgetCents: 5000,
    },
    {
      id: "sample-developer",
      role: "developer",
      name: "Developer",
      status: "working",
      task: task("development", 9, 30),
      lastActivity: { title: "Wrote app/api/reset/route.ts", createdAt: ago(1) },
      spentCents: 3180,
      budgetCents: 20000,
    },
    {
      id: "sample-reviewer",
      role: "reviewer",
      name: "Reviewer",
      status: "idle",
      task: null,
      lastActivity: { title: "Approved ACME-41 Fix mobile nav overflow", createdAt: ago(48) },
      spentCents: 960,
      budgetCents: 8000,
    },
    {
      id: "sample-tester",
      role: "tester",
      name: "Tester",
      status: "idle",
      task: null,
      lastActivity: { title: "Opened pull request #87", createdAt: ago(44) },
      spentCents: 1240,
      budgetCents: 10000,
    },
  ];
}

export function OfficePreview({ className }: { className?: string }) {
  const { width, height, seats, background } = OFFICE_SCENE;
  const agents = sampleAgents(Date.now());

  return (
    <div
      role="group"
      aria-label="Example of the agent office"
      className={cn("@container relative w-full overflow-hidden bg-muted", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Image src={background} alt="" fill priority sizes="(min-width: 1152px) 1088px, 100vw" className="object-cover select-none" draggable={false} />
      {seats.map((seat, index) => {
        const agent = agents[index];
        return agent ? <OfficeDesk key={seat.id} seat={seat} agent={agent} sceneWidth={width} sceneHeight={height} /> : null;
      })}
    </div>
  );
}
