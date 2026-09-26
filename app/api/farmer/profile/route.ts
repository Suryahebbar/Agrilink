import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { DigitizedPlot } from '@/lib/models/DigitizedPlot';

export const dynamic = 'force-dynamic';

// GET - Retrieve complete farmer profile details
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    const u: any = user as any;
    let fProfile = await FarmerProfile.findOne({ $or: [{ user: user._id }, { userId: String(user._id) }] }).lean();

    if (!fProfile) {
      // Create empty profile if not existing
      const newProfile = new FarmerProfile({
        user: user._id,
        userId: String(user._id),
        verifiedName: user.fullName || '',
        contactNumber: u.phone || u.phno || u.mobile || '',
        homeAddress: u.address || '',
        gender: '',
        dob: '',
        bio: 'Passionate about sustainable agriculture and smart farming.'
      });
      await newProfile.save();
      fProfile = newProfile.toObject();
    }

    // Dynamic land data enrichment from DigitizedPlot based on linked LandDetails
    const landDetails = await LandDetails.findOne({ userId: String(user._id) }).lean();
    let latestPlot = null;
    if (landDetails && landDetails.rtcDetails && landDetails.rtcDetails.surveyNumber) {
      latestPlot = await DigitizedPlot.findOne({
        'administrative.survey': landDetails.rtcDetails.surveyNumber
      }).lean();
    }

    const resolvedAddress = user.address || latestPlot?.owner?.address || fProfile.homeAddress || '';
    const resolvedArea = latestPlot?.land?.cultivable_area || latestPlot?.land?.total_area || fProfile.totalCultivableArea || '';
    const resolvedIdentity = latestPlot ? `${latestPlot.administrative.survey}/${latestPlot.administrative.surnoc || ''}/${latestPlot.administrative.hissa || ''}` : fProfile.landParcelIdentity || '';
    const resolvedSoil = latestPlot?.land?.soil || fProfile.soilProperties || '';

    return NextResponse.json({
      success: true,
      profile: {
        id: String(user._id),
        name: user.fullName || fProfile.verifiedName || '',
        email: user.email || '',
        phone: fProfile.contactNumber || '',
        address: resolvedAddress,
        gender: fProfile.gender || '',
        dob: fProfile.dob || '',
        bio: fProfile.bio || 'Passionate about sustainable agriculture and smart farming.',
        profilePic: fProfile.profilePic || null,
        readyToIntegrate: fProfile.readyToIntegrate || false,
        memberSince: (user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Nov 2024',
        landParcelIdentity: resolvedIdentity,
        totalCultivableArea: resolvedArea,
        soilProperties: resolvedSoil,
      }
    });
  } catch (err) {
    console.error('Error in GET /api/farmer/profile:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

// POST - Update farmer profile details
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, dob, gender, phone, address, bio, readyToIntegrate, profilePic } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save address directly to the User model
    user.address = address;
    await user.save();

    const updatedProfile = await FarmerProfile.findOneAndUpdate(
      { $or: [{ user: user._id }, { userId: String(user._id) }] },
      {
        dob,
        gender,
        contactNumber: phone,
        homeAddress: address,
        bio: bio || 'Passionate about sustainable agriculture and smart farming.',
        readyToIntegrate: readyToIntegrate || false,
        profilePic
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Error in POST /api/farmer/profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
