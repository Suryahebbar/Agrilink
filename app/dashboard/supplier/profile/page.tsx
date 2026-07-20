"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface SellerProfile {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstNumber?: string;
  businessDetails?: {
    businessType: string;
    yearsInOperation: string;
    productCategories: string;
  };
  avatarUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: {
    businessCertificate?: string;
    tradeLicense?: string;
    ownerIdProof?: string;
    gstCertificate?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<{
    documentsUploaded: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    rejectionReason?: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstNumber: '',
    businessDetails: {
      businessType: '',
      yearsInOperation: '',
      productCategories: ''
    }
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Try both supplier and seller keys
          currentSupplierId = profileData.supplier?._id || profileData.seller?._id || '';
          if (!currentSupplierId) {
            console.error('No supplier ID found in profile:', profileData);
            throw new Error('Supplier ID not found in profile');
          }
          setSupplierId(currentSupplierId);
        } else {
          const errorData = await profileResponse.json().catch(() => ({}));
          console.error('Failed to get supplier profile:', errorData);
          throw new Error(errorData.error || 'Failed to get supplier profile');
        }
      }
      
      const response = await fetch(`/api/supplier/${currentSupplierId}/profile`, withSupplierAuth());

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to load profile');
      }

      const data = await response.json();

      // Handle both seller and supplier keys
      const sellerData = data.seller || data.supplier;
      
      if (!sellerData) {
        throw new Error('Profile data not found in response');
      }

      setProfile(sellerData);
      setFormData({
        companyName: sellerData.companyName || '',
        email: sellerData.email || '',
        phone: sellerData.phone || '',
        address: sellerData.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        gstNumber: sellerData.gstNumber || '',
        businessDetails: sellerData.businessDetails || {
          businessType: '',
          yearsInOperation: '',
          productCategories: ''
        }
      });

      // Fetch verification status from new API
      try {
        const verificationResponse = await fetch('/api/supplier/documents', withSupplierAuth());
        if (verificationResponse.ok) {
          const verificationData = await verificationResponse.json();
          setVerificationStatus(verificationData.verificationStatus);
        }
      } catch (verifError) {
        console.warn('Failed to fetch verification status:', verifError);
        // Fallback to profile data for legacy suppliers
        if (sellerData) {
          setVerificationStatus({
            documentsUploaded: true, // Legacy suppliers assumed to have documents
            verificationStatus: sellerData.verificationStatus || 'pending'
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      let response: Response;
      const currentSupplierId = supplierId || 'temp';

      if (avatarFile) {
        const payload = new FormData();
        payload.append('companyName', formData.companyName);
        payload.append('phone', formData.phone);
        payload.append('gstNumber', formData.gstNumber);
        payload.append('address', JSON.stringify(formData.address));
        payload.append('businessDetails', JSON.stringify(formData.businessDetails));
        payload.append('avatar', avatarFile);

        response = await fetch(`/api/supplier/${currentSupplierId}/profile`, withSupplierAuth({
          method: 'PATCH',
          body: payload
        }));
      } else {
        response = await fetch(`/api/supplier/${currentSupplierId}/profile`, withSupplierAuth({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }));
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setEditing(false);
      setAvatarFile(null);
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Profile Settings</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage your business information and account settings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/supplier/profile/verification"
            className="btn-secondary btn-md"
          >
            Verification Documents
          </Link>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary btn-md"
            >
              Edit Profile
            </button>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1f3b2c]">Business Information</h2>
              {verificationStatus ? (
                <span className={`badge ${
                  !verificationStatus.documentsUploaded
                    ? 'badge-error'
                    : verificationStatus.verificationStatus === 'verified' 
                    ? 'badge-success'
                    : verificationStatus.verificationStatus === 'pending'
                    ? 'badge-warning'
                    : 'badge-error'
                }`}>
                  {!verificationStatus.documentsUploaded
                    ? 'Not Verified'
                    : verificationStatus.verificationStatus === 'verified' 
                    ? 'Verified'
                    : verificationStatus.verificationStatus === 'pending'
                    ? 'Pending Verification'
                    : 'Not Verified'
                  }
                </span>
              ) : (
                <span className={`badge ${getVerificationStatusColor(profile?.verificationStatus || '')}`}>
                  {profile?.verificationStatus === 'verified' ? 'Verified' : profile?.verificationStatus === 'pending' ? 'Pending Verification' : 'Not Verified'}
                </span>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Business Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                      GST Number
                    </label>
                    <input
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Business Details
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="businessType" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Business Type
                      </label>
                      <select
                        id="businessType"
                        name="businessDetails.businessType"
                        value={formData.businessDetails.businessType}
                        onChange={handleInputChange}
                        className="select-field"
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
                      <label htmlFor="yearsInOperation" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Years in Operation
                      </label>
                      <select
                        id="yearsInOperation"
                        name="businessDetails.yearsInOperation"
                        value={formData.businessDetails.yearsInOperation}
                        onChange={handleInputChange}
                        className="select-field"
                      >
                        <option value="">Select years</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">More than 10 years</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="productCategories" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Primary Product Categories
                      </label>
                      <select
                        id="productCategories"
                        name="businessDetails.productCategories"
                        value={formData.businessDetails.productCategories}
                        onChange={handleInputChange}
                        className="select-field"
                      >
                        <option value="">Select category</option>
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

                <div>
                  <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                    Business Address *
                  </label>
                  <div className="space-y-4">
                    <input
                      name="address.street"
                      type="text"
                      required
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                      className="input-field"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        name="address.city"
                        type="text"
                        required
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="input-field"
                      />
                      <input
                        name="address.state"
                        type="text"
                        required
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="input-field"
                      />
                      <input
                        name="address.pincode"
                        type="text"
                        required
                        value={formData.address.pincode}
                        onChange={handleInputChange}
                        placeholder="Pincode"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      loadProfile(); // Reset form
                    }}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-[#6b7280]">Company Name</p>
                    <p className="text-[#1f3b2c]">{profile.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#6b7280]">Business Email</p>
                    <p className="text-[#1f3b2c]">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#6b7280]">Phone Number</p>
                    <p className="text-[#1f3b2c]">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#6b7280]">GST Number</p>
                    <p className="text-[#1f3b2c]">{profile.gstNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#6b7280] mb-2">Business Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#6b7280]">Business Type</p>
                      <p className="text-[#1f3b2c]">{profile.businessDetails?.businessType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">Years in Operation</p>
                      <p className="text-[#1f3b2c]">{profile.businessDetails?.yearsInOperation || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">Product Categories</p>
                      <p className="text-[#1f3b2c]">{profile.businessDetails?.productCategories || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#6b7280] mb-2">Business Address</p>
                  <p className="text-[#1f3b2c]">
                    {profile.address.street}<br />
                    {profile.address.city}, {profile.address.state} {profile.address.pincode}<br />
                    {profile.address.country}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Verification</span>
                  {verificationStatus ? (
                    <span className={`badge ${
                      !verificationStatus.documentsUploaded
                        ? 'badge-error'
                        : verificationStatus.verificationStatus === 'verified' 
                        ? 'badge-success'
                        : verificationStatus.verificationStatus === 'pending'
                        ? 'badge-warning'
                        : 'badge-error'
                    }`}>
                      {!verificationStatus.documentsUploaded
                        ? 'Not Verified'
                        : verificationStatus.verificationStatus === 'verified' 
                        ? 'Verified'
                        : verificationStatus.verificationStatus === 'pending'
                        ? 'Pending'
                        : 'Rejected'
                      }
                    </span>
                  ) : (
                    <span className={`badge ${getVerificationStatusColor(profile?.verificationStatus || '')}`}>
                      {profile?.verificationStatus || 'Unknown'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Account Status</span>
                  <span className={`badge ${profile?.isActive ? 'badge-success' : 'badge-error'}`}>
                    {profile?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Member Since</span>
                  <span className="text-sm text-[#1f3b2c]">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/supplier/profile/verification"
                  className="block w-full text-center px-4 py-2 border border-[#e2d4b7] rounded-md text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
                >
                  Upload Documents
                </Link>
                <Link
                  href="/dashboard/supplier/settings"
                  className="block w-full text-center px-4 py-2 border border-[#e2d4b7] rounded-md text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
                >
                  Account Settings
                </Link>
                <button className="block w-full text-center btn-destructive btn-md">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
