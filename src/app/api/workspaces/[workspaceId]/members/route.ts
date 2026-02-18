import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceMember } from "@/lib/workspace-auth";

// GET /api/workspaces/[workspaceId]/members - 멤버 목록
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const member = await verifyWorkspaceMember(workspaceId, session.user.id);
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [
      { role: "asc" }, // owner first
    ],
  });

  return NextResponse.json(members);
}
