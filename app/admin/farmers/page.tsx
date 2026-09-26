'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiCheck, 
  FiX, 
  FiAlertOctagon, 
  FiUnlock, 
  FiChevronLeft, 
  FiChevronRight, 
  FiUser, 
  FiRefreshCw, 
  FiMapPin, 
  FiLayers,
  FiTrash2
} from 'react-icons/fi';
import { adminFetch } from '@/lib/admin-client-auth';
import Link from 'next/link';

interface Farmer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profilePicture: string;
  village: string;
  taluk: string;
  district: string;
  totalLandArea: number;
  surveyNumbersCount: number;
  registrationDate: string;
  aadhaarVerificationStatus: 'verified' | 'not_verified' | 'pending';
  rtcVerificationStatus: 'verified' | 'pending';
  accountStatus: 'active' | 'suspended';
  farmPoolStatus: 'None' | 'Pending' | 'Active';
}

export default function FarmersManagement() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [aadhaarStatus, setAadhaarStatus] = useState('');
  const [rtcStatus, setRtcStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [village, setVillage] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals / Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'suspend' | 'password_reset' | null>(null);
  const [reason, setReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Fetch Farmers list
  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        aadhaarStatus,
        rtcStatus,
        district,
        taluk,
        village,
        sortBy
      });

      const res = await adminFetch(`/api/admin/farmers?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch farmers');
      }

      setFarmers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching farmers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [page, status, aadhaarStatus, rtcStatus, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFarmers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setAadhaarStatus('');
    setRtcStatus('');
    setDistrict('');
    setTaluk('');
    setVillage('');
    setPage(1);
    setSortBy('newest');
    // Fetch directly after resetting state
    setTimeout(() => fetchFarmers(), 50);
  };

  // Admin Actions execution
  const executeAction = async (farmerId: string, action: string, payload: Record<string, any> = {}) => {
    setActionLoading(true);
    setActionSuccessMessage('');
    try {
      const res = await adminFetch(`/api/admin/farmers/${farmerId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Action execution failed');
      }

      setActionSuccessMessage(`Successfully updated farmer status: ${action}`);
      setSelectedFarmer(null);
      setActionType(null);
      setReason('');
      setNewPassword('');
      fetchFarmers();

      setTimeout(() => setActionSuccessMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFarmer = async (farmerId: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the farmer account for "${fullName}"? This will delete all their land details, integrations, and profile data.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/farmers/${farmerId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete farmer account');
      }
      alert('Farmer account and all related data deleted successfully.');
      fetchFarmers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Deletion failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Suspended</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Farmer Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review farmer credentials, survey records, and administrative actions.</p>
        </div>
        <div>
          <button 
            onClick={fetchFarmers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-600 text-sm font-semibold transition-colors"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <FiCheck className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Search and Advanced Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FiSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search farmers by Name, Phone, Village or Survey Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl text-sm font-bold shadow-md transition-all shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Account Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Aadhaar Status</label>
            <select
              value={aadhaarStatus}
              onChange={(e) => { setAadhaarStatus(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            >
              <option value="">All Aadhaar</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="not_verified">Not Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">RTC Status</label>
            <select
              value={rtcStatus}
              onChange={(e) => { setRtcStatus(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            >
              <option value="">All RTC</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">District</label>
            <input
              type="text"
              placeholder="e.g. Chikmagalur"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              onBlur={() => { setPage(1); fetchFarmers(); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Taluk</label>
            <input
              type="text"
              placeholder="e.g. Kadur"
              value={taluk}
              onChange={(e) => setTaluk(e.target.value)}
              onBlur={() => { setPage(1); fetchFarmers(); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none"
            >
              <option value="newest">Newest Registration</option>
              <option value="oldest">Oldest Registration</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A9B9A] mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium text-sm">Loading farmers data...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p className="font-bold text-lg">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : farmers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiUser className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#232F3E]">No Farmers Found</h3>
            <p className="text-sm text-gray-400 mt-1">Try expanding your search query or adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Farmer Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Land Stats</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-[#E6F7F7]/10 transition-colors">
                    {/* Details Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {farmer.profilePicture ? (
                          <img 
                            src={farmer.profilePicture} 
                            alt={farmer.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E6F7F7] text-[#1A9B9A] flex items-center justify-center font-bold">
                            {farmer.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#232F3E]">{farmer.fullName}</p>
                          <p className="text-xs text-gray-400">ID: {farmer.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-gray-900 font-semibold">{farmer.phone}</p>
                        <p className="text-xs text-gray-400">{farmer.email}</p>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start gap-1.5 text-xs">
                        <FiMapPin className="text-[#1A9B9A] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-800">{farmer.village || 'N/A'}</p>
                          <p className="text-gray-400">{farmer.taluk}, {farmer.district}</p>
                        </div>
                      </div>
                    </td>

                    {/* Land Size */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#232F3E] flex items-center gap-1.5">
                          <FiLayers className="text-emerald-500" /> {farmer.totalLandArea.toFixed(2)} Ac
                        </p>
                        <p className="text-xs text-gray-400">{farmer.surveyNumbersCount} Survey Nos</p>
                        <p className="text-[10px] text-gray-500">Pool: <span className="font-bold">{farmer.farmPoolStatus}</span></p>
                      </div>
                    </td>

                    {/* Verification Badges */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${farmer.aadhaarVerificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-gray-600">Aadhaar: <span className="font-semibold">{farmer.aadhaarVerificationStatus}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`w-2 h-2 rounded-full ${farmer.rtcVerificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-gray-600">RTC: <span className="font-semibold">{farmer.rtcVerificationStatus}</span></span>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(farmer.accountStatus)}
                    </td>

                    {/* Actions Grid */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/farmers/${farmer.id}`}
                          className="p-2 border border-gray-200 hover:border-[#1A9B9A] hover:bg-[#E6F7F7]/20 text-gray-600 hover:text-[#1A9B9A] rounded-lg transition-all"
                          title="View Profile Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        
                        {farmer.accountStatus === 'active' && (
                          <button
                            onClick={() => { setSelectedFarmer(farmer); setActionType('suspend'); }}
                            className="p-2 border border-gray-200 hover:border-rose-500 hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-lg transition-all"
                            title="Suspend Account"
                          >
                            <FiAlertOctagon className="w-4 h-4" />
                          </button>
                        )}

                        {farmer.accountStatus === 'suspended' && (
                          <button
                            onClick={() => executeAction(farmer.id, 'reactivate')}
                            className="p-2 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-lg transition-all"
                            title="Reactivate Account"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => { setSelectedFarmer(farmer); setActionType('password_reset'); }}
                          className="p-2 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <FiUnlock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteFarmer(farmer.id, farmer.fullName)}
                          disabled={actionLoading}
                          className="p-2 border border-gray-200 hover:border-red-600 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Farmer Account"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!loading && farmers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Showing {farmers.length} of {totalItems} farmers
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-gray-200 hover:bg-white rounded-lg text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft />
              </button>
              <span className="text-xs font-bold text-gray-700 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-gray-200 hover:bg-white rounded-lg text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject / Suspend / Password Reset Modal */}
      {selectedFarmer && actionType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#232F3E] border-b border-gray-100 pb-3 uppercase tracking-wider">
              {actionType === 'reject' && 'Reject Farmer Application'}
              {actionType === 'suspend' && 'Suspend Farmer Account'}
              {actionType === 'password_reset' && 'Reset Password'}
            </h3>
            
            <div className="my-4 space-y-4">
              <p className="text-sm text-gray-500">
                Farmer: <span className="font-bold text-gray-800">{selectedFarmer.fullName}</span>
              </p>

              {actionType === 'password_reset' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new 6+ char password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Reason</label>
                  <textarea
                    rows={3}
                    placeholder={`Provide a reason for ${actionType === 'reject' ? 'rejection' : 'suspension'}...`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                disabled={actionLoading}
                onClick={() => { setSelectedFarmer(null); setActionType(null); setReason(''); setNewPassword(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || (actionType === 'password_reset' ? !newPassword : !reason)}
                onClick={() => {
                  if (actionType === 'password_reset') {
                    executeAction(selectedFarmer.id, 'reset_password', { newPassword });
                  } else {
                    executeAction(selectedFarmer.id, actionType, { reason });
                  }
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                  actionType === 'password_reset' 
                    ? 'bg-[#1A9B9A] hover:bg-[#147878]' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
