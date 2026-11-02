"use server";

import { and, eq, gt, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agentActivities, agents, db, switchConnections, type NewAgentActivity } from "@/db";
import { getMonthlySpend, runCheckFor } from "@/lib/agent-budget";
import { getAgent, listAgentActivity, listOfficeAgents } from "@/lib/agents";
import {
  AGENT_BUDGET_MAX,
  AGENT_BUDGET_MIN,
  AGENT_DESCRIPTION_MAX,
  AGENT_INSTRUCTIONS_MAX,
  AGENT_INSTRUCTIONS_MIN,
  AGENT_SKILLS_MAX,
  isAgentSkill,
  SWITCH_TRUST_DEFAULT_INSTANCE,
  type AgentActivityItem,
  type AgentRole,
} from "@/lib/ai-team";
import { getDbUser } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import { encrypt } from "@/lib/crypto";
import type { OfficeAgent } from "@/lib/office";
import { generateAgentInstructions, isOpenAIConfigured } from "@/lib/openai";
import {
  getSwitchConnection,
  normalizeSwitchInstance,
  queueSwitchScans,
  resolveSwitchScope,
  setSwitchCostCap,
  switchClientFor,
  SwitchTrustError,
} from "@/lib/switch-trust";
import { AGENT_MAX_TURNS_MAX, AGENT_MAX_TURNS_MIN } from "@/lib/workflow";
import { getCurrentWorkspace } from "@/lib/workspaces";

const AI_TEAM_PATH = "/dashboard/ai-team";
const NO_OPENAI_KEY = "Add OPENAI_API_KEY to your environment to use AI features.";

export type AgentFormState = {
  error?: string;
  field?: "description" | "instructions" | "skills" | "budget" | "maxTurns";
  // Bumped on every successful save so the dialog can close itself.
  saved?: number;
};

async function requireWorkspace() {
  const user = await getDbUser();
  if (!user) redirect(`/sign-in?next=${AI_TEAM_PATH}`);
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");
  return { user, workspace };
}

export async function updateAgentAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const { workspace } = await requireWorkspace();

  const agent = await getAgent(workspace.id, formData.get("agentId")?.toString() ?? "");
  if (!agent) return { error: "This agent no longer exists. Close the dialog and refresh the page." };

  const description = formData.get("description")?.toString().trim() ?? "";
  const instructions = formData.get("instructions")?.toString().trim() ?? "";
  const skills = [...new Set(formData.getAll("skills").map(String))];
  const budget = Number(formData.get("budget")?.toString() ?? "");
  const maxTurns = Number(formData.get("maxTurns")?.toString() ?? "");
  const enabled = formData.get("enabled") === "on";

  if (description.length > AGENT_DESCRIPTION_MAX) {
    return { error: `Description must be ${AGENT_DESCRIPTION_MAX} characters or fewer.`, field: "description" };
  }
  if (instructions.length < AGENT_INSTRUCTIONS_MIN || instructions.length > AGENT_INSTRUCTIONS_MAX) {
    return {
      error: `Instructions must be between ${AGENT_INSTRUCTIONS_MIN} and ${AGENT_INSTRUCTIONS_MAX} characters.`,
      field: "instructions",
    };
  }
  if (skills.length === 0 || skills.length > AGENT_SKILLS_MAX || !skills.every(isAgentSkill)) {
    return { error: `Attach between 1 and ${AGENT_SKILLS_MAX} skills.`, field: "skills" };
  }
  if (!Number.isInteger(budget) || budget < AGENT_BUDGET_MIN || budget > AGENT_BUDGET_MAX) {
    return { error: `Budget must be a whole number from $${AGENT_BUDGET_MIN} to $${AGENT_BUDGET_MAX}.`, field: "budget" };
  }
  if (!Number.isInteger(maxTurns) || maxTurns < AGENT_MAX_TURNS_MIN || maxTurns > AGENT_MAX_TURNS_MAX) {
    return { error: `Max turns must be a whole number from ${AGENT_MAX_TURNS_MIN} to ${AGENT_MAX_TURNS_MAX}.`, field: "maxTurns" };
  }

  const budgetCents = budget * 100;
  const changes = [
    description !== agent.description && "description",
    instructions !== agent.instructions && "instructions",
    skills.join() !== agent.skills.join() && "skills",
    budgetCents !== agent.budgetCents && `budget (${formatCents(budgetCents, { whole: true })}/month)`,
    maxTurns !== agent.maxTurns && `max turns (${maxTurns})`,
    enabled !== agent.enabled && (enabled ? "resumed" : "paused"),
  ].filter((change): change is string => !!change);
  if (changes.length === 0) return { saved: Date.now() };

  // Say when a budget change blocks or unblocks runs, so the activity explains why the agent stopped or started.
  let budgetNote = "";
  if (budgetCents !== agent.budgetCents) {
    const spent = await getMonthlySpend(agent.id);
    const wasBlocked = runCheckFor({ ...agent, enabled: true }, spent).ok === false;
    const isBlocked = runCheckFor({ ...agent, enabled: true, budgetCents }, spent).ok === false;
    if (wasBlocked && !isBlocked) budgetNote = " Runs are no longer blocked by the budget.";
    if (!wasBlocked && isBlocked) budgetNote = ` This month's spend of ${formatCents(spent)} already uses the new budget, so runs are blocked.`;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(agents)
      .set({ description, instructions, skills, budgetCents, maxTurns, enabled, updatedAt: new Date() })
      .where(and(eq(agents.id, agent.id), eq(agents.workspaceId, workspace.id)));
    await tx.insert(agentActivities).values({
      workspaceId: workspace.id,
      agentId: agent.id,
      kind: "configured",
      title: "Configuration updated",
      detail: `Changed ${changes.join(", ")}.${budgetNote}`,
    });
  });

  await syncAgentWithSwitch(workspace.id, agent, budgetCents);

  revalidatePath(AI_TEAM_PATH);
  return { saved: Date.now() };
}

// Mirrors a changed budget to Switch Trust as the agent's cost cap. Switch scans only run when the user starts one.
// Best effort, so a Switch Trust outage never blocks saving an agent.
async function syncAgentWithSwitch(
  workspaceId: string,
  agent: { switchAgentId: string | null; budgetCents: number },
  budgetCents: number,
) {
  if (!agent.switchAgentId || budgetCents === agent.budgetCents) return;
  const connection = await getSwitchConnection(workspaceId);
  if (!connection) return;
  try {
    await setSwitchCostCap(switchClientFor(connection), agent.switchAgentId, budgetCents);
  } catch (error) {
    console.error("Switch Trust sync failed", error);
  }
}

// Drafts instructions from the dialog's unsaved description and skills. Nothing is stored until the user saves.
export async function generateInstructionsAction(input: {
  agentId: string;
  description: string;
  skills: string[];
}): Promise<{ instructions?: string; error?: string }> {
  const { workspace } = await requireWorkspace();
  if (!isOpenAIConfigured()) return { error: NO_OPENAI_KEY };

  const agent = typeof input?.agentId === "string" ? await getAgent(workspace.id, input.agentId) : null;
  if (!agent) return { error: "This agent no longer exists. Refresh the page." };

  const description = typeof input.description === "string" ? input.description.trim().slice(0, AGENT_DESCRIPTION_MAX) : "";
  const skills = Array.isArray(input.skills) ? input.skills.filter(isAgentSkill).slice(0, AGENT_SKILLS_MAX) : [];

  try {
    const instructions = await generateAgentInstructions({
      role: agent.role,
      description,
      skills,
      repoFullName: workspace.repoFullName,
    });
    return { instructions: instructions.slice(0, AGENT_INSTRUCTIONS_MAX) };
  } catch (error) {
    console.error("Instruction generation failed", error);
    return { error: "OpenAI couldn't write instructions right now. Please try again." };
  }
}

export type SwitchFormState = {
  error?: string;
  field?: "apiKey" | "instance";
  saved?: number;
};

// Saves the workspace's Switch Trust API key, then scans the whole team with it.
export async function connectSwitchTrustAction(_prev: SwitchFormState, formData: FormData): Promise<SwitchFormState> {
  const { workspace } = await requireWorkspace();

  const apiKey = formData.get("apiKey")?.toString().trim() ?? "";
  const instance = normalizeSwitchInstance(formData.get("instance")?.toString().trim() || SWITCH_TRUST_DEFAULT_INSTANCE);
  if (!instance) {
    return { error: `Enter your Switch Trust address, such as ${SWITCH_TRUST_DEFAULT_INSTANCE}.`, field: "instance" };
  }
  if (apiKey.length < 16 || apiKey.length > 512 || /\s/.test(apiKey)) {
    return { error: "Paste the API key from Settings → API keys in Switch Trust.", field: "apiKey" };
  }

  let scope: Awaited<ReturnType<typeof resolveSwitchScope>>;
  try {
    scope = await resolveSwitchScope({ instance, apiKey });
  } catch (error) {
    if (error instanceof SwitchTrustError) return { error: error.message, field: "apiKey" };
    console.error("Switch Trust connection failed", error);
    return { error: "Couldn't connect to Switch Trust. Please try again." };
  }

  const existing = await getSwitchConnection(workspace.id);
  const moved =
    !!existing && (existing.instance !== instance || existing.tenantId !== scope.tenantId || existing.switchWorkspaceId !== scope.workspaceId);
  const values = { apiKey: encrypt(apiKey), instance, tenantId: scope.tenantId, switchWorkspaceId: scope.workspaceId, updatedAt: new Date() };

  await db.transaction(async (tx) => {
    await tx
      .insert(switchConnections)
      .values({ workspaceId: workspace.id, ...values })
      .onConflictDoUpdate({ target: switchConnections.workspaceId, set: values });
    // Agent ids belong to the old Switch Trust workspace, so the agents register again on their next scan.
    if (moved) {
      await tx
        .update(agents)
        .set({ switchAgentId: null, switchScanStatus: null, switchScore: null, switchReport: null, switchScannedAt: null, switchError: null })
        .where(eq(agents.workspaceId, workspace.id));
    }
  });

  revalidatePath(AI_TEAM_PATH);
  return { saved: Date.now() };
}

export async function disconnectSwitchTrustAction(): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();
  await db.delete(switchConnections).where(eq(switchConnections.workspaceId, workspace.id));
  // Scans in flight fail on their next step, since the connection is gone.
  await db
    .update(agents)
    .set({ switchScanStatus: null, switchError: null })
    .where(and(eq(agents.workspaceId, workspace.id), inArray(agents.switchScanStatus, ["queued", "running"])));
  revalidatePath(AI_TEAM_PATH);
  return {};
}

// Red-teams the agent's saved configuration with Switch Trust. Pass no id to scan the whole team.
export async function scanWithSwitchAction(agentId?: string): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();
  if (!(await getSwitchConnection(workspace.id))) return { error: "Connect Switch Trust first." };

  let ids: string[];
  if (agentId === undefined) {
    const team = await db.query.agents.findMany({ where: eq(agents.workspaceId, workspace.id), columns: { id: true } });
    ids = team.map((agent) => agent.id);
  } else {
    const agent = typeof agentId === "string" ? await getAgent(workspace.id, agentId) : null;
    if (!agent) return { error: "This agent no longer exists. Refresh the page." };
    if (!agent.enabled) return { error: "Resume this agent before scanning it." };
    ids = [agent.id];
  }

  try {
    const queued = await queueSwitchScans(workspace.id, ids);
    if (queued.length === 0) return { error: "There are no active agents to scan." };
  } catch (error) {
    return { error: error instanceof SwitchTrustError ? error.message : "The scan couldn't start. Please try again." };
  }

  revalidatePath(AI_TEAM_PATH);
  return {};
}

export async function getAgentActivityAction(agentId: string): Promise<{ activity?: AgentActivityItem[]; error?: string }> {
  const { workspace } = await requireWorkspace();

  const agent = typeof agentId === "string" ? await getAgent(workspace.id, agentId) : null;
  if (!agent) return { error: "This agent no longer exists. Refresh the page." };

  return { activity: await listAgentActivity(workspace.id, agent.id) };
}

// Polled by the live office so desks follow the team's runs without a page refresh.
export async function getOfficeAgentsAction(): Promise<{ agents: OfficeAgent[] }> {
  const { workspace } = await requireWorkspace();
  return { agents: await listOfficeAgents(workspace) };
}

type SampleStep = Omit<NewAgentActivity, "workspaceId" | "agentId" | "createdAt"> & { minutesAgo: number };

const SAMPLE_ACTIVITY: Record<AgentRole, SampleStep[]> = {
  analyst: [
    { kind: "task_completed", title: "Broke down “Rate limit the public REST API”", detail: "4 tasks with acceptance criteria, 11 points in total.", costCents: 184, minutesAgo: 95 },
    { kind: "task_completed", title: "Wrote acceptance criteria for CSV export", detail: "Covered filters, time zones and files over 10,000 rows.", costCents: 96, minutesAgo: 60 * 6 },
    { kind: "task_started", title: "Researched webhook retry strategies", detail: "Compared exponential backoff in Stripe and GitHub docs.", costCents: 141, minutesAgo: 60 * 30 },
    { kind: "task_completed", title: "Triaged 6 new bug reports", detail: "2 duplicates closed, 1 escalated to urgent.", costCents: 212, minutesAgo: 60 * 52 },
  ],
  developer: [
    { kind: "task_started", title: "Started “Rate limit the public REST API”", detail: "Branch feat/DEV-128-rate-limit", costCents: 326, minutesAgo: 4 },
    { kind: "pr_opened", title: "Opened pull request #214 Responsive sidebar", detail: "6 files changed, +182 −47", costCents: 1240, minutesAgo: 60 * 3 },
    { kind: "error", title: "Build failed on feat/DEV-119", detail: "Type error in settings/actions.ts. Fixed and pushed again.", costCents: 418, minutesAgo: 60 * 9 },
    { kind: "pr_opened", title: "Opened pull request #209 Workspace logo upload", detail: "9 files changed, +341 −12", costCents: 1985, minutesAgo: 60 * 28 },
    { kind: "task_completed", title: "Upgraded Drizzle and regenerated migrations", detail: "No schema changes.", costCents: 672, minutesAgo: 60 * 75 },
  ],
  reviewer: [
    { kind: "review", title: "Requested changes on #214 Responsive sidebar", detail: "1 blocking: focus is lost when the sidebar collapses.", costCents: 388, minutesAgo: 60 * 2 },
    { kind: "review", title: "Approved #209 Workspace logo upload", detail: "Checked upload validation by bytes and owner-only access.", costCents: 455, minutesAgo: 60 * 26 },
    { kind: "review", title: "Flagged an N+1 query in #205", detail: "Suggested loading assignees in a single query.", costCents: 297, minutesAgo: 60 * 70 },
  ],
  tester: [
    { kind: "test_run", title: "Ran the full test suite on #214", detail: "212 passed, 1 failed (sidebar.test.tsx).", costCents: 534, minutesAgo: 60 * 2 + 20 },
    { kind: "test_run", title: "Verified #209 at 360px and in dark mode", detail: "All 5 acceptance criteria pass.", costCents: 610, minutesAgo: 60 * 25 },
    { kind: "error", title: "Reported flaky checkout test", detail: "Fails 1 in 10 runs waiting for the payment iframe.", costCents: 243, minutesAgo: 60 * 48 },
  ],
};

// Fills the activity of a workspace whose agents haven't run yet, so new users can see how it looks.
export async function addSampleActivityAction(): Promise<{ error?: string }> {
  const { workspace } = await requireWorkspace();

  const spent = await db.$count(
    agentActivities,
    and(eq(agentActivities.workspaceId, workspace.id), gt(agentActivities.costCents, 0)),
  );
  if (spent > 0) return { error: "Sample activity can only be added before your agents have run." };

  const team = await db.query.agents.findMany({ where: eq(agents.workspaceId, workspace.id) });
  const now = Date.now();
  const rows = team.flatMap((agent) =>
    SAMPLE_ACTIVITY[agent.role].map(({ minutesAgo, ...step }) => ({
      ...step,
      workspaceId: workspace.id,
      agentId: agent.id,
      createdAt: new Date(now - minutesAgo * 60_000),
    })),
  );
  // Sample rows are backdated and stay under the default budgets, so they skip recordAgentSpend's notices.
  if (rows.length > 0) await db.insert(agentActivities).values(rows);

  revalidatePath(AI_TEAM_PATH);
  return {};
}
