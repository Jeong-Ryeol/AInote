import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAdmin } from "@/lib/workspace-auth";

// DELETE /api/workspaces/[workspaceId]/invites/[inviteId] - 초대 취소
export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ workspaceId: string; inviteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, inviteId } = await params;
  const admin = await verifyWorkspaceAdmin(workspaceId, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.workspaceInvite.delete({
    where: { id: inviteId, workspaceId },
  });

  return NextResponse.json({ success: true });
}
