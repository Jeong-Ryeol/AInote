import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export type AIProvider = "openai" | "anthropic" | "google";

interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-sonnet-4-20250514", "claude-haiku-4-20250414", "claude-3-5-sonnet-20241022"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
};

export function getProviderModels() {
  return PROVIDER_MODELS;
}

export function createModel(config: ProviderConfig): LanguageModel {
  switch (config.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: config.apiKey });
      return openai(config.model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(config.model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      return google(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export async function getUserModel(userId: string): Promise<{
  model: LanguageModel;
  provider: AIProvider;
  modelName: string;
} | null> {
  const settings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (!settings) return null;

  const provider = settings.defaultProvider as AIProvider;
  let apiKey: string | null = null;

  switch (provider) {
    case "openai":
      apiKey = settings.openaiApiKey ? decrypt(settings.openaiApiKey) : null;
      break;
    case "anthropic":
      apiKey = settings.anthropicApiKey
        ? decrypt(settings.anthropicApiKey)
        : null;
      break;
    case "google":
      apiKey = settings.googleApiKey ? decrypt(settings.googleApiKey) : null;
      break;
  }

  if (!apiKey) return null;

  return {
    model: createModel({
      provider,
      model: settings.defaultModel,
      apiKey,
    }),
    provider,
    modelName: settings.defaultModel,
  };
}
