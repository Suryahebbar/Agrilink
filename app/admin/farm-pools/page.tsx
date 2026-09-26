'use client';

import { useState, useEffect } from 'react';
import { FiFolder, FiSearch, FiFilter, FiUser, FiCalendar, FiMapPin, FiCheckCircle, FiLoader, FiShare2, FiActivity } from 'react-icons/fi';

interface Participant {
  userId: string;
  fullName: string;
  phone: string;
  landSize: number;
  surveyNumber: string;
  landContribution: number;
}

interface FarmPool {
  _id: string;
  name: string;
  status: 'awaiting_counselor' | 'counseling_scheduled' | 'planning' | 'signing' | 'blockchain_storage' | 'active';
  participants: Participant[];
  counselorId?: string;
  counselorName?: string;
  meetingDetails?: {
    meetingType: 'online' | 'offline';
    scheduledAt: string;
    location?: string;
    meetingLink?: string;
  };
  createdAt: string;
}

interface Counselor {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
}

export default function FarmPoolManagement() {
  const [pools, setPools] = useState<FarmPool[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/farm-pools');
      const data = await res.json();
      if (data.success) {
        setPools(data.pools);
        setCounselors(data.counselors);
      }
    } catch (e) {
      console.error('Error fetching pools:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleAssignCounselor = async (poolId: string) => {
    if (!selectedCounselor) return;
    try {
      setAssigningId(poolId);
      const res = await fetch('/api/admin/farm-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, counselorId: selectedCounselor }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPools();
        setSelectedCounselor('');
      } else {
        alert(data.error || 'Failed to assign counselor');
      }
    } catch (e) {
      console.error('Error assigning counselor:', e);
    } finally {
      setAssigningId(null);
    }
  };

  const getStatusBadge = (status: FarmPool['status']) => {
    switch (status) {
      case 'awaiting_counselor':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Awaiting Counselor</span>;
      case 'counseling_scheduled':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Counseling Scheduled</span>;
      case 'planning':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Farm Planning</span>;
      case 'signing':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Awaiting Signatures</span>;
      case 'blockchain_storage':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700">Storing on Blockchain</span>;
      case 'active':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">Active Pool</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const filteredPools = pools.filter(pool => {
    const poolName = pool.name || '';
    const matchesSearch = poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.participants.some(p => (p.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || pool.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Farm Pool Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor collaborative land integrations, counselor allocation, and blockchain verification status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchPools} 
            className="flex items-center gap-2 px-4 py-2 bg-[#1A9B9A] hover:bg-[#157f7e] text-black rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            Refresh Pools
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <FiSearch className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search pools by name or farmer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:border-transparent text-sm text-black"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1"><FiFilter /> Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] bg-white cursor-pointer text-black"
          >
            <option value="all">All Pools</option>
            <option value="awaiting_counselor">Awaiting Counselor</option>
            <option value="counseling_scheduled">Counseling Scheduled</option>
            <option value="planning">Farm Planning</option>
            <option value="signing">Awaiting Signatures</option>
            <option value="blockchain_storage">Blockchain Storage</option>
            <option value="active">Active Pools</option>
          </select>
        </div>
      </div>

      {/* Main Pools list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-gray-100">
          <FiLoader className="h-10 w-10 text-[#1A9B9A] animate-spin mb-3" />
          <p className="text-gray-500 font-medium">Loading farm pools...</p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 border border-gray-100 rounded-2xl shadow-sm">
          <div className="mx-auto w-12 h-12 bg-[#E6F7F7] text-[#1A9B9A] rounded-xl flex items-center justify-center mb-4">
            <FiFolder className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#232F3E] mb-1">No Farm Pools Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">No farm pools matched your search criteria or are currently available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPools.map((pool) => (
            <div 
              key={pool._id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[#232F3E]">{pool.name}</h3>
                    {getStatusBadge(pool.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Created: {new Date(pool.createdAt).toLocaleDateString()}</p>
                </div>
                
                {/* Counselor info / Assignment Action */}
                <div className="flex items-center gap-3">
                  {pool.counselorId ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-800 text-sm">
                      <FiUser className="text-[#1A9B9A]" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Assigned Counselor</p>
                        <p className="font-semibold text-gray-800">{pool.counselorName}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select 
                        value={selectedCounselor}
                        onChange={(e) => setSelectedCounselor(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] text-black"
                      >
                        <option value="">Select FCO Officer...</option>
                        {counselors.map((c) => (
                          <option key={c._id} value={c._id}>{c.name} ({c.employeeId || 'FCO'})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssignCounselor(pool._id)}
                        disabled={!selectedCounselor || assigningId === pool._id}
                        className="px-4 py-2 bg-gradient-to-r from-[#1A9B9A] to-[#157f7e] hover:shadow-lg text-black font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                      >
                        {assigningId === pool._id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pool Details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Participating Farmers</h4>
                  <div className="space-y-3">
                    {pool.participants.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                        <div>
                          <p className="text-sm font-bold text-[#232F3E]">{p.fullName}</p>
                          <p className="text-xs text-gray-400">Phone: {p.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#1A9B9A]">{p.landContribution} Acres</p>
                          <p className="text-xs text-gray-400">Survey No: {p.surveyNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Workflow State & Meetings</h4>
                    {pool.meetingDetails ? (
                      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FiCalendar className="text-amber-600" />
                          <span><strong>Scheduled:</strong> {new Date(pool.meetingDetails.scheduledAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FiMapPin className="text-amber-600" />
                          <span>
                            <strong>Type:</strong> {(pool.meetingDetails.meetingType || 'online').toUpperCase()}
                            {pool.meetingDetails.location && ` - Location: ${pool.meetingDetails.location}`}
                            {pool.meetingDetails.meetingLink && ` - Link: ${pool.meetingDetails.meetingLink}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-400">
                        No meeting scheduled yet. Counselor assignment required.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><FiActivity className="text-emerald-500" /> Active Stage: {pool.status.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1"><FiShare2 /> Total Land Pooled: {pool.participants.reduce((acc, p) => acc + p.landContribution, 0)} Acres</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
