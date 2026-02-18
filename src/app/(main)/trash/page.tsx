"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { File, RotateCcw, Trash2 } from "lucide-react";

interface ArchivedNote {
  id: string;
  title: string;
  icon?: string | null;
  updatedAt: string;
}

export default function TrashPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [notes, setNotes] = useState<ArchivedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!activeWorkspaceId) return;
    async function load() {
      try {
        const res = await fetch(
          `/api/notes?workspaceId=${activeWorkspaceId}&archived=true`
        );
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeWorkspaceId]);

  const handleRestore = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("노트가 복원되었습니다.");
    } catch {
      toast.error("복원에 실패했습니다.");
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("노트가 영구 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">휴지통</h1>

      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">휴지통이 비어있습니다</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
            >
              {note.icon ? (
                <span>{note.icon}</span>
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="flex-1 text-sm truncate">{note.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRestore(note.id)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => handleDelete(note.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
