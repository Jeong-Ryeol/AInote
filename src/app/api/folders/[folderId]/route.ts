import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyFolderAccess(folderId: string, userId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      workspace: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });

  if (!folder || folder.workspace.members.length === 0) return null;
  return folder;
}

// PATCH /api/folders/[folderId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await params;
  const folder = await verifyFolderAccess(folderId, session.user.id);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const allowedFields = ["name", "icon", "sortOrder", "isArchived"];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/folders/[folderId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folderId } = await params;
  const folder = await verifyFolderAccess(folderId, session.user.id);
  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Move notes out of folder before deleting
  await prisma.note.updateMany({
    where: { folderId },
    data: { folderId: null },
  });

  await prisma.folder.delete({ where: { id: folderId } });

  return NextResponse.json({ success: true });
}
