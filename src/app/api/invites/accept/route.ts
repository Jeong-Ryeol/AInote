import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/invites/accept - 초대 수락
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json(
      { error: "토큰이 필요합니다" },
      { status: 400 }
    );
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.status !== "pending") {
    return NextResponse.json(
      { error: "유효하지 않은 초대입니다" },
      { status: 404 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "초대가 만료되었습니다" },
      { status: 410 }
    );
  }

  // 이메일 일치 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user || user.email !== invite.email) {
    return NextResponse.json(
      { error: "초대된 이메일과 현재 계정의 이메일이 일치하지 않습니다" },
      { status: 403 }
    );
  }

  // 이미 멤버인지 확인
  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
      },
    },
  });
  if (existingMember) {
    // 이미 멤버면 초대 상태만 변경
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
    return NextResponse.json({
      error: "이미 워크스페이스 멤버입니다",
      workspaceId: invite.workspaceId,
    });
  }

  // 멤버 추가 + 초대 상태 변경
  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      },
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    workspaceId: invite.workspaceId,
  });
}
