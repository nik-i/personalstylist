import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
    Email({
      server: process.env.EMAIL_SERVER ?? "smtp://localhost:1025",
      from: process.env.EMAIL_FROM ?? "noreply@frock.app",
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // When a user re-authenticates with Google (e.g. to grant calendar scope),
    // the Prisma adapter won't update the stored tokens by default — do it here.
    async signIn({ account }) {
      if (account?.provider === "google" && account.access_token) {
        await prisma.account.updateMany({
          where: { provider: "google", providerAccountId: account.providerAccountId },
          data: {
            access_token: account.access_token,
            ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
            ...(account.expires_at ? { expires_at: account.expires_at } : {}),
            ...(account.scope ? { scope: account.scope } : {}),
          },
        });
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
