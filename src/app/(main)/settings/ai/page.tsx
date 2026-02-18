"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, Key } from "lucide-react";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-haiku-4-20250414"] },
  { id: "google", name: "Google", models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"] },
];

interface Settings {
  defaultProvider: string;
  defaultModel: string;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openaiApiKey: "",
    anthropicApiKey: "",
    googleApiKey: "",
  });
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ai/settings");
        const data = await res.json();
        setSettings(data);
        setSelectedProvider(data.defaultProvider);
        setSelectedModel(data.defaultModel);
      } catch {
        toast.error("설정을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProvider);

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        defaultProvider: selectedProvider,
        defaultModel: selectedModel,
      };

      if (apiKeys.openaiApiKey) body.openaiApiKey = apiKeys.openaiApiKey;
      if (apiKeys.anthropicApiKey) body.anthropicApiKey = apiKeys.anthropicApiKey;
      if (apiKeys.googleApiKey) body.googleApiKey = apiKeys.googleApiKey;

      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setSettings(data);
      setApiKeys({ openaiApiKey: "", anthropicApiKey: "", googleApiKey: "" });
      toast.success("AI 설정이 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 설정</h1>
        <p className="text-muted-foreground mt-1">
          AI 모델과 API 키를 설정하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 프로바이더</CardTitle>
          <CardDescription>사용할 AI 서비스를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                variant={selectedProvider === provider.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedProvider(provider.id);
                  setSelectedModel(provider.models[0]);
                }}
              >
                {provider.name}
              </Button>
            ))}
          </div>

          {currentProvider && (
            <div className="space-y-2">
              <Label>모델</Label>
              <div className="flex flex-wrap gap-2">
                {currentProvider.models.map((model) => (
                  <Button
                    key={model}
                    variant={selectedModel === model ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedModel(model)}
                  >
                    {model}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API 키</CardTitle>
          <CardDescription>
            API 키는 AES-256-GCM으로 암호화되어 저장됩니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PROVIDERS.map((provider) => {
            const keyField =
              `${provider.id}ApiKey` as keyof typeof apiKeys;
            const hasKey =
              settings?.[
                `has${provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}Key` as keyof Settings
              ];

            return (
              <div key={provider.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>{provider.name} API Key</Label>
                  {hasKey && (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="mr-1 h-3 w-3" />
                      설정됨
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder={hasKey ? "••••••••" : `${provider.name} API 키 입력`}
                      value={apiKeys[keyField]}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          [keyField]: e.target.value,
                        }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        설정 저장
      </Button>
    </div>
  );
}
