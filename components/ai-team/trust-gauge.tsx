import { cn } from "@/lib/utils";
import { trustLevel } from "@/components/ai-team/agent-styles";

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A ring that fills with the trust score, colored by its level.
export function TrustGauge({ score, className }: { score: number | null; className?: string }) {
  const level = trustLevel(score);
  const offset = CIRCUMFERENCE * (1 - (score ?? 0) / 100);

  return (
    <div className={cn("relative size-24 shrink-0", className)} role="img" aria-label={score === null ? "Not scanned" : `Trust score ${score} out of 100`}>
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="7" className="stroke-border" />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-[stroke-dashoffset] duration-700 ease-out", level.text)}
        />
      </svg>
      <span aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tracking-tight text-heading">{score ?? "–"}</span>
        <span className="text-[0.625rem] font-medium tracking-wide text-faint uppercase">of 100</span>
      </span>
    </div>
  );
}
