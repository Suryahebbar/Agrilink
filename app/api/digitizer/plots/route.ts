import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { DigitizedPlot } from '@/lib/models/DigitizedPlot';

// CORS response helper
function corsResponse(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return corsResponse(res);
}

// GET - Retrieve all digitized plots
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const plots = await DigitizedPlot.find({}).sort({ createdAt: -1 });
    return corsResponse(
      NextResponse.json({
        success: true,
        data: plots,
        count: plots.length
      })
    );
  } catch (error) {
    console.error('Error fetching digitized plots:', error);
    return corsResponse(
      NextResponse.json({
        success: false,
        error: 'Failed to fetch digitized plots'
      }, { status: 500 })
    );
  }
}

// POST - Sync/upsert a batch of digitized plots
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // We expect either a single plot object or an array of plot objects
    const items = Array.isArray(body) ? body : [body];
    const results = [];

    for (const item of items) {
      if (!item.id || !item.type || !item.administrative?.survey) {
        continue; // skip invalid records
      }

      // Format to schema
      const plotData = {
        plotId: item.id,
        type: item.type,
        points: item.points,
        administrative: {
          district: item.administrative.district || '',
          taluk: item.administrative.taluk || '',
          hobli: item.administrative.hobli || '',
          village: item.administrative.village || '',
          survey: item.administrative.survey,
          surnoc: item.administrative.surnoc,
          hissa: item.administrative.hissa,
          ulpin: item.administrative.ulpin,
          olc: item.administrative.olc
        },
        owner: {
          name: item.owner?.name,
          father: item.owner?.father,
          khata: item.owner?.khata,
          ownership_type: item.owner?.ownership_type,
          address: item.owner?.address
        },
        land: {
          total_area: item.land?.total_area,
          cultivable_area: item.land?.cultivable_area,
          pot_kharab_a: item.land?.pot_kharab_a,
          pot_kharab_b: item.land?.pot_kharab_b,
          revenue: item.land?.revenue,
          jodi: item.land?.jodi,
          cess: item.land?.cess,
          water_rate: item.land?.water_rate,
          soil: item.land?.soil,
          land_type: item.land?.land_type,
          irrigation_source: item.land?.irrigation_source,
          trees: item.land?.trees
        },
        gis: {
          geojson_geom: item.gis?.geojson_geom,
          centroid: item.gis?.centroid,
          bbox: item.gis?.bbox,
          area: item.gis?.area || 0,
          perimeter: item.gis?.perimeter || 0,
          side_lengths: item.gis?.side_lengths || [],
          latitude: item.gis?.latitude ?? undefined,
          longitude: item.gis?.longitude ?? undefined
        },
        crops: item.crops || []
      };

      const doc = await DigitizedPlot.findOneAndUpdate(
        { plotId: item.id },
        plotData,
        { new: true, upsert: true }
      );
      results.push(doc);
    }

    return corsResponse(
      NextResponse.json({
        success: true,
        message: `Successfully synced ${results.length} plot(s)`,
        data: results
      })
    );
  } catch (error) {
    console.error('Error syncing digitized plots:', error);
    return corsResponse(
      NextResponse.json({
        success: false,
        error: 'Failed to sync digitized plots'
      }, { status: 500 })
    );
  }
}
