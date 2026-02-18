"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Block } from "@blocknote/core";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface NoteData {
  id: string;
  title: string;
  icon?: string;
  content?: Block[];
  yjsState?: string;
}

export default function NotePage() {
  const params = useParams<{ workspaceId: string; noteId: string }>();
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    async function loadNote() {
      try {
        const res = await fetch(`/api/notes/${params.noteId}`);
        if (!res.ok) throw new Error("Failed to load note");
        const data = await res.json();
        setNote(data);
        setTitle(data.title);
      } catch {
        toast.error("노트를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [params.noteId]);

  const saveTitle = useCallback(
    async (newTitle: string) => {
      try {
        await fetch(`/api/notes/${params.noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch {
        toast.error("제목 저장에 실패했습니다.");
      }
    },
    [params.noteId]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveTitle(newTitle), 500);
    },
    [saveTitle]
  );

  const handleContentChange = useCallback(
    (content: Block[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/notes/${params.noteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
        } catch {
          toast.error("내용 저장에 실패했습니다.");
        }
      }, 2000);
    },
    [params.noteId]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-3/5" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">노트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="px-14 mb-4">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="제목 없음"
          className="border-none text-4xl font-bold h-auto py-2 px-0 focus-visible:ring-0 bg-transparent"
        />
      </div>
      <NoteEditor
        noteId={note.id}
        initialContent={note.content}
        onChange={handleContentChange}
      />
    </div>
  );
}
