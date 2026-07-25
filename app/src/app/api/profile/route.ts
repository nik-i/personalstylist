import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  return NextResponse.json(profile ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "coloring", "bodyShape", "styleSignals", "highlightPrefs", "downplayPrefs",
    "height", "hardNos", "lifestyle", "styleGoals",
  ];
  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json(profile);
}
