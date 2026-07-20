"use client";

import { useEffect, useState } from 'react';
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

export default function VerificationPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<{
    documentsUploaded: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
    rejectionReason?: string;
  } | null>(null);
  
  const [documents, setDocuments] = useState({
    businessCertificate: null as File | null,
    tradeLicense: null as File | null,
    ownerIdProof: null as File | null,
    gstCertificate: null as File | null
  });

  const documentTypes = [
    {
      key: 'businessCertificate',
      label: 'Business Registration Certificate',
      description: 'Certificate of Incorporation or Partnership Deed',
      required: true
    },
    {
      key: 'tradeLicense',
      label: 'Trade License',
      description: 'Current trade license from local authorities',
      required: true
    },
    {
      key: 'ownerIdProof',
      label: 'Owner ID Proof',
      description: 'Aadhar Card, PAN Card, or Passport',
      required: true
    },
    {
      key: 'gstCertificate',
      label: 'GST Certificate',
      description: 'GST Registration Certificate (if applicable)',
      required: false
    }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // First, get supplier ID
      const profileResponse = await fetch('/api/supplier', withSupplierAuth());
      if (!profileResponse.ok) {
        throw new Error('Failed to load supplier profile');
      }
      
      const profileData = await profileResponse.json();
      const currentSupplierId = profileData.supplier?._id || profileData.seller?._id;
      
      if (!currentSupplierId) {
        throw new Error('Supplier ID not found in profile');
      }

      // Now fetch the full profile with ID
      const response = await fetch(
        `/api/supplier/${currentSupplierId}/profile`, 
        withSupplierAuth()
      );

      if (!response.ok) {
        throw new Error('Failed to load profile details');
      }

      const data = await response.json();
      setProfile(data.seller || data.supplier);

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
        if (data.seller || data.supplier) {
          setVerificationStatus({
            documentsUploaded: true, // Legacy suppliers assumed to have documents
            verificationStatus: (data.seller || data.supplier).verificationStatus || 'pending'
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (docType: string, file: File) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: file
    }));
  };

  const handleUpload = async () => {
    if (!profile?._id) {
      setError('Supplier profile not loaded. Please refresh the page and try again.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add all documents to form data
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      // Upload documents using the new API
      const uploadResponse = await fetch(`/api/supplier/${profile._id}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload documents');
      }

      const uploadData = await uploadResponse.json();

      // Mark documents as uploaded for verification
      const markUploadedResponse = await fetch('/api/supplier/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: uploadData.uploadedDocumentIds || [] // This should come from the upload response
        }),
        credentials: 'include'
      });

      if (markUploadedResponse.ok) {
        const markUploadedData = await markUploadedResponse.json();
        setVerificationStatus({
          documentsUploaded: true,
          verificationStatus: 'pending'
        });
        setSuccess('Documents uploaded successfully! Your verification is now under review.');
      } else {
        // Even if marking fails, documents were uploaded
        setSuccess('Documents uploaded! Please contact support to complete verification.');
      }

      // Refresh profile to show updated documents
      await loadProfile();
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      setError(error.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentStatus = (docType: keyof SellerProfile['documents']) => {
    if (!profile?.documents) return 'not_uploaded';
    return profile.documents[docType] ? 'uploaded' : 'not_uploaded';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'text-green-600';
      case 'not_uploaded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading verification status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1f3b2c]">Account Verification</h1>
        <p className="text-sm text-[#6b7280] mt-1">Upload required documents to verify your business account</p>
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1f3b2c]">Verification Status</h2>
              <p className="text-sm text-[#6b7280] mt-1">
                {!verificationStatus.documentsUploaded 
                  ? 'Not Verified'
                  : verificationStatus.verificationStatus === 'verified' 
                  ? 'Your account is verified and active'
                  : verificationStatus.verificationStatus === 'pending'
                  ? 'Your documents are under review'
                  : 'Verification was rejected. Please re-upload documents.'
                }
              </p>
              {verificationStatus.rejectionReason && (
                <p className="text-sm text-red-600 mt-1">
                  Reason: {verificationStatus.rejectionReason}
                </p>
              )}
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              !verificationStatus.documentsUploaded
                ? 'bg-red-100 text-red-800'
                : verificationStatus.verificationStatus === 'verified' 
                ? 'bg-green-100 text-green-800'
                : verificationStatus.verificationStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {!verificationStatus.documentsUploaded
                ? 'Not Verified'
                : verificationStatus.verificationStatus === 'verified' 
                ? 'Verified'
                : verificationStatus.verificationStatus === 'pending'
                ? 'Under Review'
                : 'Rejected'
              }
            </div>
          </div>
        </div>
      )}

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

      {/* Document Upload */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Required Documents</h2>
        
        <div className="space-y-6">
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.key as keyof SellerProfile['documents']);
            const hasFile = documents[docType.key as keyof typeof documents] !== null;
            
            return (
              <div key={docType.key} className="border border-[#e2d4b7] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-[#1f3b2c]">{docType.label}</h3>
                      {docType.required && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                      <span className={`text-sm ${getStatusColor(status)}`}>
                        {status === 'uploaded' ? 'Uploaded' : 'Not Uploaded'}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280] mt-1">{docType.description}</p>
                    
                    {hasFile && (
                      <div className="mt-3 flex items-center space-x-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-600">
                          {documents[docType.key as keyof typeof documents]?.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileChange(docType.key, file);
                          }
                        }}
                      />
                      <div className="px-3 py-1 border border-[#e2d4b7] rounded-md text-sm text-[#1f3b2c] hover:bg-[#f9fafb] text-center">
                        {hasFile ? 'Change File' : 'Choose File'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Button */}
        <div className="mt-8 flex items-center justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading || Object.values(documents).every(doc => doc === null) || verificationStatus?.documentsUploaded}
            className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : verificationStatus?.documentsUploaded ? 'Upload Documents' : 'Upload Documents'}
          </button>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Verification Guidelines</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• All documents must be clear and readable</li>
          <li>• PDF, JPG, JPEG, and PNG formats are accepted</li>
          <li>• Maximum file size: 5MB per document</li>
          <li>• Business name on documents must match your registered company name</li>
          <li>• Address proof documents should not be older than 3 months</li>
          <li>• Verification process typically takes 3-5 business days</li>
        </ul>
      </div>
    </div>
  );
}
