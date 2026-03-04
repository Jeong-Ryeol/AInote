import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/ai/conversations/[conversationId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  // 본인의 대화만 삭제 가능
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 메시지 먼저 삭제 후 대화 삭제
  await prisma.aIMessage.deleteMany({ where: { conversationId } });
  await prisma.aIConversation.delete({ where: { id: conversationId } });

  return NextResponse.json({ success: true });
}
