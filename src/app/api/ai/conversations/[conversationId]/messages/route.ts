import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ai/conversations/[conversationId]/messages
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/ai/conversations/[conversationId]/messages
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const { role, content, model } = await req.json();

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = await prisma.aIMessage.create({
    data: {
      conversationId,
      role,
      content,
      model,
    },
  });

  // Update conversation title from first user message
  const msgCount = await prisma.aIMessage.count({ where: { conversationId } });
  if (msgCount === 1 && role === "user") {
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { title: content.slice(0, 50) },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
