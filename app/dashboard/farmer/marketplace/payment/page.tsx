'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ToastContainer, { useToast } from '@/components/Toast'

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet'

type OrderResponse = {
  order?: {
    _id: string
    orderNumber: string
    totalAmount: number
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  }
  error?: string
}

export default function FarmerPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error } = useToast()

  const successRef = useRef(success)
  const errorRef = useRef(error)

  useEffect(() => {
    successRef.current = success
    errorRef.current = error
  }, [success, error])

  const orderId = searchParams.get('orderId')
  const userId = searchParams.get('userId')

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'refunded'>('pending')

  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [form, setForm] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    upiId: '',
    bankCode: '',
    walletType: 'phonepe'
  })

  const canPay = useMemo(() => {
    if (!orderId || !userId) return false
    if (paymentStatus === 'paid') return false

    if (method === 'card') {
      return Boolean(form.cardNumber && form.cardExpiry && form.cardCvv && form.cardName)
    }
    if (method === 'upi') {
      return Boolean(form.upiId && form.upiId.includes('@'))
    }
    if (method === 'netbanking') {
      return Boolean(form.bankCode)
    }
    if (method === 'wallet') {
      return Boolean(form.walletType)
    }
    return false
  }, [orderId, userId, paymentStatus, method, form])

  useEffect(() => {
    if (!orderId || !userId) {
      router.push('/login')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/farmer/orders/${orderId}?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        const raw: unknown = await res.json().catch(() => ({}))
        const data = raw as OrderResponse

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load order')
        }

        setOrderNumber(data.order?.orderNumber || '')
        setAmount(typeof data.order?.totalAmount === 'number' ? data.order.totalAmount : 0)
        setPaymentStatus(data.order?.paymentStatus || 'pending')

        if ((data.order?.paymentStatus || 'pending') === 'paid') {
          successRef.current('This order is already paid.')
        }
      } catch (e) {
        console.error('Payment page load error:', e)
        errorRef.current(e instanceof Error ? e.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [orderId, userId, router])

  const handlePay = async () => {
    if (!orderId || !userId) return

    try {
      setPaying(true)

      await new Promise((r) => setTimeout(r, 1200))

      const payRes = await fetch(`/api/farmer/orders/${orderId}/pay?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethod: method
        })
      })

      const payData = await payRes.json().catch(() => ({}))

      if (!payRes.ok) {
        throw new Error(payData?.error || 'Payment failed')
      }

      setPaymentStatus('paid')

      await fetch(`/api/farmer/cart?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      }).catch(() => null)

      success('Payment successful!')
      router.push(`/dashboard/farmer/marketplace/orders/${orderId}?userId=${encodeURIComponent(userId)}`)
    } catch (e) {
      console.error('Payment error:', e)
      error(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
            <p className="text-sm text-gray-600 mt-1">Complete payment to confirm your order.</p>
          </div>
          <Link
            href={userId ? `/dashboard/farmer/marketplace/orders/${orderId}?userId=${encodeURIComponent(userId)}` : '/dashboard/farmer/marketplace/orders'}
            className="text-sm text-green-700 hover:text-green-800 font-medium"
          >
            View order
          </Link>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Order</p>
              <p className="text-lg font-semibold text-gray-900">{orderNumber || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Amount</p>
              <p className="text-lg font-semibold text-gray-900">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">Payment Status</p>
            <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
              paymentStatus === 'paid'
                ? 'bg-green-100 text-green-800'
                : paymentStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : paymentStatus === 'refunded'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
            }`}>
              {paymentStatus}
            </span>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose payment method</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { id: 'upi' as const, label: 'UPI' },
              { id: 'card' as const, label: 'Card' },
              { id: 'netbanking' as const, label: 'Net Banking' },
              { id: 'wallet' as const, label: 'Wallet' }
            ]).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`p-3 border rounded-lg text-left ${method === m.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="font-medium text-gray-900">{m.label}</div>
                <div className="text-xs text-gray-600">Secure checkout</div>
              </button>
            ))}
          </div>

          {method === 'upi' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">UPI ID</label>
                <input
                  value={form.upiId}
                  onChange={(e) => setForm((p) => ({ ...p, upiId: e.target.value }))}
                  placeholder="yourname@upi"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                You will receive a collect request in your UPI app. Approve it to complete payment.
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Card Number</label>
                <input
                  value={form.cardNumber}
                  onChange={(e) => setForm((p) => ({ ...p, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full border rounded-lg px-3 py-2"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Expiry</label>
                  <input
                    value={form.cardExpiry}
                    onChange={(e) => setForm((p) => ({ ...p, cardExpiry: e.target.value }))}
                    placeholder="MM/YY"
                    className="w-full border rounded-lg px-3 py-2"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">CVV</label>
                  <input
                    value={form.cardCvv}
                    onChange={(e) => setForm((p) => ({ ...p, cardCvv: e.target.value }))}
                    placeholder="123"
                    className="w-full border rounded-lg px-3 py-2"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Cardholder Name</label>
                <input
                  value={form.cardName}
                  onChange={(e) => setForm((p) => ({ ...p, cardName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}

          {method === 'netbanking' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Select Bank</label>
                <select
                  value={form.bankCode}
                  onChange={(e) => setForm((p) => ({ ...p, bankCode: e.target.value }))}
                  aria-label="Select bank"
                  title="Select bank"
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Choose your bank</option>
                  <option value="SBIN">State Bank of India</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICIC">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                You will be redirected to your bank&apos;s secure page to authorize the payment.
              </div>
            </div>
          )}

          {method === 'wallet' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Wallet</label>
                <select
                  value={form.walletType}
                  onChange={(e) => setForm((p) => ({ ...p, walletType: e.target.value }))}
                  aria-label="Select wallet"
                  title="Select wallet"
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="phonepe">PhonePe</option>
                  <option value="paytm">Paytm</option>
                  <option value="amazon">Amazon Pay</option>
                  <option value="mobikwik">MobiKwik</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                You will be redirected to your wallet app to approve the payment.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay || paying}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentStatus === 'paid'
              ? 'Paid'
              : paying
                ? 'Processing Payment...'
                : `Pay ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </button>

          <div className="mt-4 text-center text-xs text-gray-500">
            Your payment information is encrypted and secure.
          </div>
        </div>

        <div className="text-center">
          <Link
            href={userId ? `/dashboard/farmer/marketplace/cart?userId=${encodeURIComponent(userId)}` : '/dashboard/farmer/marketplace/cart'}
            className="text-sm text-gray-700 hover:text-gray-900"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  )
}
