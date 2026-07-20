"use client";

import { useState } from 'react';
import Link from 'next/link';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import Footer from '../../components/Footer/Footer';

export default function RegisterFarmerPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      const res = await fetch('/api/auth/register-farmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        setUserId(data.userId);
        setMessage('OTP sent to your email and phone. (In dev, check server logs / response.)');
        setOtpStage(true);
        // For dev convenience you can log OTP here as well
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
    if (!userId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'OTP verification failed');
      } else {
        setMessage('Account verified successfully. You can now log in.');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f0de]">
      <HeaderWrapper />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-[#fffaf1] border border-[#e2d4b7] rounded-lg shadow-md px-8 py-10">
          <h1 className="text-2xl font-semibold text-center text-[#1f3b2c] mb-2">Create Farmer Account</h1>
          <p className="text-xs text-center text-[#6b7280] mb-8">
            Enter your details to join the AgriLink community.
          </p>

          {!otpStage ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fdf6e9] px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fdf6e9] px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fdf6e9] px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fdf6e9] px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  required
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              {message && <p className="text-xs text-green-700">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-md bg-[#166534] py-2 text-sm font-medium text-white hover:bg-[#14532d] disabled:opacity-60"
              >
                {loading ? 'Registering...' : 'Register as Farmer'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-[#374151]">
                Enter the OTP sent to your email and phone number to verify your account.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded border border-[#e5e7eb] bg-[#fdf6e9] px-3 py-2 text-sm text-black focus:outline-none focus:ring-1 focus:ring-[#166534]"
                  required
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
              {message && <p className="text-xs text-green-700">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-md bg-[#166534] py-2 text-sm font-medium text-white hover:bg-[#14532d] disabled:opacity-60"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-[#6b7280]">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-[#166534]">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
