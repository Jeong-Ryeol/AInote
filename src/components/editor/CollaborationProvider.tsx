"use client";

import { useEffect, useState, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

interface CollaborationProviderProps {
  noteId: string;
  workspaceId: string;
  children: (props: {
    provider: HocuspocusProvider;
    doc: Y.Doc;
  }) => React.ReactNode;
}

export function CollaborationProvider({
  noteId,
  workspaceId,
  children,
}: CollaborationProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch("/api/collab/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        const data = await res.json();
        setToken(data.token);
      } catch (e) {
        console.error("Failed to get collab token:", e);
      }
    }
    getToken();
  }, [workspaceId]);

  const { provider, doc } = useMemo(() => {
    if (!token) return { provider: null, doc: null };

    const doc = new Y.Doc();
    const collabUrl = process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:3101";

    const provider = new HocuspocusProvider({
      url: collabUrl,
      name: `note:${noteId}`,
      document: doc,
      token,
    });

    return { provider, doc };
  }, [noteId, token]);

  useEffect(() => {
    return () => {
      provider?.destroy();
    };
  }, [provider]);

  if (!provider || !doc) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">연결 중...</div>
      </div>
    );
  }

  return <>{children({ provider, doc })}</>;
}
