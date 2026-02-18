import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// GET /api/ai/settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userAISettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    return NextResponse.json({
      defaultProvider: "openai",
      defaultModel: "gpt-4o-mini",
      hasOpenaiKey: false,
      hasAnthropicKey: false,
      hasGoogleKey: false,
    });
  }

  return NextResponse.json({
    defaultProvider: settings.defaultProvider,
    defaultModel: settings.defaultModel,
    hasOpenaiKey: !!settings.openaiApiKey,
    hasAnthropicKey: !!settings.anthropicApiKey,
    hasGoogleKey: !!settings.googleApiKey,
  });
}

// PUT /api/ai/settings
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, string | null> = {};

  if (body.defaultProvider) data.defaultProvider = body.defaultProvider;
  if (body.defaultModel) data.defaultModel = body.defaultModel;

  if (body.openaiApiKey !== undefined) {
    data.openaiApiKey = body.openaiApiKey ? encrypt(body.openaiApiKey) : null;
  }
  if (body.anthropicApiKey !== undefined) {
    data.anthropicApiKey = body.anthropicApiKey
      ? encrypt(body.anthropicApiKey)
      : null;
  }
  if (body.googleApiKey !== undefined) {
    data.googleApiKey = body.googleApiKey ? encrypt(body.googleApiKey) : null;
  }

  const settings = await prisma.userAISettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({
    defaultProvider: settings.defaultProvider,
    defaultModel: settings.defaultModel,
    hasOpenaiKey: !!settings.openaiApiKey,
    hasAnthropicKey: !!settings.anthropicApiKey,
    hasGoogleKey: !!settings.googleApiKey,
  });
}
