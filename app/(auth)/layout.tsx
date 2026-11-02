import { redirect } from "next/navigation";
import { GitBranch, ShieldCheck, Users, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";

const HIGHLIGHTS = [
  { Icon: Users, title: "Built for teams", text: "Bring your whole crew into one shared workspace." },
  { Icon: GitBranch, title: "Ship faster", text: "Plan, build and review without switching tools." },
  { Icon: ShieldCheck, title: "Secure by default", text: "Sessions stay in HTTP-only cookies, never in page scripts." },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/workspaces");

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-95">{children}</div>
        </main>
        <p className="text-center text-xs text-faint lg:text-left">
          © {new Date().getFullYear()} DevCrew. All rights reserved.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-brand-panel text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[linear-gradient(to_right,var(--brand-panel-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--brand-panel-foreground)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-130 rounded-full bg-primary/35 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-24 size-105 rounded-full bg-brand-accent/20 blur-3xl" />

        <div className="relative inline-flex w-fit items-center gap-2 rounded-full border border-brand-panel-foreground/10 bg-brand-panel-foreground/5 px-3 py-1 text-xs font-medium text-brand-soft backdrop-blur">
          <Zap className="size-3.5 text-warning" />
          Everything your dev team needs
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-brand-panel-foreground">
            Where great engineering teams build together.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand-panel-foreground/10 bg-brand-panel-foreground/5">
                  <Icon className="size-4 text-brand-soft" />
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-panel-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-faint">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-4 rounded-2xl border border-brand-panel-foreground/10 bg-brand-panel-foreground/5 p-5 backdrop-blur">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-brand-accent text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <p className="text-sm leading-6 text-brand-soft">
            Sign in with Google, GitHub or your email. One account, every device.
          </p>
        </div>
      </aside>
    </div>
  );
}
