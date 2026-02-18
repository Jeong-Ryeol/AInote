import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function verifyNoteAccess(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      workspace: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });

  if (!note || note.workspace.members.length === 0) return null;
  return note;
}

// GET /api/notes/[noteId]/share - 공유 상태 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const note = await verifyNoteAccess(noteId, session.user.id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sharedNote = await prisma.sharedNote.findUnique({
    where: { noteId },
  });

  if (!sharedNote) {
    return NextResponse.json({ isShared: false });
  }

  const baseUrl = new URL(req.url).origin;
  return NextResponse.json({
    isShared: sharedNote.isActive,
    token: sharedNote.token,
    url: `${baseUrl}/share/${sharedNote.token}`,
    isActive: sharedNote.isActive,
  });
}

// POST /api/notes/[noteId]/share - 공유 활성화
export async function POST(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const note = await verifyNoteAccess(noteId, session.user.id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sharedNote = await prisma.sharedNote.upsert({
    where: { noteId },
    create: {
      noteId,
      token: crypto.randomUUID(),
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });

  const baseUrl = new URL(req.url).origin;
  return NextResponse.json({
    token: sharedNote.token,
    isActive: sharedNote.isActive,
    url: `${baseUrl}/share/${sharedNote.token}`,
  });
}

// PATCH /api/notes/[noteId]/share - 토글 on/off
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const note = await verifyNoteAccess(noteId, session.user.id);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.sharedNote.findUnique({
    where: { noteId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const updated = await prisma.sharedNote.update({
    where: { noteId },
    data: { isActive: !existing.isActive },
  });

  return NextResponse.json({ isActive: updated.isActive });
}
