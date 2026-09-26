import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SchemeRecommendation from '@/lib/models/SchemeRecommendation';
import Scheme from '@/lib/models/Scheme';

export const dynamic = 'force-dynamic';

// GET - Retrieve recommendations for a specific farmer
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const recommendations = await SchemeRecommendation.find({
      'farmerResponses.userId': userId
    })
    .populate('schemeId')
    .sort({ createdAt: -1 })
    .lean();

    // Map responses to only return the status corresponding to this farmer
    const formatted = recommendations.map((rec: any) => {
      const response = rec.farmerResponses.find((r: any) => String(r.userId) === userId);
      return {
        _id: rec._id,
        scheme: rec.schemeId, // populated Scheme details
        status: response ? response.status : 'pending',
        bulkApplied: rec.bulkApplied,
        bulkAppliedAt: rec.bulkAppliedAt,
        createdAt: rec.createdAt
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('Error fetching farmer recommendations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Update farmer response status (interested / not_interested)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { recommendationId, userId, status } = body;

    if (!recommendationId || !userId || !status) {
      return NextResponse.json({ success: false, error: 'recommendationId, userId and status are required' }, { status: 400 });
    }

    if (!['interested', 'not_interested'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid response status' }, { status: 400 });
    }

    const rec = await SchemeRecommendation.findById(recommendationId);
    if (!rec) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 });
    }

    const idx = rec.farmerResponses.findIndex((r: any) => String(r.userId) === userId);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Farmer not targeted in this recommendation' }, { status: 403 });
    }

    rec.farmerResponses[idx].status = status;
    rec.farmerResponses[idx].updatedAt = new Date();
    await rec.save();

    return NextResponse.json({ success: true, message: 'Status updated successfully', data: rec });
  } catch (err: any) {
    console.error('Error updating farmer response:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
