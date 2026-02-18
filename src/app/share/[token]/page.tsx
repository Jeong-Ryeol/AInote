"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { Block } from "@blocknote/core";

interface SharedNoteData {
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: Block[] | null;
  updatedAt: string;
}

export default function SharedNotePage() {
  const { token } = useParams<{ token: string }>();
  const [note, setNote] = useState<SharedNoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "공유 링크를 찾을 수 없습니다");
          return;
        }
        const data = await res.json();
        setNote(data);
      } catch {
        setError("노트를 불러오는 중 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">공유 노트</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-4">
        <span className="font-semibold text-sm">AInote</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          공유된 노트
        </span>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {note.coverImage && (
          <div className="relative mb-6 h-48 w-full overflow-hidden rounded-lg">
            <img
              src={note.coverImage}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mb-6">
          {note.icon && <span className="text-4xl">{note.icon}</span>}
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {note.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            마지막 수정: {new Date(note.updatedAt).toLocaleDateString("ko-KR")}
          </p>
        </div>

        {note.content && (
          <NoteEditor
            noteId="shared"
            initialContent={note.content}
            editable={false}
          />
        )}
      </div>
    </div>
  );
}
