import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import '@/lib/models' // Ensure all models are registered
import { Cart } from '@/lib/models/Cart'
import mongoose from 'mongoose'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    const db = mongoose.connection.db
    const cartCollection = db.collection('carts')

    const cart = await cartCollection.findOne({ userId })

    if (!cart) {
      return NextResponse.json({ items: [], totalAmount: 0 })
    }

    return NextResponse.json({ 
      items: cart.items || [],
      totalAmount: cart.totalAmount || 0
    })
  } catch (err) {
    console.error('GET /api/farmer/cart error:', err)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, productId, name, price, quantity, image, sellerId, sellerName } = body

    if (!userId || !productId || !name || !price || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    const db = mongoose.connection.db
    const cartCollection = db.collection('carts')

    // Find existing cart for user
    const existingCart = await cartCollection.findOne({ userId })

    if (!existingCart) {
      // Create new cart
      const newCart = {
        userId,
        user: new mongoose.Types.ObjectId(userId),
        items: [{
          productId,
          name,
          price,
          quantity,
          image,
          sellerId,
          sellerName,
          addedAt: new Date()
        }],
        totalAmount: price * quantity,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await cartCollection.insertOne(newCart)

      return NextResponse.json({ 
        message: 'Item added to cart',
        cart: {
          items: newCart.items,
          totalAmount: newCart.totalAmount
        }
      })
    }

    // Update existing cart
    const existingItemIndex = existingCart.items.findIndex((item: any) => 
      String(item.productId) === String(productId)
    )

    let updatedItems
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      updatedItems = existingCart.items.map((item: any, index: number) => {
        if (index === existingItemIndex) {
          return {
            ...item,
            quantity: item.quantity + quantity
          }
        }
        return item
      })
    } else {
      // Add new item
      updatedItems = [...existingCart.items, {
        productId,
        name,
        price,
        quantity,
        image,
        sellerId,
        sellerName,
        addedAt: new Date()
      }]
    }

    const totalAmount = updatedItems.reduce((total: number, item: any) => {
      return total + (item.price * item.quantity)
    }, 0)

    await cartCollection.updateOne(
      { userId },
      { 
        $set: { 
          items: updatedItems, 
          totalAmount,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ 
      message: 'Item added to cart',
      cart: {
        items: updatedItems,
        totalAmount
      }
    })
  } catch (err) {
    console.error('POST /api/farmer/cart error:', err)
    return NextResponse.json({ 
      error: 'Failed to add item to cart',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { userId, items } = body

    if (!userId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'userId and items are required' }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    const db = mongoose.connection.db
    const cartCollection = db.collection('carts')

    const totalAmount = items.reduce((total: number, item: any) => {
      return total + (item.price * item.quantity)
    }, 0)

    await cartCollection.updateOne(
      { userId },
      { 
        $set: { 
          items,
          totalAmount,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ 
      message: 'Cart updated',
      cart: {
        items,
        totalAmount
      }
    })
  } catch (err) {
    console.error('PUT /api/farmer/cart error:', err)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    const db = mongoose.connection.db
    const cartCollection = db.collection('carts')

    if (productId) {
      // Remove specific item
      const cart = await cartCollection.findOne({ userId })
      
      if (!cart) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
      }

      const updatedItems = cart.items.filter((item: any) => 
        String(item.productId) !== String(productId)
      )

      const totalAmount = updatedItems.reduce((total: number, item: any) => {
        return total + (item.price * item.quantity)
      }, 0)

      await cartCollection.updateOne(
        { userId },
        { 
          $set: { 
            items: updatedItems, 
            totalAmount,
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({ 
        message: 'Item removed from cart',
        cart: {
          items: updatedItems,
          totalAmount
        }
      })
    } else {
      // Clear entire cart
      await cartCollection.deleteOne({ userId })

      return NextResponse.json({ message: 'Cart cleared' })
    }
  } catch (err) {
    console.error('DELETE /api/farmer/cart error:', err)
    return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 })
  }
}
