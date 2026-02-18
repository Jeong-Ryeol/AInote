"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { File, Plus, Star, Clock } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { notes, activeWorkspaceId, loading, fetchWorkspaces, createNote } =
    useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const favoriteNotes = notes.filter((n) => n.isFavorite);
  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 8);

  const handleCreateNote = async () => {
    const note = await createNote();
    if (note) {
      router.push(`/workspace/${activeWorkspaceId}/${note.id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Button onClick={handleCreateNote} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />새 노트
        </Button>
      </div>

      {favoriteNotes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <h2 className="text-lg font-semibold">즐겨찾기</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                workspaceId={activeWorkspaceId!}
                onClick={() =>
                  router.push(
                    `/workspace/${activeWorkspaceId}/${note.id}`
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">최근 노트</h2>
        </div>
        {recentNotes.length === 0 ? (
          <Card
            className="flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-accent transition-colors"
            onClick={handleCreateNote}
          >
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              첫 번째 노트를 만들어보세요
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                workspaceId={activeWorkspaceId!}
                onClick={() =>
                  router.push(
                    `/workspace/${activeWorkspaceId}/${note.id}`
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NoteCard({
  note,
  workspaceId,
  onClick,
}: {
  note: {
    id: string;
    title: string;
    icon?: string | null;
    isFavorite: boolean;
    updatedAt: string;
  };
  workspaceId: string;
  onClick: () => void;
}) {
  const timeAgo = getTimeAgo(new Date(note.updatedAt));

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <div className="flex items-start gap-2">
          {note.icon ? (
            <span className="text-2xl">{note.icon}</span>
          ) : (
            <File className="h-5 w-5 mt-0.5 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {note.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
          {note.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR");
}
