'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  seller?: string
}

export default function CartPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Require userId from URL params, redirect to login if not present
  useEffect(() => {
    const urlUserId = searchParams.get('userId')
    if (urlUserId) {
      setUserId(urlUserId)
    } else {
      // No userId in URL, redirect to login
      router.push('/login')
    }
  }, [searchParams, router])

  // Load cart from database
  useEffect(() => {
    if (!userId) return;
    
    const loadCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/farmer/cart?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, [userId]);

  const increment = async (productId: string) => {
    if (!userId) return;
    
    try {
      const updatedItems = items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );

      const response = await fetch('/api/farmer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: updatedItems
        })
      });

      if (response.ok) {
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  }

  const decrement = async (productId: string) => {
    if (!userId) return;
    
    try {
      const updatedItems = items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      );

      const response = await fetch('/api/farmer/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: updatedItems
        })
      });

      if (response.ok) {
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  }

  const removeItem = async (productId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/farmer/cart?userId=${userId}&productId=${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setItems(items.filter(item => item.productId !== productId));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  const clearCart = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/farmer/cart?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
  }, [items])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center bg-white border rounded-lg p-10">
            <p className="text-gray-700 mb-4">Your cart is empty.</p>
            <Link href={`/dashboard/farmer/marketplace/products${userId ? `?userId=${userId}` : ''}`} className="text-green-700 hover:text-green-800 font-medium">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.productId} className="bg-white border rounded-lg p-4 flex gap-4">
                  <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    <Image src={item.image || '/hero-bg.jpg'} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-gray-900 font-medium">{item.name}</h3>
                        {item.seller && <p className="text-sm text-gray-600">{item.seller}</p>}
                        <p className="mt-1 text-gray-900 font-semibold">₹{(Number(item.price) || 0).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border rounded-lg">
                        <button onClick={() => decrement(item.productId)} className="px-3 py-1 text-gray-700 hover:bg-gray-100">-</button>
                        <span className="px-4 py-1 text-gray-900">{item.quantity}</span>
                        <button onClick={() => increment(item.productId)} className="px-3 py-1 text-gray-700 hover:bg-gray-100">+</button>
                      </div>
                      <div className="text-sm text-gray-700">
                        Line total: <span className="font-semibold text-gray-900">₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Shipping and taxes calculated at checkout.</p>
                <button
                  onClick={() => {
                    router.push(`/dashboard/farmer/marketplace/checkout${userId ? `?userId=${userId}` : ''}`)
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="mt-3 w-full text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
              <div className="mt-4 text-center">
                <Link href={`/dashboard/farmer/marketplace/products${userId ? `?userId=${userId}` : ''}`} className="text-green-700 hover:text-green-800 text-sm font-medium">
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
