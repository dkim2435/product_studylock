'use client';

import { useState, useEffect, useRef } from 'react';

interface WeatherData {
  isRaining: boolean;
  isNight: boolean;
  condition: string;
  temperature: number;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({
    isRaining: false,
    isNight: false,
    condition: 'clear',
    temperature: 20,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      // Check time of day locally (always works)
      const hour = new Date().getHours();
      const isNight = hour >= 20 || hour < 6;

      // Try to get user's location for weather
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });

        const { latitude, longitude } = pos.coords;
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,weather_code`
        );
        const data = await resp.json();
        const current = data.current;

        // Weather codes: 51-67 = drizzle/rain, 71-77 = snow, 80-82 = rain showers, 95-99 = thunderstorm
        const code = current?.weather_code ?? 0;
        const isRaining = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);

        setWeather({
          isRaining,
          isNight,
          condition: isRaining ? 'rain' : 'clear',
          temperature: current?.temperature_2m ?? 20,
        });
      } catch {
        // Geolocation denied or API failed — use time-based fallback
        setWeather({
          isRaining: false,
          isNight,
          condition: 'clear',
          temperature: 20,
        });
      }
    }

    fetchWeather();
    // Re-check every 30 minutes
    intervalRef.current = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return weather;
}
