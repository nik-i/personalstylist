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
  // Azure Container Apps binds on 0.0.0.0:3000; req.nextUrl.origin reflects that internal
  // address, not the public hostname. Read the forwarded headers the proxy sets instead.
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const base = `${proto}://${host}`;
  const response = NextResponse.redirect(new URL(redirectTo, base));
  // NextAuth v5 prefixes the session cookie with __Secure- on HTTPS (useSecureCookies).
  // Use the same protocol detection so our manually-set cookie matches what auth() looks for.
  const isHttps = proto === "https";
  const cookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";
  response.cookies.set(cookieName, TOKEN, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
