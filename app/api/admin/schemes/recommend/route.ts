import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SchemeRecommendation from '@/lib/models/SchemeRecommendation';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { User } from '@/lib/models/User';
import Scheme from '@/lib/models/Scheme';

export const dynamic = 'force-dynamic';

// GET - Fetch recommendations sent by FCO or perform bulk apply
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const fcoId = searchParams.get('fcoId');
    const bulkApplyId = searchParams.get('bulkApplyId');

    // Bulk Apply Action
    if (bulkApplyId) {
      const updated = await SchemeRecommendation.findByIdAndUpdate(
        bulkApplyId,
        {
          bulkApplied: true,
          bulkAppliedAt: new Date()
        },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Recommendation campaign not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Successfully bulk-applied for all interested farmers!', data: updated });
    }

    if (!fcoId) {
      return NextResponse.json({ success: false, error: 'fcoId is required' }, { status: 400 });
    }

    const recommendations = await SchemeRecommendation.find({ fcoId })
      .populate('schemeId', 'name category')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: recommendations });
  } catch (err: any) {
    console.error('Error fetching recommendations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Send recommendation to matching farmers
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { schemeId, fcoId, state, crop, landSize } = body;

    if (!schemeId || !fcoId) {
      return NextResponse.json({ success: false, error: 'schemeId and fcoId are required' }, { status: 400 });
    }

    // Find farmers matching filters
    // 1. Gather active farmers
    const farmers = await User.find({ role: 'farmer', status: 'active' }).lean();
    const farmerIds = farmers.map((f: any) => String(f._id));

    // 2. Fetch profiles and land records
    const [profiles, lands] = await Promise.all([
      FarmerProfile.find({ userId: { $in: farmerIds } }).lean(),
      LandDetails.find({ userId: { $in: farmerIds } }).lean()
    ]);

    const profileMap = new Map(profiles.map((p: any) => [String(p.userId), p]));
    const landMap = new Map(lands.map((l: any) => [String(l.userId), l]));

    const matchedFarmers: Array<{ userId: string; fullName: string }> = [];

    farmers.forEach((f: any) => {
      const fId = String(f._id);
      const prof = profileMap.get(fId) || {};
      const land = landMap.get(fId) || {};
      const rtc = (land as any).rtcDetails || {};

      let matches = true;

      // Match State
      if (state && state !== 'All') {
        const addressMatch = String((prof as any).rtcAddress || f.address || rtc.location || '').toLowerCase().includes(state.toLowerCase());
        if (!addressMatch) matches = false;
      }

      // Match Crop
      if (crop && crop !== 'All') {
        const cropsList: any[] = rtc.allCrops || [];
        const hasCrop = cropsList.some(c => {
          const cName = typeof c === 'object' && c !== null ? (c.name || '') : String(c);
          return cName.toLowerCase() === crop.toLowerCase();
        });
        if (!hasCrop) matches = false;
      }

      // Match Land Size
      if (landSize && landSize !== 'All') {
        const area = parseFloat((land as any).landData?.totalArea || rtc.extent || (land as any).totalArea || "0");
        if (landSize === '< 1 acre' && area >= 1) matches = false;
        else if (landSize === '1-2 acres' && (area < 1 || area > 2)) matches = false;
        else if (landSize === '2-5 acres' && (area < 2 || area > 5)) matches = false;
        else if (landSize === '5-10 acres' && (area < 5 || area > 10)) matches = false;
        else if (landSize === '> 10 acres' && area <= 10) matches = false;
      }

      if (matches) {
        matchedFarmers.push({
          userId: fId,
          fullName: f.fullName
        });
      }
    });

    if (matchedFarmers.length === 0) {
      return NextResponse.json({ success: false, error: 'No farmers match the selected eligibility filters' }, { status: 400 });
    }

    const recommendation = await SchemeRecommendation.create({
      schemeId,
      fcoId,
      targetFilters: { state, crop, landSize },
      farmerResponses: matchedFarmers.map(mf => ({
        userId: mf.userId,
        fullName: mf.fullName,
        status: 'pending',
        updatedAt: new Date()
      }))
    });

    return NextResponse.json({ success: true, data: recommendation, count: matchedFarmers.length });
  } catch (err: any) {
    console.error('Error creating recommendation:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
