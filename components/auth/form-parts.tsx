"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="h-10 w-full text-sm font-medium" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export function Divider() {
  return (
    <div className="relative my-6 flex items-center">
      <div className="flex-1 border-t" />
      <span className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        or continue with email
      </span>
      <div className="flex-1 border-t" />
    </div>
  );
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

function scorePassword(pw: string) {
  if (pw.length < 8) return 0;
  let score = 1;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) {
    return <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>;
  }
  const score = scorePassword(password);
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-muted transition-colors",
              score >= i && STRENGTH_COLORS[score],
              score === 0 && i === 1 && "bg-destructive",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{STRENGTH_LABELS[score]}</span>
      </p>
    </div>
  );
}
