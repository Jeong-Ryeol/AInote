import { auth } from "@/lib/auth";
import { ragQuery } from "@/lib/ai/rag";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { query, workspaceId, conversationId } = await req.json();

  if (!query || !workspaceId) {
    return new Response(
      JSON.stringify({ error: "query and workspaceId required" }),
      { status: 400 }
    );
  }

  // Load conversation history if conversationId provided
  let history: { role: string; content: string }[] = [];
  if (conversationId) {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });
    history = messages;
  }

  try {
    const result = await ragQuery(
      query,
      session.user.id,
      workspaceId,
      history
    );
    return result.toTextStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "RAG query failed";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
