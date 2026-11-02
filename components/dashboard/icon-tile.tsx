import { cn } from "@/lib/utils";

export type Tone = "blue" | "violet" | "pink" | "emerald" | "amber" | "cyan";

// Full class strings so Tailwind can see them.
const TONES: Record<Tone, { soft: string; solid: string }> = {
  blue: { soft: "bg-tone-blue/12 text-tone-blue", solid: "bg-tone-blue shadow-tone-blue/40" },
  violet: { soft: "bg-tone-violet/12 text-tone-violet", solid: "bg-tone-violet shadow-tone-violet/40" },
  pink: { soft: "bg-tone-pink/12 text-tone-pink", solid: "bg-tone-pink shadow-tone-pink/40" },
  emerald: { soft: "bg-tone-emerald/12 text-tone-emerald", solid: "bg-tone-emerald shadow-tone-emerald/40" },
  amber: { soft: "bg-tone-amber/15 text-tone-amber", solid: "bg-tone-amber shadow-tone-amber/40" },
  cyan: { soft: "bg-tone-cyan/12 text-tone-cyan", solid: "bg-tone-cyan shadow-tone-cyan/40" },
};

// A colored rounded square behind an icon. `active` fills it with the tone and adds a soft glow.
export function IconTile({
  tone,
  active = false,
  className,
  children,
}: {
  tone: Tone;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
        active ? cn(TONES[tone].solid, "text-primary-foreground shadow-md") : TONES[tone].soft,
        className,
      )}
    >
      {children}
    </span>
  );
}
