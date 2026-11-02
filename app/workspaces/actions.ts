"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, githubConnections, workspaces } from "@/db";
import { getDbUser } from "@/lib/auth";
import { connectionToken, getGithubConnection, getRepo, GithubAuthError } from "@/lib/github";
import { putObject } from "@/lib/storage";
import { getWorkspace, setCurrentWorkspace } from "@/lib/workspaces";
import { logoObjectKey, readLogoUpload } from "@/lib/workspace-logo";
import { WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from "@/lib/workspace-limits";
import { isWorkspaceIcon } from "@/components/workspace/workspace-icons";

export type CreateWorkspaceState = {
  error?: string;
  field?: "name" | "logo" | "repo" | "github";
};

export async function createWorkspaceAction(
  _prev: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/workspaces/new");

  const name = formData.get("name")?.toString().trim() ?? "";
  const icon = formData.get("icon");
  const logo = formData.get("logo");
  const repoId = Number(formData.get("repoId"));

  if (name.length < WORKSPACE_NAME_MIN || name.length > WORKSPACE_NAME_MAX) {
    return {
      error: `Workspace name must be between ${WORKSPACE_NAME_MIN} and ${WORKSPACE_NAME_MAX} characters.`,
      field: "name",
    };
  }
  if (!isWorkspaceIcon(icon)) return { error: "Choose a workspace icon.", field: "name" };
  if (!Number.isSafeInteger(repoId) || repoId <= 0) {
    return { error: "Select a GitHub repository for this workspace.", field: "repo" };
  }

  const upload = await readLogoUpload(logo);
  if ("error" in upload) return { error: upload.error, field: "logo" };
  const logoFile = upload.file;

  const connection = await getGithubConnection(user.id);
  if (!connection) return { error: "Connect your GitHub account first.", field: "github" };

  // Re-read the repository with the user's token: confirms access and gives canonical data.
  let repo;
  try {
    repo = await getRepo(connectionToken(connection), repoId);
  } catch (error) {
    if (error instanceof GithubAuthError) {
      await db.delete(githubConnections).where(eq(githubConnections.id, connection.id));
      return { error: error.message, field: "github" };
    }
    return { error: "We couldn't access that repository. Pick another one or try again.", field: "repo" };
  }

  const id = randomUUID();
  let logoKey: string | null = null;
  if (logoFile) {
    logoKey = logoObjectKey(id, logoFile.ext);
    try {
      await putObject(logoKey, logoFile.bytes, logoFile.type);
    } catch (error) {
      console.error("Workspace logo upload failed", error);
      return { error: "We couldn't upload your logo. Please try again.", field: "logo" };
    }
  }

  await db.insert(workspaces).values({
    id,
    ownerId: user.id,
    name,
    icon,
    logoKey,
    repoId: repo.id,
    repoFullName: repo.fullName,
    repoUrl: repo.htmlUrl,
    repoDefaultBranch: repo.defaultBranch,
    repoPrivate: repo.private,
  });

  await setCurrentWorkspace(id);
  redirect("/dashboard");
}

export async function selectWorkspaceAction(formData: FormData) {
  const user = await getDbUser();
  if (!user) redirect("/sign-in?next=/workspaces");

  const workspace = await getWorkspace(user.id, formData.get("id")?.toString() ?? "");
  if (!workspace) redirect("/workspaces");

  await setCurrentWorkspace(workspace.id);
  redirect("/dashboard");
}

export async function disconnectGithubAction() {
  const user = await getDbUser();
  if (!user) return;

  const connection = await getGithubConnection(user.id);
  if (!connection) return;

  // Revoke the grant on GitHub too, so the token stops working everywhere. Best effort.
  let token: string;
  try {
    token = connectionToken(connection);
  } catch {
    token = "";
  }
  const credentials = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString("base64");
  if (token) {
    await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`, {
      method: "DELETE",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Basic ${credentials}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    }).catch(() => {});
  }

  await db.delete(githubConnections).where(eq(githubConnections.id, connection.id));
  revalidatePath("/workspaces/new");
}
