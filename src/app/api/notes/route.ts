import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notes?workspaceId=xxx&parentId=xxx
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parentId = searchParams.get("parentId") || null;
  const archived = searchParams.get("archived") === "true";

  const notes = await prisma.note.findMany({
    where: {
      workspaceId,
      ...(archived ? { isArchived: true } : { parentId, isArchived: false }),
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      isFavorite: true,
      sortOrder: true,
      updatedAt: true,
      _count: { select: { children: true } },
    },
  });

  return NextResponse.json(notes);
}

// POST /api/notes
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, parentId, title } = await req.json();

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  // Verify membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const note = await prisma.note.create({
    data: {
      workspaceId,
      parentId: parentId || null,
      title: title || "제목 없음",
    },
  });

  return NextResponse.json(note, { status: 201 });
}
