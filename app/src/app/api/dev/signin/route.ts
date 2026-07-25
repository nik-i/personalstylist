import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Dev-only shortcut — signs in as the seed user without email verification.
// Only works when NODE_ENV === "development".
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { email: "test@frock.app" } });
  if (!user) {
    return NextResponse.json({ error: "Seed user not found — run seed first" }, { status: 404 });
  }

  const TOKEN = "test-session-token-epic-b";
  await prisma.session.upsert({
    where: { sessionToken: TOKEN },
    update: { expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    create: {
      sessionToken: TOKEN,
      userId: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const response = NextResponse.redirect(new URL("/wardrobe", "http://localhost:3000"));
  response.cookies.set("authjs.session-token", TOKEN, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
