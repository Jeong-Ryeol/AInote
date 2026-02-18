import { auth } from "@/lib/auth";
import { streamText } from "ai";
import { getUserModel } from "@/lib/ai/providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content } = await req.json();

  const userModel = await getUserModel(session.user.id);
  if (!userModel) {
    return new Response(
      JSON.stringify({ error: "AI 설정을 먼저 완료해주세요." }),
      { status: 400 }
    );
  }

  const result = streamText({
    model: userModel.model,
    system:
      "주어진 노트 내용을 간결하게 요약해주세요. 핵심 포인트를 불릿 포인트로 정리하세요. 한국어로 응답하세요.",
    messages: [{ role: "user", content: content.slice(0, 4000) }],
  });

  return result.toTextStreamResponse();
}
