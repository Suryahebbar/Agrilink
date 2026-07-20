import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  console.log('Getting location for coordinates:', lat, lon);

  try {

    // Reverse Geocoding → Convert coordinates to location name (using format=jsonv2)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    console.log('Requesting URL:', url);
    
    let location = {
      display: "Unknown Location",
      city: "Unknown City",
      state: "Unknown State",
      country: "Unknown Country"
    };

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AgriLink-Farming-App/1.0'
        }
      });
      const data = await res.json();
      
      console.log('Nominatim response:', data);

      location = {
        display: data.display_name || "Unknown Location",
        city: data.address?.city || data.address?.town || data.address?.village || "Unknown City",
        state: data.address?.state || "Unknown State",
        country: data.address?.country || "Unknown Country"
      };
    } catch (fetchError) {
      console.log('Nominatim API failed, using fallback:', fetchError);
      
      // Fallback based on coordinates for Karnataka region
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      
      if (latNum >= 12 && latNum <= 14 && lonNum >= 74 && lonNum <= 76) {
        location = {
          display: `Karnataka Region (${latNum.toFixed(4)}, ${lonNum.toFixed(4)})`,
          city: "Karnataka Region",
          state: "Karnataka",
          country: "India"
        };
      } else {
        location = {
          display: `Coordinates: ${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`,
          city: "Unknown",
          state: "Unknown",
          country: "Unknown"
        };
      }
    }

    console.log('Final location:', location);

    return NextResponse.json(location);

  } catch (error) {
    console.error('Error getting location:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return fallback location instead of error
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    const fallbackLocation = latNum >= 12 && latNum <= 14 && lonNum >= 74 && lonNum <= 76 ? {
      display: `Karnataka Region (${latNum.toFixed(4)}, ${lonNum.toFixed(4)})`,
      city: "Karnataka Region", 
      state: "Karnataka",
      country: "India"
    } : {
      display: `Coordinates: ${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`,
      city: "Unknown",
      state: "Unknown",
      country: "Unknown"
    };
    
    console.log('Returning fallback location:', fallbackLocation);
    return NextResponse.json(fallbackLocation);
  }
}
