export type WeatherData = {
  temperature_c: number;
  feels_like_c: number;
  condition: "clear" | "cloudy" | "rain" | "snow" | "fog" | "wind";
  wind_kph: number;
  humidity_pct: number;
  uv_index: number;
};

export type WeatherForecast = {
  date: string;
  temp_min_c: number;
  temp_max_c: number;
  condition: WeatherData["condition"];
  precipitation_probability: number;
};

// WMO weather interpretation codes → simplified condition
function wmoToCondition(code: number): WeatherData["condition"] {
  if (code === 0 || code === 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code <= 49) return "fog";
  if (code <= 69) return "rain";
  if (code <= 79) return "snow";
  if (code <= 99) return "rain"; // thunderstorm
  return "cloudy";
}

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    uv_index?: number;
  };
};

type OpenMeteoDailyResponse = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
  };
};

// Forecast for a specific day (dayIndex 0 = today, 1 = tomorrow, …, 6 = 6 days out)
export async function getWeatherForecast(lat: number, lon: number, dayIndex: number): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: ["temperature_2m_max", "temperature_2m_min", "weather_code", "precipitation_probability_max"].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = (await res.json()) as OpenMeteoDailyResponse;
  const d = data.daily;
  const idx = Math.max(0, Math.min(6, dayIndex));

  return {
    date: d.time[idx],
    temp_min_c: Math.round(d.temperature_2m_min[idx]),
    temp_max_c: Math.round(d.temperature_2m_max[idx]),
    condition: wmoToCondition(d.weather_code[idx]),
    precipitation_probability: d.precipitation_probability_max[idx] ?? 0,
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "relative_humidity_2m",
      "uv_index",
    ].join(","),
    wind_speed_unit: "kmh",
    forecast_days: "1",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 1800 }, // cache 30 min in Next.js
  });

  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = (await res.json()) as OpenMeteoResponse;
  const c = data.current;

  return {
    temperature_c: Math.round(c.temperature_2m * 10) / 10,
    feels_like_c: Math.round(c.apparent_temperature * 10) / 10,
    condition: wmoToCondition(c.weather_code),
    wind_kph: Math.round(c.wind_speed_10m),
    humidity_pct: c.relative_humidity_2m,
    uv_index: c.uv_index ?? 0,
  };
}
