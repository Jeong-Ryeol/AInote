import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  verifyWorkspaceAdmin,
  verifyWorkspaceMember,
} from "@/lib/workspace-auth";

// PATCH /api/workspaces/[workspaceId]/members/[memberId] - 역할 변경
export async function PATCH(
  req: Request,
  {
    params,
  }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, memberId } = await params;

  // owner만 역할 변경 가능
  const currentMember = await verifyWorkspaceMember(
    workspaceId,
    session.user.id
  );
  if (!currentMember || currentMember.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId, workspaceId },
    data: { role },
  });

  return NextResponse.json(updated);
}

// DELETE /api/workspaces/[workspaceId]/members/[memberId] - 멤버 제거/탈퇴
export async function DELETE(
  req: Request,
  {
    params,
  }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, memberId } = await params;

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId, workspaceId },
  });
  if (!targetMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // owner는 제거 불가
  if (targetMember.role === "owner") {
    return NextResponse.json(
      { error: "소유자는 제거할 수 없습니다" },
      { status: 403 }
    );
  }

  // 자기 자신이면 탈퇴 허용
  if (targetMember.userId === session.user.id) {
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });
    return NextResponse.json({ success: true });
  }

  // 그 외에는 admin 이상만 제거 가능
  const admin = await verifyWorkspaceAdmin(workspaceId, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ success: true });
}
