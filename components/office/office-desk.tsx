"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AGENT_ROLE_LABELS, AGENT_STATUS_LABELS } from "@/lib/ai-team";
import { formatCents, timeAgo } from "@/lib/format";
import { OFFICE_FRAME_MS, type OfficeAgent, type OfficeSeat } from "@/lib/office";
import { cn } from "@/lib/utils";
import { MAX_REWORK_ROUNDS, TASK_RUN_STAGE_LABELS } from "@/lib/workflow";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { AgentAvatar } from "@/components/ai-team/agent-avatar";
import { budgetIndicatorClass, statusDotClass, StatusBadge } from "@/components/ai-team/agent-styles";

const IDLE_HINTS: Record<Exclude<OfficeAgent["status"], "working">, string> = {
  idle: "Waiting for the next task.",
  paused: "Paused. Turn it back on from its card to give it work.",
  over_budget: "Reached its monthly budget, so it can't start new work.",
};

// Steps through the typing frames while `playing`, and rests on the first frame otherwise.
function useTypingFrame(count: number, playing: boolean) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % count), OFFICE_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [count, playing]);

  return playing ? frame % count : 0;
}

function bubbleLabel(agent: OfficeAgent) {
  if (agent.status !== "working") return AGENT_STATUS_LABELS[agent.status];
  return agent.task ? `${TASK_RUN_STAGE_LABELS[agent.task.stage]} ${agent.task.key}` : "Working";
}

// Percentages of the scene, so the agent stays on its chair at any size.
const percent = (value: number, total: number) => `${(value / total) * 100}%`;

export function OfficeDesk({
  seat,
  agent,
  sceneWidth,
  sceneHeight,
}: {
  seat: OfficeSeat;
  agent: OfficeAgent;
  sceneWidth: number;
  sceneHeight: number;
}) {
  const { character } = seat;
  const working = agent.status === "working";
  const resting = agent.status === "paused" || agent.status === "over_budget";
  const frame = useTypingFrame(character.frames.length, working);
  const label = bubbleLabel(agent);

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={120}
        closeDelay={120}
        aria-label={`${agent.name}, ${AGENT_ROLE_LABELS[agent.role]}: ${label}`}
        className="group absolute rounded-2xl outline-none hover:z-30! focus-visible:z-30! focus-visible:ring-3 focus-visible:ring-ring/60 data-popup-open:z-30!"
        style={{
          left: percent(seat.x, sceneWidth),
          top: percent(seat.y, sceneHeight),
          width: percent(seat.width, sceneWidth),
          aspectRatio: `${character.width} / ${character.height}`,
          zIndex: seat.zIndex,
        }}
      >
        {/* A soft spotlight on the floor under the hovered agent */}
        <span
          aria-hidden
          className="absolute inset-x-[4%] bottom-0 h-[22%] scale-75 rounded-[50%] bg-brand-accent/45 opacity-0 blur-lg transition-[opacity,scale] duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-data-popup-open:scale-100 group-data-popup-open:opacity-100"
        />

        {/* The glow lives on its own layer so it doesn't replace the grayscale filter of a resting agent. */}
        <span className="absolute inset-0 group-hover:motion-safe:animate-office-glow group-hover:motion-reduce:drop-shadow-[0_0_10px_var(--color-primary)] group-focus-visible:motion-safe:animate-office-glow group-data-popup-open:motion-safe:animate-office-glow">
          <span
            className={cn(
              "absolute inset-0 origin-bottom transition-[translate,filter,opacity] duration-300 group-hover:-translate-y-[2%] group-data-popup-open:-translate-y-[2%]",
              !working && !resting && "motion-safe:animate-office-breathe",
              resting && "opacity-90 grayscale-60 group-hover:opacity-100 group-hover:grayscale-0",
            )}
          >
            {character.frames.map((src, index) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                draggable={false}
                sizes={`${Math.ceil((seat.width / sceneWidth) * 100)}vw`}
                className={cn("object-contain drop-shadow-md select-none", index !== frame && "opacity-0")}
              />
            ))}
          </span>
        </span>

        {/* Status bubble above the agent's head */}
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 @md:mb-2">
          <span key={label} className="block animate-in duration-300 fade-in zoom-in-90">
            <span
              className={cn(
                "relative flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-heading shadow-md @md:px-2.5 @md:py-1 @md:text-xs",
                working && "motion-safe:animate-office-float",
              )}
            >
              <span aria-hidden className="relative flex size-1.5 shrink-0 @md:size-2">
                {working && <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />}
                <span className={cn("relative size-full rounded-full", statusDotClass(agent.status))} />
              </span>
              <span className="max-w-24 truncate @lg:max-w-40">{label}</span>
              {working && <TypingDots />}
              <span aria-hidden className="absolute top-full left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b bg-card @md:size-2" />
            </span>
          </span>
        </span>
      </PopoverTrigger>

      <PopoverContent side="right" align="start" sideOffset={8} className="w-72 gap-0 rounded-xl p-0">
        <AgentDetails agent={agent} />
      </PopoverContent>
    </Popover>
  );
}

function TypingDots() {
  return (
    <span aria-hidden className="hidden items-center gap-0.5 @sm:flex">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1 rounded-full bg-subtle motion-safe:animate-office-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function AgentDetails({ agent }: { agent: OfficeAgent }) {
  const { task } = agent;
  const budgetRatio = agent.budgetCents > 0 ? agent.spentCents / agent.budgetCents : 0;

  return (
    <>
      <div className="flex items-start gap-3 p-4">
        <AgentAvatar role={agent.role} status={agent.status} size="sm" />
        <div className="min-w-0 flex-1">
          <PopoverTitle className="truncate text-sm font-semibold text-heading">{agent.name}</PopoverTitle>
          <p className="text-xs text-subtle">{AGENT_ROLE_LABELS[agent.role]}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div className="space-y-3 border-t p-4">
        {task ? (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Working on</p>
              <p className="line-clamp-2 text-sm text-heading">
                <span className="font-mono text-xs text-subtle">{task.key}</span> {task.title}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-body">{TASK_RUN_STAGE_LABELS[task.stage]}</span>
                <span className="text-subtle">
                  Turn {task.turns} of {task.maxTurns}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (task.turns / Math.max(1, task.maxTurns)) * 100)}%` }}
                />
              </div>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
              {task.branch && (
                <>
                  <dt className="text-subtle">Branch</dt>
                  <dd className="truncate font-mono text-body">{task.branch}</dd>
                </>
              )}
              {task.round > 0 && (
                <>
                  <dt className="text-subtle">Rework</dt>
                  <dd className="text-body">
                    Round {task.round} of {MAX_REWORK_ROUNDS}
                  </dd>
                </>
              )}
              <dt className="text-subtle">Started</dt>
              <dd className="text-body">{timeAgo(task.startedAt)}</dd>
            </dl>
          </>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide text-subtle uppercase">
              {agent.status === "working" ? "Working on" : "Last activity"}
            </p>
            {agent.lastActivity ? (
              <p className="text-sm text-heading">
                {agent.lastActivity.title} <span className="text-xs text-subtle">· {timeAgo(agent.lastActivity.createdAt)}</span>
              </p>
            ) : (
              <p className="text-sm text-subtle">No activity yet.</p>
            )}
            {agent.status !== "working" && <p className="text-xs text-subtle">{IDLE_HINTS[agent.status]}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1.5 border-t px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-subtle">Spent this month</span>
          <span className="font-medium text-heading">
            {formatCents(agent.spentCents)} of {formatCents(agent.budgetCents, { whole: true })}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", budgetIndicatorClass(budgetRatio))}
            style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
          />
        </div>
      </div>
    </>
  );
}
