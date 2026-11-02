"use client";

import { startTransition, useActionState } from "react";
import { ExternalLink, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { SWITCH_TRUST_DEFAULT_INSTANCE } from "@/lib/ai-team";
import { connectSwitchTrustAction, type SwitchFormState } from "@/app/dashboard/ai-team/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconTile } from "@/components/dashboard/icon-tile";

const DOCS_URL = "https://docs.switchagents.ai/switch-trust/admin/api-keys";

// Shown only until Switch Trust is connected; afterwards TeamStats carries the scores and spend.
export function SwitchTrustCard() {
  const [state, dispatch, pending] = useActionState<SwitchFormState, FormData>(connectSwitchTrustAction, {});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <section aria-labelledby="switch-trust-title" className="rounded-2xl border bg-card p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <IconTile tone="blue" active className="size-10 rounded-xl [&_svg]:size-5">
          <ShieldCheck />
        </IconTile>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 id="switch-trust-title" className="text-lg font-semibold tracking-tight">
            Switch Trust and ROI
          </h2>
          <p className="text-sm text-subtle">
            Switch Trust attacks each agent with hostile prompts and scores how well it holds up. Scan an agent, or the whole
            team, whenever you want a fresh score.
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4 border-t pt-5">
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="switch-api-key">API key</Label>
            <Input
              id="switch-api-key"
              name="apiKey"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk_…"
              className="font-mono"
              aria-invalid={state.field === "apiKey" || undefined}
              aria-describedby="switch-api-key-hint"
            />
            <p id="switch-api-key-hint" className="text-xs text-subtle">
              Create one in Switch Trust under Settings, then API keys, with the Editor role.{" "}
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary-hover">
                How to create a key
                <ExternalLink aria-hidden className="size-3" />
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="switch-instance">Switch Trust address</Label>
            <Input
              id="switch-instance"
              name="instance"
              type="url"
              defaultValue={SWITCH_TRUST_DEFAULT_INSTANCE}
              spellCheck={false}
              aria-invalid={state.field === "instance" || undefined}
              aria-describedby="switch-instance-hint"
            />
            <p id="switch-instance-hint" className="text-xs text-faint">
              Change it only if your organization has its own instance.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="h-10 px-5" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            {pending ? "Connecting…" : "Connect"}
          </Button>
        </div>
      </form>
    </section>
  );
}
