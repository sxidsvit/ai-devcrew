import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  error: { Icon: AlertCircle, className: "border-destructive/30 bg-destructive/5 text-destructive" },
  success: { Icon: CheckCircle2, className: "border-success/30 bg-success/10 text-success" },
  info: { Icon: Info, className: "border-brand-soft bg-brand-tint text-primary-hover" },
};

export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  const { Icon, className: toneClass } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm", toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-5">{children}</div>
    </div>
  );
}
