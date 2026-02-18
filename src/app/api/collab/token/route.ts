import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SignJWT } from "jose";

function getJwtSecret() {
  const secret = process.env.COLLAB_JWT_SECRET;
  if (!secret) {
    throw new Error("COLLAB_JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await req.json();

  const token = await new SignJWT({
    userId: session.user.id,
    workspaceId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(getJwtSecret());

  return NextResponse.json({ token });
}
