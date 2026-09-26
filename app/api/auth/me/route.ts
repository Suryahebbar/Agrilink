import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models/User';

export async function GET(request: Request) {
  const payload = await getUserFromRequest(request);

  if (!payload) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.sub);
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: user?.fullName || '',
      },
    });
  } catch (error) {
    console.error('Error fetching user info in auth/me:', error);
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
    });
  }
}
