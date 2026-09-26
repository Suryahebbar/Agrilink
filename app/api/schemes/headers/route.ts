import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const unifiedHeaders = [
      { label: "Land Size (Acres)", key: "land_size" },
      { label: "State", key: "state" },
      { label: "Crop Type", key: "crop_type" },
      { label: "Season", key: "season" },
      { label: "Irrigation Type", key: "irrigation_type" },
      { label: "Organic Certification", key: "organic_certification" },
      { label: "Age", key: "farmer_age" },
      { label: "Gender", key: "gender" },
      { label: "Income", key: "income_category" },
      { label: "PM-Kisan Registration", key: "pm_kisan" },
      { label: "FPO Membership", key: "fpo_membership" },
      { label: "Disaster Affected", key: "disaster_affected" },
      { label: "Soil Type", key: "soil_type" },
      { label: "Farmer Category", key: "farmer_category" }
    ];

    return NextResponse.json({ headers: unifiedHeaders });
  } catch (err: any) {
    console.error('Detailed error:', err);
    return NextResponse.json({ 
      error: err.message || "failed to read file"
    }, { status: 500 });
  }
}


