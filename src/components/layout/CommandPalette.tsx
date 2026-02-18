"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  Home,
  MessageSquare,
  Plus,
  Settings,
  Star,
  Trash2,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { notes, activeWorkspaceId, createNote } = useWorkspaceStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const handleCreateNote = useCallback(async () => {
    setOpen(false);
    const note = await createNote();
    if (note) {
      router.push(`/workspace/${activeWorkspaceId}/${note.id}`);
    }
  }, [createNote, activeWorkspaceId, router]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="검색하거나 명령을 입력하세요..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

        <CommandGroup heading="빠른 실행">
          <CommandItem onSelect={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" />
            새 노트 만들기
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            대시보드
          </CommandItem>
          <CommandItem onSelect={() => navigate("/ai-chat")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            AI 채팅
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/ai")}>
            <Settings className="mr-2 h-4 w-4" />
            AI 설정
          </CommandItem>
          <CommandItem onSelect={() => navigate("/trash")}>
            <Trash2 className="mr-2 h-4 w-4" />
            휴지통
          </CommandItem>
        </CommandGroup>

        {notes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="노트">
              {notes
                .filter((n) => !n.parentId)
                .slice(0, 10)
                .map((note) => (
                  <CommandItem
                    key={note.id}
                    onSelect={() =>
                      navigate(
                        `/workspace/${activeWorkspaceId}/${note.id}`
                      )
                    }
                  >
                    {note.icon ? (
                      <span className="mr-2">{note.icon}</span>
                    ) : (
                      <File className="mr-2 h-4 w-4" />
                    )}
                    {note.title}
                    {note.isFavorite && (
                      <Star className="ml-auto h-3 w-3 text-yellow-500" />
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
