"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubIcon, GoogleIcon } from "@/components/auth/provider-icons";

type Provider = "google" | "github";

const PROVIDERS: { id: Provider; label: string; Icon: typeof GoogleIcon }[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
];

export function SocialButtons({ next, disabled }: { next?: string; disabled?: boolean }) {
  const [pending, setPending] = useState<Provider | null>(null);

  function start(provider: Provider) {
    setPending(provider);
    const query = next ? `?next=${encodeURIComponent(next)}` : "";
    window.location.href = `/api/auth/social/${provider}${query}`;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="h-10 gap-2 font-medium shadow-xs"
          disabled={disabled || pending !== null}
          onClick={() => start(id)}
        >
          {pending === id ? <Loader2 className="animate-spin" /> : <Icon className="size-4" />}
          {label}
        </Button>
      ))}
    </div>
  );
}
