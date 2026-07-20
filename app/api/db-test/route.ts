import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'ok', message: 'Connected to MongoDB' });
  } catch (error) {
    console.error('DB connection error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to MongoDB' },
      { status: 500 }
    );
  }
}
