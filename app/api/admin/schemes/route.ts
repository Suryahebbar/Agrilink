import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Scheme from '@/lib/models/Scheme';

export const dynamic = 'force-dynamic';

// GET - Retrieve all schemes with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'All';
    const status = searchParams.get('status') || 'All';

    const query: Record<string, any> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status !== 'All') {
      query.isActive = status === 'Active';
    }

    const skip = (page - 1) * limit;

    const [schemes, total] = await Promise.all([
      Scheme.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Scheme.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: schemes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Error fetching admin schemes:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Manually add a scheme
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, link, category, raw } = body;

    if (!name || !category) {
      return NextResponse.json({ success: false, error: 'Name and Category are required' }, { status: 400 });
    }

    const newScheme = await Scheme.create({
      name,
      link,
      category,
      raw: raw || {},
      isActive: true
    });

    return NextResponse.json({ success: true, data: newScheme });
  } catch (err: any) {
    console.error('Error creating scheme:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - Update a scheme (including toggle active state)
export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, name, link, category, isActive, raw } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Scheme ID is required' }, { status: 400 });
    }

    const updatedScheme = await Scheme.findByIdAndUpdate(
      id,
      { name, link, category, isActive, raw },
      { new: true }
    );

    if (!updatedScheme) {
      return NextResponse.json({ success: false, error: 'Scheme not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedScheme });
  } catch (err: any) {
    console.error('Error updating scheme:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - Delete a scheme
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Scheme ID is required' }, { status: 400 });
    }

    const deleted = await Scheme.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Scheme not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Scheme deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting scheme:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
