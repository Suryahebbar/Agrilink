import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint moved to /api/auth/admin/login' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint moved to /api/auth/admin/login' },
    { status: 405 }
  );
}
