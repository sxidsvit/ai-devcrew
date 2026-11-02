import { NextResponse } from "next/server";
import { verifyJobSignature } from "@/lib/jobs";
import { runTaskRunJob, type TaskRunJob } from "@/lib/task-runs";

export const maxDuration = 300;

const UUID = /^[0-9a-f-]{36}$/i;

// Cloudhike Jobs calls this for each step of a task run started by startTaskRun() in lib/task-runs.ts.
// Only requests signed with JOBS_API_KEY are accepted.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyJobSignature(request.headers.get("x-cloudhike-signature"), raw)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let job: TaskRunJob;
  try {
    job = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  }
  if (!UUID.test(job?.workspaceId) || !UUID.test(job?.runId) || !Number.isInteger(job?.step) || !Number.isInteger(job?.attempt)) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  }

  await runTaskRunJob(job);
  return NextResponse.json({ ok: true });
}
