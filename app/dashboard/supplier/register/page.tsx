"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SupplierRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please check your console for OTP.');
        setShowOtpVerification(true);
        console.log('🎉 Registration successful!');
        console.log('📧 Your OTP is:', data.otp);
        console.log('📋 Registration response:', data);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/supplier', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account verified successfully! You can now login.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/supplier/login', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('OTP resent successfully! Check your console.');
        console.log('📧 New OTP sent:', data.otp);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-[#1f3b2c]">
          Supplier Registration
        </h2>
        <p className="mt-2 text-center text-sm text-[#6b7280]">
          Create your supplier account to start selling
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#e2d4b7]">
          
          {!showOtpVerification ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#1f3b2c]">Company Information</h3>
                
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-[#6b7280]">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#6b7280]">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#6b7280]">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-[#6b7280]">
                    GST Number (Optional)
                  </label>
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#1f3b2c]">Address Information</h3>
                
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-[#6b7280]">
                    Street Address *
                  </label>
                  <input
                    id="street"
                    name="address.street"
                    type="text"
                    required
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[#6b7280]">
                      City *
                    </label>
                    <input
                      id="city"
                      name="address.city"
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-[#6b7280]">
                      State *
                    </label>
                    <input
                      id="state"
                      name="address.state"
                      type="text"
                      required
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-[#6b7280]">
                      Pincode *
                    </label>
                    <input
                      id="pincode"
                      name="address.pincode"
                      type="text"
                      required
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Password Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#1f3b2c]">Password Setup</h3>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#6b7280]">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#6b7280]">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1f3b2c] hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f3b2c] disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Account'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/login" className="text-sm text-[#1f3b2c] hover:underline">
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          ) : (
            // OTP Verification Form
            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-[#1f3b2c]">Verify Your Email</h3>
                <p className="mt-2 text-sm text-[#6b7280]">
                  We've sent an OTP to {formData.email}. Check your console for the OTP.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-[#6b7280]">
                  Enter OTP *
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 block w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1f3b2c] hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f3b2c] disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Account'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-[#1f3b2c] hover:underline disabled:opacity-50"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
