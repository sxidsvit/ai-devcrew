import { NextResponse } from "next/server";
import { verifyJobSignature } from "@/lib/jobs";
import { runSwitchScanJob, type SwitchScanJob } from "@/lib/switch-scan";

export const maxDuration = 120;

const UUID = /^[0-9a-f-]{36}$/i;

// Cloudhike Jobs calls this for each step of a Switch Trust scan queued by queueSwitchScans() in lib/switch-trust.ts.
// Only requests signed with JOBS_API_KEY are accepted.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyJobSignature(request.headers.get("x-cloudhike-signature"), raw)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let job: SwitchScanJob;
  try {
    job = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  }
  if (!UUID.test(job?.workspaceId) || !UUID.test(job?.agentId) || Number.isNaN(Date.parse(job?.scanId))) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  }

  await runSwitchScanJob(job);
  return NextResponse.json({ ok: true });
}
