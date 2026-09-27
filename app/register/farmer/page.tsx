"use client";

import { useState } from 'react';
import Link from 'next/link';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import Footer from '../../components/Footer/Footer';
import { ShieldCheck, Info, FileText, CheckCircle } from 'lucide-react';

export default function RegisterFarmerPage() {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpStage, setOtpStage] = useState(false);
  const [passwordStage, setPasswordStage] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedCredentials, setVerifiedCredentials] = useState<any | null>(null);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Extract only digits
    const clean = val.replace(/\D/g, '');
    let formatted = clean;

    if (clean.length > 2) {
      formatted = clean.substring(0, 2) + '/' + clean.substring(2);
    }
    if (clean.length > 4) {
      formatted = clean.substring(0, 2) + '/' + clean.substring(2, 4) + '/' + clean.substring(4, 8);
    }

    setDob(formatted);
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions to proceed.');
      return;
    }

    // Validate DOB format dd/mm/yyyy
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dobRegex.test(dob)) {
      setError('Please enter Date of Birth in DD/MM/YYYY format.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/register-farmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, dob, aadharNumber, phone, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        setUserId(data.userId);
        
        if (data.otpWarning) {
          setError(`Notice: ${data.otpWarning}`);
          setMessage(`OTP sent to ${email} (with notice).`);
        } else {
          setMessage(`6-digit verification code sent to your email: ${email}`);
        }

        setOtpStage(true);
        console.log('Dev OTP:', { otp: data.otp });
        if (data.otp) {
          setMessage(prev => `${prev || ''} [Dev OTP: ${data.otp}]`);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
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
        setMessage('Email Verification Successful! Please set your account password.');
        setPasswordStage(true);
      }
    } catch (err) {
      setError('Something went wrong during verification.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to set password');
      } else {
        setMessage('Registration Complete!');
        setVerifiedCredentials({
          username: email || phone,
          password: 'As configured by you'
        });
        setPasswordStage(false);
      }
    } catch (err) {
      setError('Something went wrong while setting password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f7f0de] to-[#fffaf1]">
      <HeaderWrapper />
      <main className="flex-grow flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg bg-white/80 backdrop-blur-md border border-[#e2d4b7] rounded-2xl shadow-xl p-8 md:p-10 transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#166534]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-[#166534]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1f3b2c]">Farmer Registration</h1>
            <p className="text-xs text-[#6b7280] mt-1">
              Create your account with secure Email Verification
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2 animate-shake">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && !verifiedCredentials && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {verifiedCredentials ? (
            /* Success Display */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-[#166534]/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <CheckCircle className="w-10 h-10 text-[#166534]" />
              </div>
              <h2 className="text-xl font-bold text-[#1f3b2c]">Registration Complete</h2>
              <div className="bg-[#fcf8ee] border border-[#e2d4b7] rounded-xl p-6 text-left space-y-4">
                <p className="text-xs text-[#4b5563]">
                  Your identity has been verified and your account password has been set successfully.
                </p>
                <div className="space-y-2 text-sm text-[#1f3b2c]">
                  <div>
                    <span className="text-xs text-[#6b7280] block">Username (Mobile Number)</span>
                    <strong className="font-mono">{verifiedCredentials.username}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-[#6b7280] block">Password</span>
                    <strong className="font-mono">{verifiedCredentials.password}</strong>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#166534] py-3 text-sm font-semibold text-white hover:bg-[#14532d] shadow-md transition-all active:scale-[0.98]"
              >
                Go to Login
              </Link>
            </div>
          ) : passwordStage ? (
            /* Password Setup Form */
            <form onSubmit={handleSetPassword} className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-[#fcf8ee] border border-[#e2d4b7] rounded-xl text-xs text-[#4b5563] space-y-1">
                <p>Your Aadhaar identity has been verified. Now set a secure password for your AgriLink account.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#166534] py-3 text-sm font-semibold text-white hover:bg-[#14532d] shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? 'Setting Password...' : 'Set Password & Complete'}
              </button>
            </form>
          ) : !otpStage ? (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Full Name (As per Aadhaar)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Date of Birth (DD/MM/YYYY)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={dob}
                  onChange={handleDobChange}
                  placeholder="DD/MM/YYYY"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Aadhaar Number</label>
                <input
                  type="text"
                  maxLength={12}
                  pattern="\d{12}"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="12-digit Aadhaar number"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all font-mono tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    pattern="\d{10}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-lg border border-[#e2d4b7] bg-white pl-12 pr-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Email Address (For Verification & Notifications)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                  required
                />
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-[#e2d4b7] text-[#166534] focus:ring-[#166534] mt-0.5 cursor-pointer"
                  required
                />
                <label htmlFor="agree-terms" className="text-xs text-[#4b5563] leading-normal cursor-pointer select-none">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#166534] font-semibold underline hover:text-[#14532d] inline-flex items-center gap-0.5">
                    Terms & Conditions
                    <FileText className="w-3 h-3 inline" />
                  </Link>{' '}
                  and consent to account registration.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[#166534] py-3 text-sm font-semibold text-white hover:bg-[#14532d] shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? 'Sending Verification OTP...' : 'Send Email OTP & Continue'}
              </button>
            </form>
          ) : (
            /* OTP Verification Stage */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-[#fcf8ee] border border-[#e2d4b7] rounded-xl text-xs text-[#4b5563] space-y-1">
                <p>We've sent a 6-digit OTP code to your registered email: <strong>{email}</strong>.</p>
                <p className="text-[11px] text-gray-500">Please check your inbox or spam folder and enter the code below.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Verification Code (Email OTP)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center rounded-lg border border-[#e2d4b7] bg-white px-3.5 py-2.5 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all font-mono tracking-widest"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#166534] py-3 text-sm font-semibold text-white hover:bg-[#14532d] shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Complete Setup'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setOtpStage(false)}
                  className="text-xs text-gray-500 hover:text-[#166534] underline font-medium"
                >
                  Edit Registration Details
                </button>
              </div>
            </form>
          )}

          {/* Footer Link */}
          {!verifiedCredentials && (
            <p className="mt-8 text-center text-xs text-[#6b7280]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#166534] hover:underline">
                Log in here
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
