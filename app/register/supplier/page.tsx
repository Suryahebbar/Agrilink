"use client";

import { useState } from 'react';
import Link from 'next/link';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import Footer from '../../components/Footer/Footer';

export default function RegisterSupplierPage() {
  const [companyName, setCompanyName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpStage, setOtpStage] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/register-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, businessEmail, upiId, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        setUserId(data.userId);
        setMessage('OTP sent to your email. (In dev, check server logs / response.)');
        setOtpStage(true);
        console.log('Dev OTP:', { otp: data.otp });
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: businessEmail, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'OTP verification failed');
      } else {
        setMessage('Account verified! You can now login.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderWrapper />
      
      <main className="flex-grow bg-[#fffaf1]">
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#e2d4b7] rounded-lg shadow-sm p-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1f3b2c] mb-2">
                Supplier Registration
              </h1>
              <p className="text-[#6b7280]">
                Join our marketplace and start selling agricultural products
              </p>
            </div>

            {!otpStage ? (
              // Registration Form
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Error and Success Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{message}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-[#1f3b2c] placeholder-[#6b7280]"
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Business Email *
                    </label>
                    <input
                      id="businessEmail"
                      type="email"
                      required
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-[#1f3b2c] placeholder-[#6b7280]"
                      placeholder="business@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="upiId" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      UPI ID *
                    </label>
                    <input
                      id="upiId"
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-[#1f3b2c] placeholder-[#6b7280]"
                      placeholder="yourupi@upiapp"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-[#1f3b2c] placeholder-[#6b7280]"
                      placeholder="Create a strong password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1f3b2c] text-white py-3 px-4 rounded-md hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Registering...' : 'Register Account'}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-[#e2d4b7]">
                  <p className="text-[#6b7280] text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#1f3b2c] hover:underline font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              // OTP Verification Form
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* Verification Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#1f3b2c] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1f3b2c] mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-[#6b7280]">
                    We've sent a 6-digit OTP to {businessEmail}
                  </p>
                  <p className="text-[#6b7280] text-sm mt-1">
                    Check your console for the OTP in development mode
                  </p>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">{message}</p>
                  </div>
                )}

                {/* OTP Input */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Enter OTP *
                  </label>
                  <input
                    id="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-[#1f3b2c] placeholder-[#6b7280] text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {/* Verify Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1f3b2c] text-white py-3 px-4 rounded-md hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Verifying...' : 'Verify Account'}
                  </button>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-[#1f3b2c] hover:underline text-sm font-medium"
                  >
                    Didn't receive OTP? Register again
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
