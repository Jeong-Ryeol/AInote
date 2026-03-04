"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  File,
  FolderClosed,
  MoreHorizontal,
  Plus,
  Trash2,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function SidebarNoteTree() {
  const {
    notes,
    activeWorkspaceId,
    fetchWorkspaces,
    fetchNotes,
    fetchFolders,
    expandedIds,
    toggleExpanded,
    createNote,
  } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchNotes(activeWorkspaceId);
      fetchFolders(activeWorkspaceId);
    }
  }, [activeWorkspaceId, fetchNotes, fetchFolders]);

  const rootNotes = notes.filter((n) => !n.parentId && !n.folderId);

  return (
    <div className="space-y-0.5">
      {rootNotes.map((note) => (
        <NoteTreeItem key={note.id} note={note} level={0} />
      ))}
      {rootNotes.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-1">
          노트가 없습니다
        </p>
      )}
    </div>
  );
}

interface NoteTreeItemProps {
  note: {
    id: string;
    title: string;
    icon?: string | null;
    parentId: string | null;
    isFavorite: boolean;
    _count: { children: number };
  };
  level: number;
}

function NoteTreeItem({ note, level }: NoteTreeItemProps) {
  const router = useRouter();
  const params = useParams();
  const { notes, folders, expandedIds, toggleExpanded, createNote, removeNote, updateNote, moveNoteToFolder, activeWorkspaceId } =
    useWorkspaceStore();

  const isActive = params.noteId === note.id;
  const isExpanded = expandedIds.has(note.id);
  const children = notes.filter((n) => n.parentId === note.id);
  const hasChildren = note._count.children > 0 || children.length > 0;

  const handleClick = () => {
    router.push(`/workspace/${activeWorkspaceId}/${note.id}`);
  };

  const handleCreateChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newNote = await createNote(note.id);
    if (newNote) {
      if (!isExpanded) toggleExpanded(note.id);
      router.push(`/workspace/${activeWorkspaceId}/${newNote.id}`);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      removeNote(note.id);
      toast.success("노트가 휴지통으로 이동했습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !note.isFavorite }),
      });
      updateNote(note.id, { isFavorite: !note.isFavorite });
    } catch {
      toast.error("즐겨찾기 변경에 실패했습니다.");
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-sm pr-1 text-sm cursor-pointer hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent"
        )}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleClick}
      >
        <button
          className="p-0.5 rounded-sm hover:bg-sidebar-accent"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded(note.id);
          }}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90",
              !hasChildren && "invisible"
            )}
          />
        </button>

        <span className="mr-1 text-sm">{note.icon || ""}</span>
        {!note.icon && <File className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />}

        <span className="flex-1 truncate py-1 text-sidebar-foreground">
          {note.title || "제목 없음"}
        </span>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleCreateChild}
          >
            <Plus className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Star className="mr-2 h-4 w-4" />
                {note.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
              </DropdownMenuItem>
              {folders.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderClosed className="mr-2 h-4 w-4" />
                    폴더로 이동
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveNoteToFolder(note.id, folder.id);
                          toast.success(`"${folder.name}" 폴더로 이동했습니다.`);
                        }}
                      >
                        <FolderClosed className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem
                onClick={handleArchive}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                휴지통으로 이동
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded &&
        children.map((child) => (
          <NoteTreeItem
            key={child.id}
            note={child}
            level={level + 1}
          />
        ))}
    </div>
  );
}
