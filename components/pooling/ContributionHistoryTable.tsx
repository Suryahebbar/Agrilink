'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, Tractor, Coins, CheckCircle, XCircle, 
  AlertCircle, Plus, RefreshCw, Filter, ShieldCheck, 
  Calendar, User, ChevronRight, Check, X, Loader2 
} from 'lucide-react';
import ContributionLoggerModal from './ContributionLoggerModal';

interface ContributionLog {
  _id: string;
  userId: string;
  farmerName: string;
  type: 'labour' | 'machinery' | 'capital';
  activityName: string;
  quantity: number;
  unit: string;
  unitRate?: number;
  totalValue: number;
  date: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedByName?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

interface MemberSummary {
  userId: string;
  fullName: string;
  landAcres: number;
  initialInvestment: number;
  totalLabourHours: number;
  labourValue: number;
  totalMachineryHours: number;
  machineryValue: number;
  extraCapitalInjected: number;
  verifiedContributionsCount: number;
  pendingContributionsCount: number;
}

interface ContributionHistoryTableProps {
  poolId: string;
  userId: string;
  userName?: string;
  isFco?: boolean;
  onRefreshPool?: () => void;
}

export default function ContributionHistoryTable({
  poolId,
  userId,
  userName = 'Farmer Member',
  isFco = false,
  onRefreshPool
}: ContributionHistoryTableProps) {
  const [logs, setLogs] = useState<ContributionLog[]>([]);
  const [summaries, setSummaries] = useState<MemberSummary[]>([]);
  const [model, setModel] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchContributions = async () => {
    if (!poolId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer/pooling/contributions?poolId=${poolId}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.contributions || []);
        setSummaries(data.memberSummaries || []);
        setModel(data.collaborationModel || 5);
      }
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [poolId]);

  const handleVerifyOrReject = async (contributionId: string, newStatus: 'verified' | 'rejected') => {
    setActionLoadingId(contributionId);
    try {
      const res = await fetch('/api/farmer/pooling/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId,
          status: newStatus,
          verifiedBy: userId,
          verifiedByName: userName || 'Field Counselor Officer',
          rejectionReason: newStatus === 'rejected' ? 'Discrepancy in field hours logged' : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchContributions();
        if (onRefreshPool) onRefreshPool();
      }
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute total aggregates
  const totalVerifiedLabour = summaries.reduce((s, m) => s + m.totalLabourHours, 0);
  const totalVerifiedMachinery = summaries.reduce((s, m) => s + m.totalMachineryHours, 0);
  const totalExtraCapital = summaries.reduce((s, m) => s + m.extraCapitalInjected, 0);
  const totalValueCredited = summaries.reduce((s, m) => s + m.labourValue + m.machineryValue + m.extraCapitalInjected, 0);

  const filteredLogs = logs.filter(l => {
    if (filterType === 'all') return true;
    return l.type === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-[#e2d4b7] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Verified Labour</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1f3b2c]">
            {totalVerifiedLabour} <span className="text-xs font-normal text-slate-500">Hours</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2d4b7] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Machinery Used</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Tractor className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1f3b2c]">
            {totalVerifiedMachinery} <span className="text-xs font-normal text-slate-500">Hours</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2d4b7] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Extra Capital</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#1f3b2c]">
            ₹{totalExtraCapital.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2d4b7] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Value</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[#166534]">
            ₹{totalValueCredited.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Member Weighting Breakdown Preview (Model 5 Multi-Factor Consensus) */}
      {model === 5 && summaries.length > 0 && (
        <div className="p-6 bg-emerald-50/70 text-[#1f3b2c] rounded-3xl shadow-sm border border-emerald-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#166534] text-white rounded-full text-[11px] font-extrabold uppercase">
                  Model 5 Research Engine
                </span>
                <h4 className="font-bold text-sm text-[#1f3b2c]">Live Dynamic Contribution Shares</h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Formula: (35% Land) + (25% Capital) + (20% Labour) + (20% Machinery)
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Daily Contribution</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaries.map((m) => {
              const totalLand = summaries.reduce((s, x) => s + x.landAcres, 0) || 1;
              const landShare = (m.landAcres / totalLand) * 35;
              const labourShare = totalVerifiedLabour > 0 ? (m.totalLabourHours / totalVerifiedLabour) * 20 : 0;
              const machShare = totalVerifiedMachinery > 0 ? (m.totalMachineryHours / totalVerifiedMachinery) * 20 : 0;
              const capShare = (totalExtraCapital + summaries.reduce((s, x) => s + x.initialInvestment, 0)) > 0
                ? ((m.extraCapitalInjected + m.initialInvestment) / (totalExtraCapital + summaries.reduce((s, x) => s + x.initialInvestment, 0))) * 25
                : 25 * (m.landAcres / totalLand);

              const estEquity = (landShare + labourShare + machShare + capShare).toFixed(1);

              return (
                <div key={m.userId} className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#1f3b2c] truncate">{m.fullName}</span>
                      <span className="text-xs font-black text-[#166534]">{estEquity}% Share</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-1">
                      <span>🌾 {m.landAcres} Ac</span>
                      <span>⏱️ {m.totalLabourHours}h Work</span>
                      <span>🚜 {m.totalMachineryHours}h Mach</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className="bg-[#166534] h-full rounded-full" style={{ width: `${Math.min(100, Number(estEquity))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[#1f3b2c] text-sm">Contribution Activity Log</h4>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              {logs.length} Entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center bg-[#f8fafc] border border-slate-200 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition ${filterType === 'all' ? 'bg-[#166534] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('labour')}
                className={`px-3 py-1 rounded-lg transition ${filterType === 'labour' ? 'bg-[#166534] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Labour
              </button>
              <button
                onClick={() => setFilterType('machinery')}
                className={`px-3 py-1 rounded-lg transition ${filterType === 'machinery' ? 'bg-[#166534] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Machinery
              </button>
              <button
                onClick={() => setFilterType('capital')}
                className={`px-3 py-1 rounded-lg transition ${filterType === 'capital' ? 'bg-[#166534] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Capital
              </button>
            </div>

            <button
              onClick={fetchContributions}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date & Member</th>
                <th className="py-3 px-4">Type & Activity</th>
                <th className="py-3 px-4">Quantity / Duration</th>
                <th className="py-3 px-4">Valuation</th>
                <th className="py-3 px-4">Verification Status</th>
                {isFco && <th className="py-3 px-4 text-right">FCO Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={isFco ? 6 : 5} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#166534]" />
                    <span>Loading contribution ledger...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={isFco ? 6 : 5} className="py-8 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <span>No contribution activities logged yet.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-emerald-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1f3b2c]">{log.farmerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {log.type === 'labour' && (
                          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {log.type === 'machinery' && (
                          <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Tractor className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {log.type === 'capital' && (
                          <span className="p-1.5 bg-emerald-50 text-[#166534] rounded-lg">
                            <Coins className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-[#1f3b2c]">{log.activityName}</div>
                          {log.notes && <div className="text-[10px] text-slate-500 truncate max-w-xs">{log.notes}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1f3b2c]">
                        {log.quantity} {log.unit}
                      </span>
                      {log.unitRate ? (
                        <div className="text-[10px] text-slate-500">@ ₹{log.unitRate}/{log.unit === 'hours' ? 'hr' : log.unit}</div>
                      ) : null}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#166534]">
                        ₹{log.totalValue.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {log.status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                      {log.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Pending FCO</span>
                        </span>
                      )}
                      {log.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-bold" title={log.rejectionReason}>
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>

                    {isFco && (
                      <td className="py-3.5 px-4 text-right">
                        {log.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyOrReject(log._id, 'verified')}
                              disabled={actionLoadingId === log._id}
                              className="px-2.5 py-1 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleVerifyOrReject(log._id, 'rejected')}
                              disabled={actionLoadingId === log._id}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Trigger */}
      <ContributionLoggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        poolId={poolId}
        userId={userId}
        farmerName={userName}
        onSuccess={fetchContributions}
      />
    </div>
  );
}
