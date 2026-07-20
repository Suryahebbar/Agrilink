// Weather Forecast for Next 7 Days using Open-Meteo + Reverse Geocoding
// Run: node weather.js <lat> <lon>

import fetch from "node-fetch";

// Take input coordinates
const lat = process.argv[2];
const lon = process.argv[3];

if (!lat || !lon) {
  console.error("Usage: node weather.js <latitude> <longitude>");
  process.exit(1);
}

// Convert coordinates → human-readable location
async function getLocation(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.display_name || "Unknown Location";
}

// Get 7-day weather forecast
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

// Map weather codes → readable text
const weatherMeaning = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Drizzle",
  61: "Light Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  80: "Rain Showers",
  95: "Thunderstorm"
};

(async () => {
  const place = await getLocation(lat, lon);
  const weather = await getWeather(lat, lon);

  console.log("\n📍 Location:", place);
  console.log("📅 7-Day Weather Forecast:\n");

  const days = weather.daily.time;

  for (let i = 0; i < days.length; i++) {
    const date = days[i];
    const max = weather.daily.temperature_2m_max[i];
    const min = weather.daily.temperature_2m_min[i];
    const rain = weather.daily.precipitation_sum[i];
    const code = weather.daily.weathercode[i];
    const desc = weatherMeaning[code] || "Unknown Weather";

    console.log(`🗓 ${date}`);
    console.log(`   🌡 Max: ${max}°C | Min: ${min}°C`);
    console.log(`   🌧 Rain: ${rain} mm`);
    console.log(`   ☁️ Condition: ${desc}\n`);
  }
})();
