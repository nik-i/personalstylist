import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Demo sign-in — finds or creates a demo user and sets a session cookie.
// Works in all environments so the deployed capstone app is accessible without email auth.
export async function GET(req: NextRequest) {
  const user = await prisma.user.upsert({
    where: { email: "demo@frock.app" },
    update: {},
    create: { email: "demo@frock.app", name: "Demo User" },
  });

  const TOKEN = "demo-session-token";
  await prisma.session.upsert({
    where: { sessionToken: TOKEN },
    update: { expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    create: {
      sessionToken: TOKEN,
      userId: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const redirectTo = req.nextUrl.searchParams.get("redirect") ?? "/onboarding/landing";
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const response = NextResponse.redirect(new URL(redirectTo, base));
  response.cookies.set("authjs.session-token", TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
