import { streamText } from "ai";
import { auth } from "@/lib/auth";
import { getUserModel } from "@/lib/ai/providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, system } = await req.json();

  const userModel = await getUserModel(session.user.id);
  if (!userModel) {
    return new Response(
      JSON.stringify({ error: "AI 설정을 먼저 완료해주세요." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = streamText({
    model: userModel.model,
    system:
      system ||
      "당신은 AInote의 AI 어시스턴트입니다. 사용자의 노트 작성과 정보 정리를 도와주세요. 한국어로 응답해주세요.",
    messages,
  });

  return result.toTextStreamResponse();
}
