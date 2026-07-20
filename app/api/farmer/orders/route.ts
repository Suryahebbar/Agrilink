import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FarmerOrder } from '@/lib/models/FarmerOrder'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    const orders = await FarmerOrder.find({ $or: [{ userId }, { user: userId }] })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ orders })
  } catch (err) {
    console.error('GET /api/farmer/orders error:', err)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, items, shipping, totalAmount } = body || {}

    console.log('Farmer order creation request:', { userId, itemsCount: items?.length, shipping, totalAmount })

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'items are required' }, { status: 400 })
    if (!shipping?.name || !shipping?.phone || !shipping?.address) return NextResponse.json({ error: 'shipping details are incomplete' }, { status: 400 })

    await connectDB()

    const orderNumber = `AGR${Date.now()}`
    
    // Calculate estimated delivery (3-5 business days from now)
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3)
    
    // Generate tracking number
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Process items to ensure sellerId is properly set
    const processedItems = items.map(item => {
      const processedItem = {
        ...item,
        sellerId: item.sellerId || item.seller || null
      };
      console.log(`Processing item: ${item.name}, sellerId: ${processedItem.sellerId}`);
      return processedItem;
    });

    console.log('Creating farmer order with processed items:', processedItems.length);

    // Create farmer order with sellerId in items
    const order = await FarmerOrder.create({
      orderNumber,
      user: userId,
      userId,
      items: processedItems,
      totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
      shipping,
      tracking: {
        trackingNumber,
        estimatedDelivery,
        carrier: 'AgroConnect Express',
        currentLocation: 'Processing Center'
      },
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Order confirmed and payment pending'
        }
      ]
    })

    console.log('Farmer order created successfully:', order._id);

    // Create supplier orders for each unique seller
    const supplierModels = await import('@/lib/models/supplier')
    const Order = supplierModels.Order
    const Product = supplierModels.Product
    const mongooseModule = await import('mongoose')
    const mongoose = mongooseModule.default
    
    // Group items by sellerId
    const itemsBySeller = items.reduce((acc: Record<string, any[]>, item: any) => {
      const sellerId = item.sellerId || item.seller
      if (sellerId) {
        if (!acc[sellerId]) {
          acc[sellerId] = []
        }
        acc[sellerId].push(item)
      }
      return acc
    }, {})

    // Create an order for each supplier
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      try {
        // Get product details for order items
        const orderItems = await Promise.all(
          sellerItems.map(async (item: any) => {
            let product = null
            if (item.productId) {
              try {
                product = await Product.findById(item.productId)
              } catch (e) {
                console.error('Error fetching product:', e)
              }
            }
            return {
              productId: item.productId ? new mongoose.Types.ObjectId(item.productId) : new mongoose.Types.ObjectId(),
              name: item.name || product?.name || 'Product',
              sku: item.sku || product?.sku || 'N/A',
              quantity: item.quantity || 1,
              price: item.price || product?.price || 0,
              total: (item.price || product?.price || 0) * (item.quantity || 1)
            }
          })
        )

        const sellerTotal = orderItems.reduce((sum, item) => sum + item.total, 0)

        // Create supplier order
        const supplierOrderData = {
          orderNumber: `${orderNumber}-${sellerId.slice(-4)}`,
          sellerId: new mongoose.Types.ObjectId(sellerId),
          customer: {
            name: shipping.name,
            phone: shipping.phone,
            address: {
              street: shipping.address,
              city: shipping.city || '',
              state: shipping.state || '',
              pincode: shipping.pincode || '',
              country: 'India'
            }
          },
          items: orderItems,
          totalAmount: sellerTotal,
          paymentStatus: 'pending' as const,
          orderStatus: 'new' as const,
          shippingDetails: {
            trackingNumber: trackingNumber,
            carrier: 'AgroConnect Express',
            estimatedDelivery: estimatedDelivery
          },
          notes: 'Order received from farmer marketplace'
        }
        const supplierOrder = await (Order as any).create(supplierOrderData)

        // Update product stock
        for (const item of sellerItems) {
          if (item.productId) {
            try {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { 
                  stockQuantity: -(item.quantity || 1)
                }
              })
            } catch (e) {
              console.error('Error updating product stock:', e)
            }
          }
        }

        console.log(`Created supplier order ${supplierOrderData.orderNumber} for seller ${sellerId}`)
      } catch (supplierOrderError) {
        console.error(`Error creating supplier order for seller ${sellerId}:`, supplierOrderError)
        // Continue with other suppliers even if one fails
      }
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    console.error('POST /api/farmer/orders error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
