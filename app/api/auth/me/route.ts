import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';

export async function GET(request: Request) {
  const payload = await getUserFromRequest(request);

  if (!payload) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    },
  });
}
