import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/share/[token] - 공개 노트 조회 (인증 불필요)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const sharedNote = await prisma.sharedNote.findUnique({
    where: { token },
    include: {
      note: {
        select: {
          title: true,
          icon: true,
          coverImage: true,
          content: true,
          isArchived: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!sharedNote || !sharedNote.isActive) {
    return NextResponse.json(
      { error: "공유 링크가 존재하지 않거나 비활성화되었습니다" },
      { status: 404 }
    );
  }

  if (sharedNote.note.isArchived) {
    return NextResponse.json(
      { error: "이 노트는 삭제되었습니다" },
      { status: 404 }
    );
  }

  if (sharedNote.expiresAt && new Date() > sharedNote.expiresAt) {
    return NextResponse.json(
      { error: "공유 링크가 만료되었습니다" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    title: sharedNote.note.title,
    icon: sharedNote.note.icon,
    coverImage: sharedNote.note.coverImage,
    content: sharedNote.note.content,
    updatedAt: sharedNote.note.updatedAt,
  });
}
