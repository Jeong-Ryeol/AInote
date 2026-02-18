"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, X, UserPlus, Link2, Loader2 } from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  workspaceId: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  noteId,
  workspaceId,
}: ShareDialogProps) {
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteCopied, setInviteCopied] = useState<string | null>(null);

  const fetchShareStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}/share`);
      if (res.ok) {
        const data = await res.json();
        setIsShared(data.isShared || false);
        if (data.url) setShareUrl(data.url);
      }
    } catch {
      // ignore
    }
  }, [noteId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // ignore
    }
  }, [workspaceId]);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch {
      // ignore
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) {
      fetchShareStatus();
      fetchMembers();
      fetchInvites();
    }
  }, [open, fetchShareStatus, fetchMembers, fetchInvites]);

  const handleToggleShare = async () => {
    setShareLoading(true);
    try {
      if (!isShared) {
        // 활성화
        const res = await fetch(`/api/notes/${noteId}/share`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setIsShared(true);
          setShareUrl(data.url);
        }
      } else {
        // 비활성화
        const res = await fetch(`/api/notes/${noteId}/share`, {
          method: "PATCH",
        });
        if (res.ok) {
          setIsShared(false);
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        fetchInvites();
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/invites/${inviteId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      fetchInvites();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/members/${memberId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      fetchMembers();
    }
  };

  const handleCopyInviteLink = async (invite: Invite) => {
    const url = `${window.location.origin}/invite/${invite.token}`;
    await navigator.clipboard.writeText(url);
    setInviteCopied(invite.id);
    setTimeout(() => setInviteCopied(null), 2000);
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "소유자";
      case "admin":
        return "관리자";
      default:
        return "멤버";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>노트 공유</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 공개 링크 섹션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="share-toggle">웹에서 공개</Label>
            </div>
            <Switch
              id="share-toggle"
              checked={isShared}
              onCheckedChange={handleToggleShare}
              disabled={shareLoading}
            />
          </div>

          {isShared && shareUrl && (
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          <Separator />

          {/* 멤버 초대 섹션 */}
          <div>
            <h4 className="text-sm font-medium mb-3">멤버 초대</h4>
            <div className="flex items-center gap-2">
              <Input
                placeholder="이메일 주소"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
              </select>
              <Button
                size="sm"
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail.trim()}
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* 멤버 목록 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium">멤버</h4>
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {member.user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span>{member.user.name || member.user.email}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {roleLabel(member.role)}
                    </Badge>
                  </div>
                </div>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* 대기 중인 초대 */}
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      ✉
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {invite.email}
                    </span>
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      대기 중
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopyInviteLink(invite)}
                  >
                    {inviteCopied === invite.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCancelInvite(invite.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
