import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FarmerOrder } from '@/lib/models/FarmerOrder'
import { Document, Types } from 'mongoose'

interface IFarmerOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId | string;
  user?: Types.ObjectId | string;
  orderNumber: string;
  status: string;
  // Add other fields as needed
  [key: string]: unknown; // For any additional dynamic properties
}

// Order details API with realistic status tracking
export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    // Extract orderId from URL path since params might be empty
    const urlParts = req.url.split('/')
    const orderId = urlParts[urlParts.length - 1].split('?')[0]

    // Debug: Log the parameters
    console.log('API called with:', { userId, orderId, params, url: req.url })

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    await connectDB()

    // Find order using string comparison approach
    const allUserOrders = await FarmerOrder.find({ 
      $or: [{ userId }, { user: userId }]
    }).lean()
    
    console.log(`Found ${allUserOrders.length} orders for user`)
    
    const order = allUserOrders.find((o: IFarmerOrder) => {
      const orderIdStr = o._id.toString()
      const matches = orderIdStr === orderId
      console.log(`Comparing: "${orderIdStr}" with "${orderId}" -> ${matches}`)
      return matches
    })

    if (!order) {
      console.log('Order not found after comparison')
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('Order found successfully:', order.orderNumber)

    // Initialize tracking and statusHistory if they don't exist (for backward compatibility)
    const updatedOrder = { ...order }
    if (!updatedOrder.tracking) {
      updatedOrder.tracking = {}
    }
    if (!updatedOrder.statusHistory) {
      updatedOrder.statusHistory = [{
        status: updatedOrder.status || 'confirmed',
        timestamp: updatedOrder.createdAt,
        note: 'Order confirmed'
      }]
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (err) {
    console.error('GET /api/farmer/orders/[orderId] error:', err)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    // Extract orderId from URL path since params might be empty
    const urlParts = req.url.split('/')
    const orderId = urlParts[urlParts.length - 1].split('?')[0]
    
    const body = await req.json()
    const { action } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    // Find order using string comparison approach
    const allUserOrders = await FarmerOrder.find({ 
      $or: [{ userId }, { user: userId }]
    }).lean()
    
    const order = allUserOrders.find((o: IFarmerOrder) => o._id.toString() === orderId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (action === 'cancel') {
      return NextResponse.json({ error: 'Order cancellation is not available' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/farmer/orders/[orderId] error:', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
