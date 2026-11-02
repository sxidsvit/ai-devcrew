import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { getObject } from "@/lib/storage";
import { getWorkspace } from "@/lib/workspaces";

// Streams a workspace's logo from private storage to its owner.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getDbUser();
  const workspace = user ? await getWorkspace(user.id, id) : null;
  if (!workspace?.logoKey) return new NextResponse(null, { status: 404 });

  const object = await getObject(workspace.logoKey).catch(() => null);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(object.body, {
    headers: {
      "content-type": object.contentType,
      "cache-control": "private, max-age=86400, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
