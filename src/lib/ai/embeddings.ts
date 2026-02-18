import { createOpenAI } from "@ai-sdk/openai";
import { embedMany, embed } from "ai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { chunkText } from "./chunker";

async function getEmbeddingModel(userId: string) {
  const settings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (!settings?.openaiApiKey) return null;

  const openai = createOpenAI({
    apiKey: decrypt(settings.openaiApiKey),
  });

  return openai.embedding("text-embedding-3-small");
}

export async function generateNoteEmbeddings(
  noteId: string,
  content: string,
  userId: string
) {
  const model = await getEmbeddingModel(userId);
  if (!model) return;

  const chunks = chunkText(content);
  if (chunks.length === 0) return;

  // Delete existing embeddings for this note
  await prisma.noteEmbedding.deleteMany({ where: { noteId } });

  // Generate embeddings in batch
  const { embeddings } = await embedMany({
    model,
    values: chunks.map((c) => c.content),
  });

  // Store using raw SQL for pgvector
  for (let i = 0; i < chunks.length; i++) {
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "NoteEmbedding" (id, "noteId", "chunkIndex", content, embedding)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector)`,
      noteId,
      chunks[i].index,
      chunks[i].content,
      vectorStr
    );
  }
}

export async function searchSimilarChunks(
  query: string,
  userId: string,
  workspaceId: string,
  limit = 10
): Promise<{ content: string; noteId: string; noteTitle: string; similarity: number }[]> {
  const model = await getEmbeddingModel(userId);
  if (!model) return [];

  const { embedding } = await embed({ model, value: query });
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<
    { content: string; noteId: string; noteTitle: string; similarity: number }[]
  >(
    `SELECT ne.content, ne."noteId", n.title as "noteTitle",
            1 - (ne.embedding <=> $1::vector) as similarity
     FROM "NoteEmbedding" ne
     JOIN "Note" n ON n.id = ne."noteId"
     WHERE n."workspaceId" = $2 AND n."isArchived" = false
     ORDER BY ne.embedding <=> $1::vector
     LIMIT $3`,
    vectorStr,
    workspaceId,
    limit
  );

  return results;
}
