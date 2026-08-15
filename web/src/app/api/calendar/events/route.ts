import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD (start date)
  endDate?: string;   // YYYY-MM-DD for multi-day
  allDay: boolean;
  color?: string;     // Google's colorId mapped to hex
};

// Google Calendar colorId → hex (subset of the standard palette)
const GCOLOR: Record<string, string> = {
  "1": "#7986CB",  // Lavender
  "2": "#33B679",  // Sage
  "3": "#8E24AA",  // Grape
  "4": "#E67C73",  // Flamingo
  "5": "#F6BF26",  // Banana
  "6": "#F4511E",  // Tangerine
  "7": "#039BE5",  // Peacock
  "8": "#616161",  // Graphite
  "9": "#3F51B5",  // Blueberry
  "10": "#0B8043", // Sage dark
  "11": "#D50000", // Tomato
};

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
      providerAccountId: true,
    },
  });

  if (!account?.access_token) return null;

  // Token still valid
  if (!account.expires_at || account.expires_at * 1000 > Date.now() + 60_000) {
    return account.access_token;
  }

  // Attempt token refresh
  if (!account.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const refreshed = (await res.json()) as { access_token: string; expires_in: number };

  await prisma.account.update({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } },
    data: {
      access_token: refreshed.access_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    },
  });

  return refreshed.access_token;
}

function toDateStr(iso: string): string {
  // ISO date "2026-08-15" or datetime "2026-08-15T..." → "2026-08-15"
  return iso.slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month param required (YYYY-MM)" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const timeMin = new Date(y, m - 1, 1).toISOString();
  const timeMax = new Date(y, m, 0, 23, 59, 59).toISOString();

  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    // User hasn't granted calendar scope yet — return empty, not an error
    return NextResponse.json({ events: [], needsAuth: true });
  }

  const gcalUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  gcalUrl.searchParams.set("timeMin", timeMin);
  gcalUrl.searchParams.set("timeMax", timeMax);
  gcalUrl.searchParams.set("singleEvents", "true");
  gcalUrl.searchParams.set("orderBy", "startTime");
  gcalUrl.searchParams.set("maxResults", "250");

  const gcalRes = await fetch(gcalUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (gcalRes.status === 401) {
    return NextResponse.json({ events: [], needsAuth: true });
  }
  if (!gcalRes.ok) {
    return NextResponse.json({ events: [] });
  }

  const data = (await gcalRes.json()) as {
    items: Array<{
      id: string;
      summary?: string;
      colorId?: string;
      start: { date?: string; dateTime?: string };
      end: { date?: string; dateTime?: string };
    }>;
  };

  const events: CalendarEvent[] = (data.items ?? [])
    .filter((item) => item.start?.date || item.start?.dateTime)
    .map((item) => {
      const startRaw = item.start.date ?? item.start.dateTime!;
      const endRaw = item.end?.date ?? item.end?.dateTime;
      const allDay = !!item.start.date;
      // For all-day events Google uses exclusive end, shift back 1 day
      let endDate: string | undefined;
      if (endRaw) {
        if (allDay) {
          const d = new Date(endRaw);
          d.setDate(d.getDate() - 1);
          endDate = toDateStr(d.toISOString());
        } else {
          endDate = toDateStr(endRaw);
        }
      }
      return {
        id: item.id,
        title: item.summary ?? "Busy",
        date: toDateStr(startRaw),
        endDate: endDate !== toDateStr(startRaw) ? endDate : undefined,
        allDay,
        color: item.colorId ? GCOLOR[item.colorId] : "#4285F4",
      };
    });

  return NextResponse.json({ events });
}
