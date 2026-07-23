'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, 
  FiUserPlus, 
  FiEye, 
  FiEdit, 
  FiCheck, 
  FiX, 
  FiUnlock, 
  FiChevronLeft, 
  FiChevronRight, 
  FiUser, 
  FiRefreshCw, 
  FiMapPin, 
  FiBriefcase, 
  FiBookOpen 
} from 'react-icons/fi';
import { adminFetch } from '@/lib/admin-client-auth';
import Link from 'next/link';

interface Fco {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  status: 'active' | 'inactive';
  createdAt: string;
  address: string;
  username: string;
  profilePicture: string;
}

export default function FcoManagement() {
  const router = useRouter();
  const [fcos, setFcos] = useState<Fco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Success state banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Action States
  const [selectedFco, setSelectedFco] = useState<Fco | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'password_reset' | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [fcoStatus, setFcoStatus] = useState<'active' | 'inactive'>('active');

  const fetchFcos = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        sortBy
      });

      const res = await adminFetch(`/api/admin/fco?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch FCOs');
      }

      setFcos(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching FCOs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFcos();
  }, [page, status, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFcos();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    setSortBy('newest');
    setTimeout(() => fetchFcos(), 50);
  };

  const openCreateModal = () => {
    setFullName('');
    setEmployeeId('');
    setEmail('');
    setPhone('');
    setAddress('');
    setQualification('');
    setExperience(0);
    setUsername('');
    setPassword('');
    setProfilePicture('');
    setFcoStatus('active');
    setModalType('create');
  };

  const openEditModal = (fco: Fco) => {
    setSelectedFco(fco);
    setFullName(fco.fullName);
    setPhone(fco.phone);
    setAddress(fco.address);
    setQualification(fco.qualification);
    setExperience(fco.experience);
    setProfilePicture(fco.profilePicture);
    setFcoStatus(fco.status);
    setModalType('edit');
  };

  const openPasswordResetModal = (fco: Fco) => {
    setSelectedFco(fco);
    setPassword('');
    setModalType('password_reset');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/admin/fco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          employeeId,
          email,
          phone,
          address,
          qualification,
          experience: Number(experience),
          username,
          password,
          profilePicture,
          status: fcoStatus
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create FCO');

      setActionSuccessMessage('FCO successfully created.');
      setModalType(null);
      fetchFcos();
      setTimeout(() => setActionSuccessMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFco) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/fco/${selectedFco.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          address,
          qualification,
          experience: Number(experience),
          status: fcoStatus,
          profilePicture
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update FCO');

      setActionSuccessMessage('FCO details successfully updated.');
      setModalType(null);
      setSelectedFco(null);
      fetchFcos();
      setTimeout(() => setActionSuccessMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFco) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/fco/${selectedFco.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          newPassword: password
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to reset password');

      setActionSuccessMessage(`Password successfully reset for ${selectedFco.fullName}.`);
      setModalType(null);
      setSelectedFco(null);
      setTimeout(() => setActionSuccessMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (fcoId: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminFetch(`/api/admin/fco/${fcoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          status: nextStatus
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to toggle status');

      setActionSuccessMessage(`Account ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
      fetchFcos();
      setTimeout(() => setActionSuccessMessage(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">FCO Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add, update, and manage credentials for Farm Collaboration Officers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <FiUserPlus /> Add FCO Officer
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <FiCheck className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filters Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FiSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search FCOs by Employee ID, Name, Email or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent text-sm text-gray-900 bg-white"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Filter Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
            >
              <option value="newest">Newest Registration</option>
              <option value="oldest">Oldest Registration</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A9B9A] mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium text-sm">Loading FCO data...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p className="font-bold text-lg">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : fcos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiUser className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#232F3E]">No FCOs Registered</h3>
            <p className="text-sm text-gray-400 mt-1">Use the "Add FCO Officer" button above to register an officer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Officer Details</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Background</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {fcos.map((fco) => (
                  <tr key={fco.id} className="hover:bg-[#E6F7F7]/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {fco.profilePicture ? (
                          <img 
                            src={fco.profilePicture} 
                            alt={fco.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E6F7F7] text-[#1A9B9A] flex items-center justify-center font-bold">
                            {fco.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#232F3E]">{fco.fullName}</p>
                          <p className="text-xs text-gray-400">@{fco.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                      {fco.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-gray-900 font-semibold">{fco.phone}</p>
                        <p className="text-xs text-gray-400">{fco.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <p className="flex items-center gap-1"><FiBookOpen /> {fco.qualification}</p>
                        <p className="flex items-center gap-1"><FiBriefcase /> {fco.experience} Years Exp</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fco.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/fco/${fco.id}`}
                          className="p-2 border border-gray-200 hover:border-[#1A9B9A] hover:bg-[#E6F7F7]/20 text-gray-600 hover:text-[#1A9B9A] rounded-lg transition-all"
                          title="View Officer Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => openEditModal(fco)}
                          className="p-2 border border-gray-200 hover:border-[#1A9B9A] hover:bg-[#E6F7F7]/20 text-gray-600 hover:text-[#1A9B9A] rounded-lg transition-all"
                          title="Edit Profile"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(fco.id, fco.status)}
                          className={`p-2 border rounded-lg transition-all ${
                            fco.status === 'active' 
                              ? 'border-gray-200 hover:border-rose-500 hover:bg-rose-50 text-gray-600 hover:text-rose-600'
                              : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600'
                          }`}
                          title={fco.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {fco.status === 'active' ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => openPasswordResetModal(fco)}
                          className="p-2 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <FiUnlock className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && fcos.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Showing {fcos.length} of {totalItems} officers
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

      {/* Creation / Editing / Reset Password Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#232F3E] border-b border-gray-100 pb-3 uppercase tracking-wider">
              {modalType === 'create' && 'Register FCO Officer'}
              {modalType === 'edit' && 'Edit FCO Officer details'}
              {modalType === 'password_reset' && 'Reset Secure Password'}
            </h3>

            <form onSubmit={
              modalType === 'create' 
                ? handleCreateSubmit 
                : modalType === 'edit' 
                  ? handleEditSubmit 
                  : handlePasswordResetSubmit
            } className="my-4 space-y-4">
              
              {modalType === 'password_reset' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    FCO Account: <span className="font-bold text-[#232F3E]">{selectedFco?.fullName}</span>
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new FCO password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Employee ID</label>
                    <input
                      type="text"
                      required
                      disabled={modalType === 'edit'}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email</label>
                    <input
                      type="email"
                      required
                      disabled={modalType === 'edit'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Username</label>
                    <input
                      type="text"
                      required
                      disabled={modalType === 'edit'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {modalType === 'create' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Qualification</label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Experience (Years)</label>
                    <input
                      type="number"
                      required
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Profile Picture URL</label>
                    <input
                      type="text"
                      placeholder="http://example.com/avatar.jpg"
                      value={profilePicture}
                      onChange={(e) => setProfilePicture(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Office Address</label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-[#1A9B9A] focus:outline-none resize-none text-gray-900 bg-white"
                    />
                  </div>

                  {modalType === 'edit' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Status</label>
                      <select
                        value={fcoStatus}
                        onChange={(e) => setFcoStatus(e.target.value as 'active' | 'inactive')}
                        className="w-full py-2 px-3 border border-gray-200 rounded-xl text-xs focus:ring-[#1A9B9A] focus:outline-none text-gray-900 bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => { setModalType(null); setSelectedFco(null); }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-white bg-[#1A9B9A] hover:bg-[#147878] rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {actionLoading ? 'Saving...' : 'Confirm'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
