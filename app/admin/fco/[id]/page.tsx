'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiBookOpen, 
  FiBriefcase, 
  FiCalendar, 
  FiUsers, 
  FiClock, 
  FiCheckSquare, 
  FiTrendingUp 
} from 'react-icons/fi';
import { adminFetch } from '@/lib/admin-client-auth';
import Link from 'next/link';

interface FcoDetails {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  qualification: string;
  experience: number;
  status: 'active' | 'inactive';
  createdAt: string;
  profilePicture: string;
  username: string;
  workloadSummary: {
    assignedGroupsCount: number;
    pendingMeetingsCount: number;
    completedCounsellingCount: number;
    completedAgreementsCount: number;
  };
}

export default function FcoProfileDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  const [fco, setFco] = useState<FcoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFcoDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch(`/api/admin/fco/${resolvedParams.id}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch FCO details');
      }

      setFco(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFcoDetails();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A9B9A] mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium text-sm">Loading FCO details...</p>
      </div>
    );
  }

  if (error || !fco) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <h3 className="text-[#D13212] font-bold text-lg">Error Loading FCO Profile</h3>
        <p className="text-red-600 text-sm mt-1">{error || 'FCO details could not be loaded.'}</p>
        <button
          onClick={() => router.push('/admin/fco')}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link 
          href="/admin/fco" 
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#1A9B9A] transition-colors"
        >
          <FiArrowLeft className="mr-1.5" /> Back to FCO list
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-100">
          {fco.profilePicture ? (
            <img 
              src={fco.profilePicture} 
              alt={fco.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-[#E6F7F7]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#E6F7F7] text-[#1A9B9A] flex items-center justify-center font-bold text-3xl border-2 border-[#E6F7F7]">
              {fco.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-center sm:justify-start">
              <h1 className="text-2xl font-extrabold text-[#232F3E]">{fco.fullName}</h1>
              <div>
                {fco.status === 'active' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Inactive</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 font-semibold">Employee ID: {fco.employeeId}</p>
            <p className="text-xs text-gray-400">Username: @{fco.username}</p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <p className="text-xs text-gray-400 font-bold">REGISTRATION DATE</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {new Date(fco.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Workload & Meeting Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Assigned Groups</p>
                <p className="text-2xl font-black text-[#232F3E] mt-1">{fco.workloadSummary.assignedGroupsCount}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-[#1A9B9A] rounded-full">
                <FiUsers className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Pending Meetings</p>
                <p className="text-2xl font-black text-[#232F3E] mt-1">{fco.workloadSummary.pendingMeetingsCount}</p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-full">
                <FiClock className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Completed Counselling</p>
                <p className="text-2xl font-black text-[#232F3E] mt-1">{fco.workloadSummary.completedCounsellingCount}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full">
                <FiCheckSquare className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Completed Agreements</p>
                <p className="text-2xl font-black text-[#232F3E] mt-1">{fco.workloadSummary.completedAgreementsCount}</p>
              </div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-full">
                <FiTrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Profile Info Block */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#232F3E] border-b border-gray-100 pb-2 uppercase tracking-wide flex items-center gap-2">
              <FiUser /> Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Qualification</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5"><FiBookOpen className="text-gray-400" /> {fco.qualification}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Experience</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5"><FiBriefcase className="text-gray-400" /> {fco.experience} Years of Service</span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#232F3E] border-b border-gray-100 pb-2 uppercase tracking-wide flex items-center gap-2">
              <FiMail /> Contact Details
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Email Address</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5"><FiMail className="text-gray-400" /> {fco.email}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Phone Number</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5"><FiPhone className="text-gray-400" /> {fco.phone}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase">Office Address</span>
                <span className="text-sm font-semibold text-gray-900 flex items-start gap-1.5 mt-0.5"><FiMapPin className="text-gray-400 mt-0.5 shrink-0" /> {fco.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
