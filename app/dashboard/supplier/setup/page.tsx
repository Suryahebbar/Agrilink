"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface SetupFormData {
  gstNumber: string;
  businessDetails: {
    businessType: string;
    yearsInOperation: string;
    productCategories: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<SetupFormData>({
    gstNumber: '',
    businessDetails: {
      businessType: '',
      yearsInOperation: '',
      productCategories: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });

  const checkSetupStatus = useCallback(async () => {
    try {
      // For development, check localStorage first
      const localProfile = localStorage.getItem('sellerProfile');
      if (localProfile) {
        // Profile already exists in localStorage, redirect to dashboard
        router.push('/dashboard/supplier');
        return;
      }

      const profileResponse = await fetch('/api/supplier', withSupplierAuth());

      const data = await profileResponse.json();
      
      // If setup is not needed (seller exists), redirect to dashboard
      if (!data.needsSetup && data.seller) {
        router.push('/dashboard/supplier');
      }
      // Otherwise, show setup form
    } catch (error) {
      console.error('Error checking setup status:', error);
      // On error, show setup form anyway
    }
  }, [router]);

  useEffect(() => {
    // Check if setup is actually needed
    checkSetupStatus();
  }, [checkSetupStatus]);

  useEffect(() => {
    // For development: Clear any existing profile data to test fresh setup
    if (typeof window !== 'undefined') {
      // Optional: Uncomment this line to always clear profile on setup page load for testing
      // localStorage.removeItem('sellerProfile');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
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

    // Validate required fields
    if (!formData.gstNumber || !formData.address.street || !formData.address.city || 
        !formData.address.state || !formData.address.pincode) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/supplier', withSupplierAuth({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          isFirstTimeSetup: true
        })
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile setup completed successfully!');
        
        // Save setup data to localStorage for development
        localStorage.setItem('sellerProfile', JSON.stringify({
          companyName: 'Demo Agricultural Supplies', // This would come from registration
          email: 'demo@agrilink.com',
          phone: '+91 98765 43210',
          address: formData.address,
          gstNumber: formData.gstNumber,
          businessDetails: formData.businessDetails,
          verificationStatus: 'pending',
          documents: {},
          isActive: true,
          createdAt: new Date().toISOString()
        }));
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/supplier');
        }, 2000);
      } else {
        setError(data.error || 'Failed to setup profile');
      }
    } catch (error) {
      console.error('Error setting up profile:', error);
      setError('Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf1] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-[#1f3b2c] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1f3b2c] mb-2">Welcome to Agrilink</h1>
          <p className="text-[#6b7280]">Let&apos;s set up your supplier profile to get started</p>
        </div>

        {/* Setup Form */}
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div>
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Business Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessDetails.businessType"
                    required
                    value={formData.businessDetails.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                  >
                    <option value="">Select business type</option>
                    <option value="individual">Individual Farmer</option>
                    <option value="partnership">Partnership Firm</option>
                    <option value="proprietary">Proprietary Firm</option>
                    <option value="private-limited">Private Limited Company</option>
                    <option value="public-limited">Public Limited Company</option>
                    <option value="cooperative">Cooperative Society</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="yearsInOperation" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Years in Operation *
                  </label>
                  <select
                    id="yearsInOperation"
                    name="businessDetails.yearsInOperation"
                    required
                    value={formData.businessDetails.yearsInOperation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                  >
                    <option value="">Select years in operation</option>
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">More than 10 years</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="productCategories" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Primary Product Categories *
                  </label>
                  <select
                    id="productCategories"
                    name="businessDetails.productCategories"
                    required
                    value={formData.businessDetails.productCategories}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                  >
                    <option value="">Select primary category</option>
                    <option value="seeds">Seeds & Planting Material</option>
                    <option value="fertilizers">Fertilizers & Nutrients</option>
                    <option value="pesticides">Pesticides & Crop Protection</option>
                    <option value="machinery">Farm Machinery & Equipment</option>
                    <option value="irrigation">Irrigation Systems</option>
                    <option value="animal-feed">Animal Feed & Supplements</option>
                    <option value="organic">Organic Farming Products</option>
                    <option value="multiple">Multiple Categories</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Tax Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    GST Number *
                  </label>
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    required
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                    placeholder="29AAAPL1234C1ZV"
                  />
                  <p className="text-xs text-[#6b7280] mt-1">
                    Enter your 15-digit GST registration number
                  </p>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div>
              <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Business Address</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Street Address *
                  </label>
                  <input
                    id="street"
                    name="address.street"
                    type="text"
                    required
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                    placeholder="123 Farm Road"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      name="address.city"
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                      placeholder="Bangalore"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      State *
                    </label>
                    <input
                      id="state"
                      name="address.state"
                      type="text"
                      required
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                      placeholder="Karnataka"
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Pincode *
                    </label>
                    <input
                      id="pincode"
                      name="address.pincode"
                      type="text"
                      required
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                      placeholder="560001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1f3b2c] text-white py-3 px-4 rounded-md hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:ring-offset-2 font-medium disabled:opacity-50"
              >
                {loading ? 'Setting up your profile...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[#6b7280]">
          <p>This is a one-time setup to configure your supplier profile</p>
        </div>
      </div>
    </div>
  );
}
