"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

export default function AIChatPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    }
    load();
  }, []);

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">워크스페이스를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Conversation list */}
      <div className="w-64 border-r p-4 space-y-2">
        <Button className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          새 대화
        </Button>
        <div className="space-y-1 mt-4">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
              onClick={() => router.push(`/ai-chat/${conv.id}`)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{conv.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {conv._count.messages}개의 메시지
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        <AIChatPanel workspaceId={activeWorkspaceId} />
      </div>
    </div>
  );
}
