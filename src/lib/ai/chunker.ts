const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export interface TextChunk {
  content: string;
  index: number;
}

export function chunkText(text: string): TextChunk[] {
  if (!text.trim()) return [];

  const sentences = text.split(/(?<=[.!?。！？\n])\s+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (
      currentChunk.length + sentence.length > CHUNK_SIZE &&
      currentChunk.length > 0
    ) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });

      // Keep overlap from end of current chunk
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-CHUNK_OVERLAP);
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
}
