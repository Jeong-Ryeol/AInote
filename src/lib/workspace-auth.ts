import { prisma } from "@/lib/prisma";

export async function verifyWorkspaceAdmin(
  workspaceId: string,
  userId: string
) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return null;
  }

  return member;
}

export async function verifyWorkspaceMember(
  workspaceId: string,
  userId: string
) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  if (!member) return null;
  return member;
}
