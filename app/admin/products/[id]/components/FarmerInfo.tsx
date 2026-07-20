'use client';

import { FiUser, FiMail, FiPhone, FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface FarmerInfoProps {
  farmer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
      pincode?: string;
    };
    verificationStatus: 'verified' | 'pending' | 'rejected';
    farmName?: string;
    registrationDate: string;
  };
}

export default function FarmerInfo({ farmer }: FarmerInfoProps) {
  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiAlertCircle className="mr-1" /> Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFullAddress = () => {
    if (!farmer.address) return 'No address provided';
    
    // Handle both zipCode and pincode, and ensure address is an object
    if (typeof farmer.address !== 'object') return 'Invalid address format';
    
    const { street, city, state, country, zipCode, pincode } = farmer.address;
    const addressParts = [];
    
    if (street) addressParts.push(street);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zipCode || pincode) addressParts.push(zipCode || pincode);
    if (country) addressParts.push(country);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-medium text-gray-900">Farmer Information</h2>
        <Link 
          href={`/admin/farmers/${farmer._id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View Full Profile →
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <FiUser className="h-5 w-5 text-gray-500" />
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900">{farmer.name}</h3>
              <span className="ml-2">{getVerificationBadge(farmer.verificationStatus)}</span>
            </div>
            {farmer.farmName && (
              <p className="text-sm text-gray-500">{farmer.farmName}</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start">
            <FiMail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Email</p>
              <a 
                href={`mailto:${farmer.email}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {farmer.email}
              </a>
            </div>
          </div>

          {farmer.phone && (
            <div className="flex items-start">
              <FiPhone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Phone</p>
                <a 
                  href={`tel:${farmer.phone}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {farmer.phone}
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-sm text-gray-900">
                {getFullAddress()}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Registered on {formatDate(farmer.registrationDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
