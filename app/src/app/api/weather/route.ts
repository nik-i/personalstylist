import { NextRequest, NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const data = await getWeather(lat, lon);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
