"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, MessageSquare, Settings, LogOut, Share2 } from "lucide-react";
import { ShareDialog } from "@/components/sharing/ShareDialog";

export function TopBar() {
  const { data: session } = useSession();
  const { isOpen, toggle } = useSidebarStore();
  const params = useParams<{ workspaceId?: string; noteId?: string }>();
  const [shareOpen, setShareOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/80 backdrop-blur-sm px-3">
      {!isOpen && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggle}>
          <Menu className="h-4 w-4" />
        </Button>
      )}

      <div className="flex-1" />

      {params?.noteId && params?.workspaceId && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            noteId={params.noteId}
            workspaceId={params.workspaceId}
          />
        </>
      )}

      <Button variant="ghost" size="icon" className="h-7 w-7">
        <MessageSquare className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings/ai" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              설정
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
