import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listAgentSummaries, listOfficeAgents } from "@/lib/agents";
import { getDbUser } from "@/lib/auth";
import { isOpenAIConfigured } from "@/lib/openai";
import { getSwitchConnection, getSwitchOverview } from "@/lib/switch-trust";
import { getCurrentWorkspace } from "@/lib/workspaces";
import { FormAlert } from "@/components/ui/form-alert";
import { AgentGrid } from "@/components/ai-team/agent-grid";
import { SwitchTrustCard } from "@/components/ai-team/switch-trust-card";
import { TeamStats } from "@/components/ai-team/team-stats";
import { AgentOffice } from "@/components/office/agent-office";

export const metadata: Metadata = { title: "AI Team · DevCrew" };

export default async function AiTeamPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/dashboard/ai-team");

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect("/workspaces/new");

  const [agents, officeAgents, switchConnection] = await Promise.all([
    listAgentSummaries(workspace),
    listOfficeAgents(workspace),
    getSwitchConnection(workspace.id),
  ]);
  const switchOverview = switchConnection ? await getSwitchOverview(switchConnection) : null;
  const aiEnabled = isOpenAIConfigured();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">AI Team</h1>
        <p className="text-base text-subtle">
          The agents working on <span className="font-mono text-body">{workspace.repoFullName}</span>. Tune how each one works and
          keep an eye on what it spends.
        </p>
      </div>

      {!aiEnabled && (
        <FormAlert tone="info">
          Add <span className="font-mono">OPENAI_API_KEY</span> to your environment to write agent instructions with AI and add
          an OpenAI review to trust scans.
        </FormAlert>
      )}

      <TeamStats agents={agents} />

      {!switchOverview && <SwitchTrustCard key={`switch-${workspace.id}`} />}

      {/* Keyed by workspace so switching workspaces closes any open dialog. */}
      <AgentGrid
        key={workspace.id}
        agents={agents}
        repoFullName={workspace.repoFullName}
        aiEnabled={aiEnabled}
        switchConnected={!!switchOverview}
      />

      <section aria-labelledby="office-title" className="rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h2 id="office-title" className="text-base font-semibold tracking-tight">
            Live agent office
          </h2>
          <p className="text-sm text-subtle">Watch your agents at their desks. Hover over an agent to see what it&apos;s working on.</p>
        </div>
        <AgentOffice key={workspace.id} agents={officeAgents} className="mt-5" />
      </section>
    </div>
  );
}
