import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ai/conversations
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      noteId: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    take: 50,
  });

  return NextResponse.json(conversations);
}

// POST /api/ai/conversations
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, noteId } = await req.json();

  const conversation = await prisma.aIConversation.create({
    data: {
      userId: session.user.id,
      title: title || "새 대화",
      noteId: noteId || null,
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
