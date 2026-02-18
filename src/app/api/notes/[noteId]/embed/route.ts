import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateNoteEmbeddings } from "@/lib/ai/embeddings";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  try {
    await generateNoteEmbeddings(noteId, content, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return NextResponse.json(
      { error: "Embedding generation failed" },
      { status: 500 }
    );
  }
}
