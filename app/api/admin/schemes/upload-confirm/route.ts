import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Scheme from '@/lib/models/Scheme';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { newSchemes, updatedSchemes, removedSchemes } = body;

    // 1. Insert new schemes
    if (newSchemes && newSchemes.length > 0) {
      const inserts = newSchemes.map((s: any) => ({
        name: s.name,
        link: s.link || undefined,
        category: s.category || 'General',
        raw: s.raw || {},
        isActive: true
      }));
      await Scheme.insertMany(inserts);
    }

    // 2. Update updated schemes
    if (updatedSchemes && updatedSchemes.length > 0) {
      for (const u of updatedSchemes) {
        if (u.id) {
          await Scheme.findByIdAndUpdate(u.id, {
            name: u.new.name,
            link: u.new.link || undefined,
            category: u.new.category || 'General',
            raw: u.new.raw || {},
            isActive: true // reactivate if it was inactive
          });
        }
      }
    }

    // 3. Mark removed schemes as inactive (deactivate)
    if (removedSchemes && removedSchemes.length > 0) {
      const removedIds = removedSchemes.map((s: any) => s._id);
      await Scheme.updateMany(
        { _id: { $in: removedIds } },
        { isActive: false }
      );
    }

    return NextResponse.json({ success: true, message: 'Schemes updated successfully' });
  } catch (err: any) {
    console.error('Error confirming scheme upload:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
