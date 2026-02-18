"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarNoteTree } from "./SidebarNoteTree";
import {
  ChevronsLeft,
  Home,
  Search,
  Star,
  Plus,
  Trash2,
  Settings,
  MessageSquare,
  File,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, toggle } = useSidebarStore();
  const { notes, createNote, activeWorkspaceId } = useWorkspaceStore();

  const favoriteNotes = notes.filter((n) => n.isFavorite);

  const handleNewNote = async () => {
    const note = await createNote();
    if (note) {
      router.push(`/workspace/${activeWorkspaceId}/${note.id}`);
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-sidebar transition-transform duration-200",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex h-12 items-center justify-between px-3">
        <span className="text-sm font-semibold text-sidebar-foreground">
          AInote
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggle}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-muted-foreground"
          size="sm"
        >
          <Search className="h-4 w-4" />
          검색
          <kbd className="ml-auto text-[10px] text-muted-foreground/60">
            ⌘K
          </kbd>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          <SidebarItem
            href="/dashboard"
            icon={Home}
            label="대시보드"
            active={pathname === "/dashboard"}
          />
          <SidebarItem
            href="/ai-chat"
            icon={MessageSquare}
            label="AI 채팅"
            active={pathname.startsWith("/ai-chat")}
          />
        </div>

        <Separator className="my-3" />

        {favoriteNotes.length > 0 && (
          <>
            <div className="mb-1 flex items-center">
              <Star className="mr-1.5 h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                즐겨찾기
              </span>
            </div>
            <div className="space-y-0.5 mb-2">
              {favoriteNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/workspace/${activeWorkspaceId}/${note.id}`}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm h-7"
                    size="sm"
                  >
                    {note.icon ? (
                      <span className="text-sm">{note.icon}</span>
                    ) : (
                      <File className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{note.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
            <Separator className="my-3" />
          </>
        )}

        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            페이지
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleNewNote}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <SidebarNoteTree />
      </ScrollArea>

      <div className="border-t p-3 space-y-1">
        <SidebarItem
          href="/trash"
          icon={Trash2}
          label="휴지통"
          active={pathname === "/trash"}
        />
        <SidebarItem
          href="/settings/ai"
          icon={Settings}
          label="설정"
          active={pathname.startsWith("/settings")}
        />
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className="w-full justify-start gap-2 text-sm"
        size="sm"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}
