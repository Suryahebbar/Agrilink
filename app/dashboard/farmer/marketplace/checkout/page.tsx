'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/Toast'
import ToastContainer from '@/components/Toast'

type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  seller?: string
  sellerId?: string
  sellerName?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error } = useToast()
  const initialUserId = searchParams.get('userId')
  const [uid, setUid] = useState<string | null>(initialUserId)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [farmer, setFarmer] = useState<{ name?: string; phone?: string; address?: string; email?: string } | null>(null)
  const [useSavedAddress, setUseSavedAddress] = useState(true)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  useEffect(() => {
    // Require userId from URL params, redirect to login if not present
    const urlUserId = searchParams.get('userId')
    if (urlUserId) {
      setUid(urlUserId)
    } else {
      // No userId in URL, redirect to login
      router.push('/login')
    }
  }, [searchParams, router])

  // Load cart from database
  useEffect(() => {
    if (!uid) return;
    
    const loadCart = async () => {
      try {
        const response = await fetch(`/api/farmer/cart?userId=${uid}`);
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
  }, [uid]);

  // Load farmer profile to prefill shipping details when userId is present
  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      try {
        setProfileLoading(true)
        setProfileError(null)
        const res = await fetch(`/api/farmer/profile?userId=${uid}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to load profile')
        const prof = {
          name: data?.profile?.name,
          phone: data?.profile?.phone,
          address: data?.profile?.address,
          email: data?.profile?.email,
        }
        setFarmer(prof)
        setForm(prev => ({
          ...prev,
          name: prof.name || prev.name,
          phone: prof.phone || prev.phone,
          address: prof.address || prev.address,
        }))
      } catch (e: unknown) {
        console.error('Profile load error:', e)
        const message = e instanceof Error ? e.message : 'Failed to load profile'
        setProfileError(message)
        setFarmer(null)
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [uid])

  const subtotal = useMemo(() => items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0), [items])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const placeOrderNow = async (effective: { name: string; phone: string; address: string; city?: string; state?: string; pincode?: string }) => {
    try {
      setPlacing(true)
      // Build order payload
      const payload = {
        userId: uid,
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          price: Number(i.price) || 0,
          quantity: Number(i.quantity) || 0,
          image: i.image,
          sellerId: i.sellerId || i.seller, // Include sellerId for linking to supplier orders
          sellerName: i.sellerName || i.seller,
        })),
        shipping: effective,
        totalAmount: subtotal,
      }

      // Create order via API
      const res = await fetch('/api/farmer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to create order')
      }

      const created = await res.json().catch(() => null)
      const createdOrderId = created?.order?._id as string | undefined
      if (!createdOrderId) {
        throw new Error('Order created but orderId is missing')
      }

      success('Order created. Proceed to payment.')
      router.push(`/dashboard/farmer/marketplace/payment?orderId=${encodeURIComponent(createdOrderId)}&userId=${encodeURIComponent(uid || '')}`)
    } catch (err) {
      console.error('Place order error:', err)
      error('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const placeOrderSaved = async () => {
    if (!farmer?.address) {
      error('No saved address found')
      return
    }
    const effective = {
      name: farmer?.name || form.name || 'User',
      phone: farmer?.phone || form.phone || '0000000000',
      address: farmer.address,
      city: form.city || '',
      state: form.state || '',
      pincode: form.pincode || '',
    }
    await placeOrderNow(effective)
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      error('Your cart is empty')
      router.push('/dashboard/farmer/marketplace/products')
      return
    }
    const effective = useSavedAddress && farmer?.address ? {
      name: farmer?.name || form.name || 'User',
      phone: farmer?.phone || form.phone || '0000000000',
      address: farmer.address,
      city: form.city || '',
      state: form.state || '',
      pincode: form.pincode || '',
    } : {
      ...form,
      name: form.name || 'User',
      phone: form.phone || '0000000000',
    }

    if (!effective.name || !effective.phone || !effective.address) {
      if (farmer?.address) {
        await placeOrderSaved()
        return
      }
      error('Please fill all shipping details')
      return
    }

    await placeOrderNow(effective)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Preparing checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center bg-white border rounded-lg p-10">
            <p className="text-gray-700 mb-4">Your cart is empty.</p>
            <Link href={uid ? `/dashboard/farmer/marketplace/products?userId=${uid}` : '/dashboard/farmer/marketplace/products'} className="text-green-700 hover:text-green-800 font-medium">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping form */}
            <form onSubmit={placeOrder} className="bg-white border rounded-lg p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Shipping Details</h2>
                {profileLoading && <span className="text-sm text-gray-600">Loading profile...</span>}
              </div>

              {farmer && (
                <div className="rounded-lg border p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">{farmer.name || 'Farmer'}</p>
                      {farmer.email && <p className="text-sm text-gray-600">{farmer.email}</p>}
                      {farmer.phone && <p className="text-sm text-gray-600">{farmer.phone}</p>}
                      {farmer.address && <p className="text-sm text-gray-700 mt-1">{farmer.address}</p>}
                    </div>
                    <div className="flex items-center space-x-3">
                      {farmer.address && (
                        <label className="inline-flex items-center text-sm text-gray-900">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={useSavedAddress}
                            onChange={(e) => setUseSavedAddress(e.target.checked)}
                          />
                          Use saved address
                        </label>
                      )}
                      {farmer.address && (
                        <button type="button" onClick={placeOrderSaved} disabled={placing} className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:bg-gray-400">
                          {placing ? 'Processing...' : 'Ship to this address'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {profileError && (
                <div className="text-sm text-red-700">{profileError}</div>
              )}

              {/* Show the editable form only when not using saved address or when no saved address exists */}
              {!profileLoading && !(useSavedAddress && !!farmer?.address) && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">Full Name</label>
                      <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">Phone</label>
                      <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="98765 43210" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-900 mb-1">Address</label>
                      <textarea name="address" value={form.address} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="Street, Area"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">City</label>
                      <input name="city" value={form.city} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="Mysuru" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">State</label>
                      <input name="state" value={form.state} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="Karnataka" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-900 mb-1">Pincode</label>
                      <input name="pincode" value={form.pincode} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500" placeholder="570001" />
                    </div>
                  </div>
                  <button disabled={placing} className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400">
                    {placing ? 'Placing Order...' : 'Place Order'}
                  </button>
                </>
              )}
            </form>

            {/* Summary */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-auto pr-1">
                {items.map(i => (
                  <div key={i.productId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{i.name} × {i.quantity}</span>
                    <span className="text-gray-900 font-medium">₹{((Number(i.price) || 0) * (Number(i.quantity) || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="text-gray-900 font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Shipping and taxes will be added if applicable.</p>
              <div className="mt-4 text-center">
                <Link href={uid ? `/dashboard/farmer/marketplace/cart?userId=${uid}` : '/dashboard/farmer/marketplace/cart'} className="text-green-700 hover:text-green-800 text-sm font-medium">Back to Cart</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
