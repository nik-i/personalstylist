import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const brands = await prisma.brand.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json(brands);
}
