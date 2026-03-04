"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import type { FolderItem } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  File,
  FolderClosed,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function SidebarFolderSection() {
  const { folders, createFolder, activeWorkspaceId } = useWorkspaceStore();

  const handleCreateFolder = async () => {
    await createFolder();
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">폴더</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleCreateFolder}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-0.5">
        {folders.map((folder) => (
          <FolderTreeItem key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}

function FolderTreeItem({ folder }: { folder: FolderItem }) {
  const router = useRouter();
  const params = useParams();
  const {
    notes,
    folders,
    expandedIds,
    toggleExpanded,
    createNote,
    removeNote,
    updateNote,
    removeFolder,
    updateFolder,
    activeWorkspaceId,
  } = useWorkspaceStore();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  const isExpanded = expandedIds.has(`folder-${folder.id}`);
  const folderNotes = notes.filter(
    (n) => n.folderId === folder.id && !n.parentId
  );

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(`folder-${folder.id}`);
  };

  const handleCreateNoteInFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newNote = await createNote(null, folder.id);
    if (newNote) {
      if (!isExpanded) toggleExpanded(`folder-${folder.id}`);
      router.push(`/workspace/${activeWorkspaceId}/${newNote.id}`);
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
      if (res.ok) {
        removeFolder(folder.id);
        toast.success("폴더가 삭제되었습니다.");
      }
    } catch {
      toast.error("폴더 삭제에 실패했습니다.");
    }
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(folder.name);
    setIsRenaming(true);
  };

  const handleRename = async () => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === folder.name) return;

    try {
      await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      updateFolder(folder.id, { name: trimmed });
    } catch {
      toast.error("이름 변경에 실패했습니다.");
    }
  };

  return (
    <div>
      <div
        className="group flex items-center gap-0.5 rounded-sm pr-1 text-sm cursor-pointer hover:bg-sidebar-accent"
        style={{ paddingLeft: "4px" }}
        onClick={handleToggle}
      >
        <button className="p-0.5 rounded-sm hover:bg-sidebar-accent">
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {isExpanded ? (
          <FolderOpen className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <FolderClosed className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        {isRenaming ? (
          <Input
            className="h-6 text-sm flex-1 px-1"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate py-1 text-sidebar-foreground">
            {folder.name}
          </span>
        )}

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleCreateNoteInFolder}
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
              <DropdownMenuItem onClick={handleStartRename}>
                <Pencil className="mr-2 h-4 w-4" />
                이름 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteFolder}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                폴더 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && (
        <div>
          {folderNotes.map((note) => (
            <FolderNoteItem key={note.id} note={note} />
          ))}
          {folderNotes.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1" style={{ paddingLeft: "28px" }}>
              비어 있음
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FolderNoteItem({
  note,
}: {
  note: {
    id: string;
    title: string;
    icon?: string | null;
    isFavorite: boolean;
  };
}) {
  const router = useRouter();
  const params = useParams();
  const { activeWorkspaceId } = useWorkspaceStore();
  const isActive = params.noteId === note.id;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-sm pr-1 text-sm cursor-pointer hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent"
      )}
      style={{ paddingLeft: "28px" }}
      onClick={() =>
        router.push(`/workspace/${activeWorkspaceId}/${note.id}`)
      }
    >
      {note.icon ? (
        <span className="text-sm">{note.icon}</span>
      ) : (
        <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className="flex-1 truncate py-1 text-sidebar-foreground">
        {note.title || "제목 없음"}
      </span>
    </div>
  );
}
