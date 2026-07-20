import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { FarmerProfile } from '@/lib/models/FarmerProfile'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(userId).lean()
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })
    }

    const u: any = user as any
    const fProfile = await FarmerProfile.findOne({ $or: [{ user: user._id }, { userId: String(user._id) }] }).lean()
    const resolvedPhone = (fProfile?.contactNumber ?? u?.phone ?? u?.phno ?? u?.mobile ?? null)
    const resolvedAddress = (fProfile?.homeAddress ?? u?.address ?? null)

    const profile = {
      id: String(user._id),
      name: user.name || null,
      email: user.email || null,
      phone: resolvedPhone ? String(resolvedPhone) : null,
      address: resolvedAddress || null,
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('Error in GET /api/farmer/profile:', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}
