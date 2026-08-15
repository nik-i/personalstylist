import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getUserId(session: { user?: { id?: string } } | null): string | null {
  return session?.user?.id ?? process.env.MCP_USER_ID ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.wardrobeItem.findFirst({
    where: { id, userId, isActive: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...item,
    fit: (() => { try { return JSON.parse(item.fit); } catch { return []; } })(),
    tags: (() => { try { return JSON.parse(item.tags); } catch { return []; } })(),
    occasionTags: (() => { try { return JSON.parse(item.occasionTags); } catch { return []; } })(),
  });
}
