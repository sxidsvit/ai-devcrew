import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Code,
  FlaskConical,
  GitBranch,
  GitPullRequest,
  ScanEye,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MAX_REWORK_ROUNDS } from "@/lib/workflow";
import { buttonVariants } from "@/components/ui/button";
import { IconTile, type Tone } from "@/components/dashboard/icon-tile";
import { GitHubIcon } from "@/components/auth/provider-icons";
import { OfficePreview } from "@/components/landing/office-preview";
import { Logo } from "@/components/layout/logo";

const PIPELINE: { icon: LucideIcon; tone: Tone; role: string; title: string; text: string }[] = [
  {
    icon: ClipboardList,
    tone: "blue",
    role: "Analyst",
    title: "Plans the task",
    text: "Reads the task and your codebase, then writes a plan with acceptance criteria.",
  },
  {
    icon: Code,
    tone: "violet",
    role: "Developer",
    title: "Writes the code",
    text: "Commits the change to a new branch cut from your default branch.",
  },
  {
    icon: ScanEye,
    tone: "pink",
    role: "Reviewer",
    title: "Reviews the diff",
    text: "Checks correctness, security and performance, and sends the work back when it falls short.",
  },
  {
    icon: FlaskConical,
    tone: "emerald",
    role: "Tester",
    title: "Verifies and opens the PR",
    text: "Verifies the branch against the plan and opens a pull request on your repository.",
  },
];

const FEATURES: { icon: LucideIcon; tone: Tone; title: string; text: string }[] = [
  {
    icon: SquareKanban,
    tone: "violet",
    title: "A board synced with GitHub",
    text: "Plan bugs and features on a Kanban board. Repository issues show up on it automatically.",
  },
  {
    icon: Workflow,
    tone: "pink",
    title: "Hands-free pickup",
    text: "Turn on the AI workflow and the team takes the next Todo task as soon as the last one ends.",
  },
  {
    icon: GitPullRequest,
    tone: "emerald",
    title: "Pull requests and auto merge",
    text: "Merge from DevCrew or let auto merge do it. Conflicts and failing checks become a new task.",
  },
  {
    icon: Wallet,
    tone: "amber",
    title: "Budgets you control",
    text: "Each agent has a monthly budget and a turn limit, and every model call counts toward it.",
  },
  {
    icon: ShieldCheck,
    tone: "blue",
    title: "Guardrails on every run",
    text: "Agents write only to their run's branch, never to the default branch, workflows or .env files.",
  },
  {
    icon: BadgeCheck,
    tone: "cyan",
    title: "Trust scans",
    text: "Red-team your agents with Switch Trust and track their trust score alongside what they cost.",
  },
];

const SETUP = [
  { title: "Create your account", text: "Sign up with email, Google or GitHub." },
  { title: "Link a repository", text: "Name a workspace, connect GitHub and pick the repository your agents work on." },
  { title: "Add a task and run it", text: "Run a Todo task from the board and review the pull request when it lands." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const primary = user ? { href: "/workspaces", label: "Open your workspaces" } : { href: "/sign-up", label: "Get started" };

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium text-subtle md:flex">
              <a href="#how-it-works" className="hover:text-heading">
                How it works
              </a>
              <a href="#features" className="hover:text-heading">
                Features
              </a>
              <a href="#get-started" className="hover:text-heading">
                Get started
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/workspaces" className={buttonVariants({ size: "sm" })}>
                Dashboard
                <ArrowRight data-icon="inline-end" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_top,black_15%,transparent_65%)]"
          />
          <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 size-160 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-body shadow-xs">
              <Sparkles className="size-3.5 text-primary" />
              Analyst, Developer, Reviewer and Tester, working on your repo
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              An AI dev team that ships to <span className="text-primary">your GitHub repository</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-subtle sm:text-lg">
              Link a repository, add tasks to the board and let DevCrew&apos;s agents plan, build, review and verify the work, then open
              the pull request for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={primary.href} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full px-5 sm:w-auto")}>
                {primary.label}
                <ArrowRight data-icon="inline-end" />
              </Link>
              <a href="#how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-full px-5 sm:w-auto")}>
                See how it works
              </a>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-faint">
              <GitHubIcon className="size-3.5" />
              Works with public and private GitHub repositories
            </p>
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="overflow-hidden rounded-2xl border bg-card p-2 shadow-xl shadow-primary/10 sm:p-3">
              <div className="flex items-center gap-2 px-2 pb-2 sm:pb-3">
                <span aria-hidden className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                </span>
                <span className="mx-auto flex items-center gap-1.5 truncate rounded-md bg-muted px-3 py-0.5 font-mono text-xs text-subtle">
                  <GitBranch className="size-3 shrink-0" />
                  devcrew/acme-42-password-reset
                </span>
              </div>
              <OfficePreview className="rounded-xl border" />
            </div>
            <p className="mt-3 text-center text-xs text-faint">Hover an agent to see what it&apos;s working on.</p>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-14 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">From Todo to pull request, in four hand-offs</h2>
              <p className="mt-4 text-base text-subtle">
                Every task run moves through the same pipeline. Review and verification can send work back to the Developer up to{" "}
                {MAX_REWORK_ROUNDS} times before it ships.
              </p>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PIPELINE.map((step, index) => (
                <li key={step.role} className="relative rounded-2xl border bg-background p-6">
                  <div className="flex items-center justify-between">
                    <IconTile tone={step.tone} className="size-10 rounded-xl [&_svg]:size-5">
                      <step.icon />
                    </IconTile>
                    <span className="font-mono text-xs text-faint">0{index + 1}</span>
                  </div>
                  <p className="mt-5 text-xs font-semibold tracking-wide text-subtle uppercase">{step.role}</p>
                  <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm text-subtle">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-14">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">Everything the crew needs, nothing you have to babysit</h2>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-2xl border bg-card p-6 shadow-xs transition-colors hover:border-brand-accent"
                >
                  <IconTile tone={feature.tone} className="size-10 rounded-xl [&_svg]:size-5">
                    <feature.icon />
                  </IconTile>
                  <h3 className="mt-5 text-base font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm text-subtle">{feature.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="get-started" className="scroll-mt-14 px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-panel px-6 py-14 text-brand-panel-foreground sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,var(--brand-panel-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--brand-panel-foreground)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]"
            />
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-primary/40 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-balance text-brand-panel-foreground">Put your crew to work</h2>
                <p className="mt-4 max-w-md text-base text-faint">Set up a workspace in a couple of minutes. Your first task can run right after.</p>
                <Link href={primary.href} className={cn(buttonVariants({ size: "lg" }), "mt-8 h-10 px-5")}>
                  {primary.label}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
              <ol className="space-y-3">
                {SETUP.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-brand-panel-foreground/10 bg-brand-panel-foreground/5 p-4 backdrop-blur"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-brand-panel-foreground">{step.title}</p>
                      <p className="mt-0.5 text-sm text-faint">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-faint">© {new Date().getFullYear()} DevCrew. All rights reserved.</p>
          <nav aria-label="Account" className="flex items-center gap-4 text-sm font-medium text-subtle">
            {user ? (
              <Link href="/workspaces" className="hover:text-primary">
                Workspaces
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hover:text-primary">
                  Sign in
                </Link>
                <Link href="/sign-up" className="hover:text-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
