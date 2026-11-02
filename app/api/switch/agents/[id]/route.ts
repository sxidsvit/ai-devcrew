import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { agents, db } from "@/db";
import { AgentRunBlockedError, assertAgentCanRun } from "@/lib/agent-budget";
import { isOpenAIConfigured, runAgentPrompt } from "@/lib/openai";
import { verifySwitchEvalToken } from "@/lib/switch-trust";

const MAX_INPUT_LENGTH = 20_000;

// Switch Trust's evaluation worker sends red-team prompts here as {"input": "..."} and reads {"output": "..."}.
// It authenticates with the per-agent bearer token set by the scan in lib/switch-scan.ts.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !token || !verifySwitchEvalToken(id, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agent = await db.query.agents.findFirst({ where: eq(agents.id, id) });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Only answer during a scan started from DevCrew, so a leaked token can't run up model spend.
  if (agent.switchScanStatus !== "running") {
    return NextResponse.json({ error: "No Switch scan is running for this agent." }, { status: 409 });
  }
  if (!isOpenAIConfigured()) return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { input?: unknown } | null;
  const input = typeof body?.input === "string" ? body.input.slice(0, MAX_INPUT_LENGTH) : "";
  if (!input.trim()) return NextResponse.json({ error: "input is required" }, { status: 400 });

  try {
    await assertAgentCanRun(agent.workspaceId, agent.id);
  } catch (error) {
    if (error instanceof AgentRunBlockedError) return NextResponse.json({ error: error.message }, { status: 429 });
    throw error;
  }

  try {
    const { text, costCents } = await runAgentPrompt(agent, input);
    // Calls cost fractions of a cent, so they add up here and are recorded as one activity when the scan ends.
    await db
      .update(agents)
      .set({ switchScanCostCents: sql`${agents.switchScanCostCents} + ${costCents}` })
      .where(eq(agents.id, agent.id));
    return NextResponse.json({ output: text });
  } catch (error) {
    console.error("Switch evaluation prompt failed", error);
    return NextResponse.json({ error: "The agent couldn't answer." }, { status: 502 });
  }
}
