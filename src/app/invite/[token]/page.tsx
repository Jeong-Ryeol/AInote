"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "already_member"
  >("loading");
  const [message, setMessage] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function acceptInvite() {
      try {
        const res = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setWorkspaceId(data.workspaceId);
          setMessage("워크스페이스에 참여했습니다!");
          // 2초 후 워크스페이스로 이동
          setTimeout(() => {
            router.push(`/workspace/${data.workspaceId}`);
          }, 2000);
        } else if (data.workspaceId && data.error?.includes("이미")) {
          setStatus("already_member");
          setWorkspaceId(data.workspaceId);
          setMessage(data.error);
        } else {
          setStatus("error");
          setMessage(data.error || "초대 수락에 실패했습니다");
        }
      } catch {
        setStatus("error");
        setMessage("오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
    acceptInvite();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold">워크스페이스 초대</h1>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>초대를 수락하는 중...</span>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <p className="text-green-500 font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              잠시 후 워크스페이스로 이동합니다...
            </p>
          </div>
        )}

        {status === "already_member" && (
          <div className="space-y-3">
            <p className="text-muted-foreground">{message}</p>
            {workspaceId && (
              <Button onClick={() => router.push(`/workspace/${workspaceId}`)}>
                워크스페이스로 이동
              </Button>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-destructive">{message}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              대시보드로 이동
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
