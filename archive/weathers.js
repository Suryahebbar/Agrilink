// Node.js Program: Reverse Geocode + 7-Day Weather Forecast
// Run: node weather.js <lat> <lon>

import fetch from "node-fetch";

const lat = process.argv[2];
const lon = process.argv[3];

if (!lat || !lon) {
  console.error("Usage: node weather.js <latitude> <longitude>");
  process.exit(1);
}

// Reverse Geocoding → Convert coordinates to location name
async function getLocation(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  const data = await res.json();

  return {
    display: data.display_name || "Unknown Location",
    city: data.address?.city || data.address?.town || data.address?.village || "Unknown City",
    state: data.address?.state || "Unknown State",
    country: data.address?.country || "Unknown Country"
  };
}

// Fetch 7-day forecast
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

// Weather code → Text
const meaning = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Light Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  80: "Rain Showers",
  95: "Thunderstorm"
};

// Main
(async () => {
  const loc = await getLocation(lat, lon);
  const weather = await getWeather(lat, lon);

  console.log("\n📍 EXACT LOCATION:");
  console.log(`   ${loc.display}`);
  console.log(`   City: ${loc.city}`);
  console.log(`   State: ${loc.state}`);
  console.log(`   Country: ${loc.country}`);

  console.log("\n📅 7-DAY WEATHER FORECAST:\n");

  const dates = weather.daily.time;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const max = weather.daily.temperature_2m_max[i];
    const min = weather.daily.temperature_2m_min[i];
    const rainProb = weather.daily.precipitation_probability_max[i];
    const code = weather.daily.weathercode[i];
    const desc = meaning[code] || "Unknown";

    console.log(`🗓 ${date}`);
    console.log(`   🌡 Max: ${max}°C | Min: ${min}°C`);
    console.log(`   🌧 Rain Probability: ${rainProb}%`);
    console.log(`   ☁️ Condition: ${desc}\n`);
  }
})();
