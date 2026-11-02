import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, githubConnections } from "@/db";
import { getDbUser } from "@/lib/auth";
import { connectionToken, getGithubConnection, GithubAuthError, listRepos } from "@/lib/github";

// Repositories the signed-in user's linked GitHub account can access.
export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const connection = await getGithubConnection(user.id);
  if (!connection) {
    return NextResponse.json({ error: "Connect your GitHub account first.", reconnect: true }, { status: 409 });
  }

  try {
    const repos = await listRepos(connectionToken(connection));
    return NextResponse.json({ repos });
  } catch (error) {
    if (error instanceof GithubAuthError) {
      await db.delete(githubConnections).where(eq(githubConnections.id, connection.id));
      return NextResponse.json({ error: error.message, reconnect: true }, { status: 409 });
    }
    console.error("Failed to list GitHub repositories", error);
    return NextResponse.json({ error: "We couldn't load your repositories. Please try again." }, { status: 502 });
  }
}
