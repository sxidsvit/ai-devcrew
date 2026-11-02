"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { signUpAction, type AuthFormState } from "@/app/(auth)/actions";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/ui/form-alert";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Divider, PasswordInput, PasswordStrength, SubmitButton } from "@/components/auth/form-parts";
import { cn } from "@/lib/utils";

export function SignUpForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signUpAction, {});
  const [password, setPassword] = useState("");

  if (state.notice) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-primary/5 text-foreground ring-1 ring-border">
          <MailCheck className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">{state.notice}</p>
        <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "mt-8 h-10 w-full")}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Get started in less than a minute.</p>
      </div>

      <SocialButtons next={next} disabled={pending} />
      <Divider />

      <form action={formAction} className="space-y-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        {state.error && <FormAlert tone="error">{state.error}</FormAlert>}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            defaultValue={state.values?.name}
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            defaultValue={state.values?.email}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordStrength password={password} />
        </div>

        <SubmitButton pending={pending}>{pending ? "Creating account…" : "Create account"}</SubmitButton>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          By creating an account, you agree to our{" "}
          <span className="text-foreground underline underline-offset-4">Terms of Service</span> and{" "}
          <span className="text-foreground underline underline-offset-4">Privacy Policy</span>.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
