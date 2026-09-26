import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { DigitizedPlot } from '@/lib/models/DigitizedPlot';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, district, taluk, hobli, village, survey, surnoc, hissa } = body;

    if (!userId || !district || !taluk || !hobli || !village || !survey) {
      return NextResponse.json(
        { success: false, error: 'Missing required search fields' },
        { status: 400 }
      );
    }

    // 1. Fetch user's registered name
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const registeredName = user.fullName;

    // 2. Fetch the digitized plot
    const plot = await DigitizedPlot.findOne({
      'administrative.district': { $regex: new RegExp(`^${district}$`, 'i') },
      'administrative.taluk': { $regex: new RegExp(`^${taluk}$`, 'i') },
      'administrative.hobli': { $regex: new RegExp(`^${hobli}$`, 'i') },
      'administrative.village': { $regex: new RegExp(`^${village}$`, 'i') },
      'administrative.survey': survey,
      'administrative.surnoc': surnoc || '—',
      'administrative.hissa': hissa || '—'
    });

    if (!plot) {
      return NextResponse.json(
        { success: false, error: 'No matching digitized land record found in the database.' },
        { status: 404 }
      );
    }

    // 3. Normalize names and compare
    const cleanRegistered = (registeredName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanOwner = (plot.owner?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const isMatch = cleanRegistered === cleanOwner || 
                    cleanRegistered.includes(cleanOwner) || 
                    cleanOwner.includes(cleanRegistered);

    if (!isMatch) {
      return NextResponse.json({
        success: false,
        error: `Verification Failed: The registered name "${registeredName}" does not match the land record owner name "${plot.owner?.name}".`
      }, { status: 400 });
    }

    // 4. Return plot details if names match
    return NextResponse.json({
      success: true,
      message: 'Identity and land ownership verified successfully!',
      plot
    });
  } catch (error) {
    console.error('Error verifying land record:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
