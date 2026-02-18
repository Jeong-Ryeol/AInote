import { streamText } from "ai";
import { getUserModel } from "./providers";
import { searchSimilarChunks } from "./embeddings";

export async function ragQuery(
  query: string,
  userId: string,
  workspaceId: string,
  conversationHistory: { role: string; content: string }[] = []
) {
  const userModel = await getUserModel(userId);
  if (!userModel) {
    throw new Error("AI 설정을 먼저 완료해주세요.");
  }

  // Search for relevant chunks
  const chunks = await searchSimilarChunks(query, userId, workspaceId, 10);

  // Build context from relevant chunks
  const context = chunks
    .map(
      (c, i) =>
        `[노트: ${c.noteTitle}] (유사도: ${(c.similarity * 100).toFixed(1)}%)\n${c.content}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `당신은 AInote의 AI 어시스턴트입니다. 사용자의 노트 내용을 기반으로 질문에 답변합니다.

아래는 사용자의 노트에서 검색된 관련 내용입니다:

${context || "관련 노트 내용을 찾지 못했습니다."}

위 내용을 참고하여 질문에 답변해주세요. 노트에 없는 내용은 추측하지 말고, 노트 내용을 기반으로 답변하세요.
한국어로 응답해주세요.`;

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: query },
  ];

  return streamText({
    model: userModel.model,
    system: systemPrompt,
    messages,
  });
}
