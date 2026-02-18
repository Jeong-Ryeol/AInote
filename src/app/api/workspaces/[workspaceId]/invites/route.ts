import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyWorkspaceAdmin } from "@/lib/workspace-auth";
import crypto from "crypto";

// POST /api/workspaces/[workspaceId]/invites - 초대 생성
export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const admin = await verifyWorkspaceAdmin(workspaceId, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role = "member" } = await req.json();
  if (!email) {
    return NextResponse.json(
      { error: "이메일을 입력해주세요" },
      { status: 400 }
    );
  }

  // 이미 멤버인지 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: existingUser.id },
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "이미 워크스페이스 멤버입니다" },
        { status: 409 }
      );
    }
  }

  // 기존 초대가 있으면 갱신, 없으면 생성
  const invite = await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    create: {
      workspaceId,
      email,
      role,
      token: crypto.randomUUID(),
      invitedBy: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    },
    update: {
      role,
      token: crypto.randomUUID(),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json(invite);
}

// GET /api/workspaces/[workspaceId]/invites - 대기 중인 초대 목록
export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const admin = await verifyWorkspaceAdmin(workspaceId, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}
