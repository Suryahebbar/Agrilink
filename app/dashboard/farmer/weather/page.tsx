"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WeatherData {
  location: {
    display: string;
    city: string;
    state: string;
    country: string;
  };
  forecast: {
    date: string;
    maxTemp: number;
    minTemp: number;
    rainProbability: number;
    condition: string;
  }[];
}

// Weather code → Text (same as weathers.js)
const weatherMeaning: { [key: number]: string } = {
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

export default function WeatherPage() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        setError('Please log in to view weather information');
        return;
      }

      const userData = await authResponse.json();
      const userId = userData.user?.id || userData.user?._id;

      if (!userId) {
        setError('User ID not found');
        return;
      }

      // Get user's land details for coordinates
      const landResponse = await fetch(`/api/farmer/land-details?userId=${userId}`);
      if (!landResponse.ok) {
        setError('Land details not found. Please map your land first.');
        return;
      }

      const landData = await landResponse.json();
      console.log('Land details response:', landData);
      
      if (!landData.data || landData.data.length === 0) {
        setError('No land details found. Please map your land first.');
        return;
      }

      const land = landData.data[0];
      console.log('Land object:', land);
      console.log('Land data structure:', JSON.stringify(land, null, 2));
      
      const { centroidLatitude, centroidLongitude } = land.landData || {};
      console.log('DEBUG: Weather page extracted coordinates from DB - centroidLatitude:', centroidLatitude, 'centroidLongitude:', centroidLongitude);
      console.log('DEBUG: Full land.landData object:', land.landData);

      if (!centroidLatitude || !centroidLongitude) {
        console.log('Coordinates missing, checking alternative fields');
        // Try alternative field names
        const altLat = land.centroidLatitude || land.latitude;
        const altLon = land.centroidLongitude || land.longitude;
        console.log('Alternative coordinates:', { altLat, altLon });
        
        if (!altLat || !altLon) {
          setError('Land coordinates not found. Please ensure your land is properly mapped.');
          return;
        }
        
        // Use alternative coordinates
        var finalLat = altLat;
        var finalLon = altLon;
      } else {
        var finalLat = centroidLatitude;
        var finalLon = centroidLongitude;
      }

      console.log('Final coordinates to use:', { finalLat, finalLon });

      // Get location name - with better fallback for Karnataka region
      let location = {
        display: `Coordinates: ${finalLat.toFixed(4)}, ${finalLon.toFixed(4)}`,
        city: "Unknown",
        state: "Unknown", 
        country: "Unknown"
      };
      
      // Check if coordinates are in Karnataka region for better fallback
      const latNum = parseFloat(finalLat);
      const lonNum = parseFloat(finalLon);
      if (latNum >= 12 && latNum <= 14 && lonNum >= 74 && lonNum <= 76) {
        location = {
          display: `Karnataka Region (${finalLat.toFixed(4)}, ${finalLon.toFixed(4)})`,
          city: "Karnataka Region",
          state: "Karnataka", 
          country: "India"
        };
      }
      
      try {
        const locationResponse = await fetch(`/api/weather/location?lat=${finalLat}&lon=${finalLon}`);
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          console.log('Location API response:', locationData);
          if (locationData.display && locationData.display !== "Unknown Location" && !locationData.error) {
            location = locationData;
          }
          console.log('Final location object:', location);
        } else {
          console.log('Location API failed:', locationResponse.status);
        }
      } catch (locationError) {
        console.log('Location API error:', locationError);
        // Fallback to coordinate display is already set above
      }

      // Get weather forecast
      const weatherResponse = await fetch(`/api/weather/forecast?lat=${finalLat}&lon=${finalLon}`);
      if (!weatherResponse.ok) {
        setError('Failed to fetch weather data');
        return;
      }

      const weatherForecast = await weatherResponse.json();

      // Process weather data
      const forecast = weatherForecast.daily.time.map((date: string, index: number) => ({
        date,
        maxTemp: weatherForecast.daily.temperature_2m_max[index],
        minTemp: weatherForecast.daily.temperature_2m_min[index],
        rainProbability: weatherForecast.daily.precipitation_probability_max[index],
        condition: weatherMeaning[weatherForecast.daily.weathercode[index]] || "Unknown Weather"
      }));

      setWeatherData({
        location,
        forecast
      });

    } catch (err) {
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Weather Forecast</h1>
          <p className="text-sm text-[#6b7280] mt-1">7-day weather forecast for your farm location.</p>
        </div>
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6 text-center">
          <p className="text-[#6b7280]">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Weather Forecast</h1>
          <p className="text-sm text-[#6b7280] mt-1">7-day weather forecast for your farm location.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadWeatherData}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-[#166534] px-4 py-2 text-sm font-medium text-white hover:bg-[#14532d]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Weather Forecast</h1>
          <p className="text-sm text-[#6b7280] mt-1">7-day weather forecast for your farm location.</p>
        </div>
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6 text-center">
          <p className="text-[#6b7280]">No weather data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f3b2c]">Weather Forecast</h1>
        <p className="text-sm text-[#6b7280] mt-1">7-day weather forecast for your farm location.</p>
      </div>

      {/* Location Header */}
      <section className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1f3b2c]">Your Farm Location</h2>
              <p className="text-sm text-[#6b7280] mt-1">Based on your land coordinates</p>
            </div>
            <button
              onClick={loadWeatherData}
              className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-4 py-2 text-sm font-medium text-[#1f3b2c] hover:bg-[#f7f0de]"
            >
              Refresh
            </button>
          </div>
          
          {/* Location Address */}
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#1f3b2c]">Farm Address</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#6b7280]">{weatherData.location.display}</p>
                <div className="flex items-center space-x-4 text-xs text-[#6b7280]">
                  <span>{weatherData.location.city}</span>
                  <span>{weatherData.location.state}</span>
                  <span>{weatherData.location.country}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weather Forecast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weatherData.forecast.map((day, index) => (
          <section key={index} className="bg-white border border-[#e2d4b7] rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1f3b2c]">
                  🗓 {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6b7280]">Max:</span>
                  <span className="text-sm font-medium text-[#1f3b2c]">{day.maxTemp}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6b7280]">Min:</span>
                  <span className="text-sm font-medium text-[#1f3b2c]">{day.minTemp}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6b7280]">Rain:</span>
                  <span className="text-sm font-medium text-[#1f3b2c]">{day.rainProbability}%</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-[#e2d4b7]">
                <p className="text-xs font-medium text-[#1f3b2c]">{day.condition}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Farming Tips */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Farming Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="text-blue-800">
            <div className="font-semibold mb-2">Weather Planning</div>
            <ul className="space-y-1 text-xs">
              {weatherData.forecast.slice(0, 3).map((day, index) => (
                <li key={index}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}: 
                  {day.rainProbability > 45 ? ' High rain chance - prepare drainage' : 
                   day.rainProbability > 20 ? ' Moderate rain chance - good for irrigation' : 
                   ' Low rain chance - plan irrigation'}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-blue-800">
            <div className="font-semibold mb-2">Temperature Advisory</div>
            <ul className="space-y-1 text-xs">
              {weatherData.forecast.slice(0, 3).map((day, index) => (
                <li key={index}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}: 
                  {day.maxTemp > 30 ? ' Very hot - provide shade for crops' : 
                   day.maxTemp > 25 ? ' Warm - good growing conditions' : 
                   day.maxTemp > 20 ? ' Mild - optimal for most crops' : 
                   ' Cool - protect sensitive plants'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
