"use client";

import { useState } from 'react';
import { CreditCard, Smartphone, Building, Wallet, Lock, Check } from 'lucide-react';

interface PaymentGatewayProps {
  amount: number;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  billingAddress?: any;
}

export default function PaymentGateway({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError,
  billingAddress 
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    upiId: '',
    bankCode: '',
    walletType: 'phonepe'
  });

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'PhonePe, Google Pay, Paytm'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'All major banks'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      description: 'Paytm, PhonePe, Amazon Pay'
    }
  ];

  const banks = [
    { code: 'SBIN', name: 'State Bank of India' },
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'ICIC', name: 'ICICI Bank' },
    { code: 'KOTK', name: 'Kotak Mahindra Bank' },
    { code: 'AXIS', name: 'Axis Bank' },
    { code: 'PNB', name: 'Punjab National Bank' },
    { code: 'BOI', name: 'Bank of India' },
    { code: 'UBI', name: 'Union Bank of India' }
  ];

  const wallets = [
    { id: 'phonepe', name: 'PhonePe' },
    { id: 'paytm', name: 'Paytm Wallet' },
    { id: 'amazon', name: 'Amazon Pay' },
    { id: 'mobikwik', name: 'MobiKwik' }
  ];

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Validate form data
      if (selectedMethod === 'card') {
        if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv || !formData.cardName) {
          throw new Error('Please fill all card details');
        }
      }

      if (selectedMethod === 'upi') {
        if (!formData.upiId || !formData.upiId.includes('@')) {
          throw new Error('Please enter a valid UPI ID');
        }
      }

      if (selectedMethod === 'netbanking') {
        if (!formData.bankCode) {
          throw new Error('Please select a bank');
        }
      }

      // Create payment request
      const paymentData = {
        orderId: `ORDER${Date.now()}`,
        paymentMethod: selectedMethod,
        paymentDetails: {
          ...formData,
          amount
        },
        billingAddress
      };

      const response = await fetch('/api/marketplace/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok) {
        onPaymentSuccess?.(result.transactionId);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      onPaymentError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={formData.cardCvv}
                  onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.cardName}
                onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'upi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">UPI ID</label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                You will receive a payment request on your UPI app. Approve it to complete the payment.
              </p>
            </div>
          </div>
        );

      case 'netbanking':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Bank</label>
              <select
                value={formData.bankCode}
                onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose your bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                You will be redirected to your bank's secure payment page.
              </p>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Wallet</label>
              <div className="grid grid-cols-2 gap-3">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, walletType: wallet.id })}
                    className={`p-3 border rounded-lg text-left ${
                      formData.walletType === wallet.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{wallet.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                You will be redirected to your wallet app to complete the payment.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Secure Payment</h3>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id as any)}
              className={`w-full flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-500">{method.description}</div>
              </div>
              {selectedMethod === method.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Payment Form */}
      <div className="mb-6">
        {renderPaymentForm()}
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={processing}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </div>
        ) : (
          `Pay ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        )}
      </button>

      {/* Security Info */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Your payment information is encrypted and secure</p>
        <p>By proceeding, you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
}
