import { NextResponse } from "next/server";
import { generateText } from "ai";
import { auth } from "@/lib/auth";
import { getUserModel } from "@/lib/ai/providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const userModel = await getUserModel(session.user.id);
  if (!userModel) {
    return NextResponse.json(
      { error: "AI 설정을 먼저 완료해주세요." },
      { status: 400 }
    );
  }

  const { text } = await generateText({
    model: userModel.model,
    system: `당신은 노트 태그 추천 시스템입니다.
주어진 노트 내용을 분석하여 적절한 태그 3-5개를 추천하세요.
JSON 배열 형식으로만 응답하세요. 예: ["태그1", "태그2", "태그3"]
태그는 짧고 핵심적인 키워드여야 합니다.`,
    prompt: content.slice(0, 2000),
  });

  try {
    const tags = JSON.parse(text);
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ tags: [] });
  }
}
