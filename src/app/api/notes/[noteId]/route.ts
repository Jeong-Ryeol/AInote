import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

// GET /api/notes/[noteId]
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

  return NextResponse.json(note);
}

// PATCH /api/notes/[noteId]
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

  const body = await req.json();
  const allowedFields = [
    "title",
    "icon",
    "coverImage",
    "isFavorite",
    "isArchived",
    "parentId",
    "sortOrder",
    "content",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/notes/[noteId]
export async function DELETE(
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

  await prisma.note.delete({ where: { id: noteId } });

  return NextResponse.json({ success: true });
}
