import { NextResponse } from 'next/server';

// Weather code → Text (same as weathers.js)
const meaning: { [key: number]: string } = {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    console.log('Getting weather forecast for coordinates:', lat, lon);

    // Fetch 7-day forecast (same as weathers.js)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
    console.log('Requesting weather URL:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
    }

    const weatherData = await res.json();
    console.log('Weather API response:', weatherData);

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Error getting weather forecast:', error);
    return NextResponse.json({ error: 'Failed to get weather forecast' }, { status: 500 });
  }
}
