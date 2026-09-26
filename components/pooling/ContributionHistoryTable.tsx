'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, Tractor, Coins, CheckCircle, XCircle, 
  AlertCircle, Plus, RefreshCw, Filter, ShieldCheck, 
  Calendar, User, ChevronRight, Check, X, Loader2,
  ExternalLink, Shield
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
  blockchain?: {
    isAnchored: boolean;
    proofHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: string;
  };
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
        fetchContributions();
        if (onRefreshPool) onRefreshPool();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating contribution status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const totalLabour = summaries.reduce((acc, s) => acc + s.totalLabourHours, 0);
  const totalLabourValue = summaries.reduce((acc, s) => acc + s.labourValue, 0);
  const totalMachinery = summaries.reduce((acc, s) => acc + s.totalMachineryHours, 0);
  const totalMachineryValue = summaries.reduce((acc, s) => acc + s.machineryValue, 0);
  const totalCapital = summaries.reduce((acc, s) => acc + s.extraCapitalInjected, 0);

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Labour Metric */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white border border-blue-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Labour Logged</div>
            <div className="text-xl font-black text-[#1f3b2c] mt-0.5">
              {totalLabour} <span className="text-xs font-semibold text-slate-500">Hours</span>
            </div>
            <div className="text-xs font-bold text-blue-700 mt-0.5">
              Valuation: ₹{totalLabourValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Machinery Metric */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white border border-amber-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Machinery & Fuel Hours</div>
            <div className="text-xl font-black text-[#1f3b2c] mt-0.5">
              {totalMachinery} <span className="text-xs font-semibold text-slate-500">Hours</span>
            </div>
            <div className="text-xs font-bold text-amber-700 mt-0.5">
              Valuation: ₹{totalMachineryValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Capital Metric */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-100/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#166534] flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Injected Capital</div>
            <div className="text-xl font-black text-[#1f3b2c] mt-0.5">
              ₹{totalCapital.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-[#166534] mt-0.5">
              Direct input purchases / emergency funds
            </div>
          </div>
        </div>

      </div>

      {/* Member Contribution Breakdown (Accordion / Grid) */}
      <div className="bg-white border border-[#e2d4b7] rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-[#1f3b2c] text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-[#166534]" /> Member Cumulative Contribution Balance
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks individual resource allocation to adjust final net profit distributions.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Model #{model} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {summaries.map((summary) => (
            <div 
              key={summary.userId}
              className={`p-4 rounded-2xl border transition-all ${
                summary.userId === userId 
                  ? 'bg-emerald-50/30 border-[#166534]/40 shadow-xs ring-1 ring-[#166534]/20' 
                  : 'bg-[#f8fafc] border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#1f3b2c] text-sm flex items-center gap-1.5">
                  {summary.fullName}
                  {summary.userId === userId && (
                    <span className="text-[10px] bg-[#166534] text-white px-2 py-0.2 rounded-full font-bold">You</span>
                  )}
                </span>
                <span className="text-xs font-semibold text-slate-500">{summary.landAcres} Acres</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-center">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Labour</div>
                  <div className="text-xs font-extrabold text-[#1f3b2c] mt-0.5">{summary.totalLabourHours}h</div>
                  <div className="text-[10px] font-bold text-blue-600">₹{summary.labourValue.toLocaleString()}</div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Machinery</div>
                  <div className="text-xs font-extrabold text-[#1f3b2c] mt-0.5">{summary.totalMachineryHours}h</div>
                  <div className="text-[10px] font-bold text-amber-600">₹{summary.machineryValue.toLocaleString()}</div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Capital</div>
                  <div className="text-xs font-extrabold text-[#166534] mt-0.5">₹{summary.extraCapitalInjected.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-400">{summary.verifiedContributionsCount} logs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Contribution Activity Log Table */}
      <div className="bg-white border border-[#e2d4b7] rounded-3xl overflow-hidden shadow-xs">
        
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[#1f3b2c] text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#166534]" /> Contribution Activity Log (On-Chain)
            </h4>
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
                <th className="py-3 px-4">Verification & Ledger</th>
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

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        {log.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                        {log.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pending FCO</span>
                          </span>
                        )}
                        {log.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold" title={log.rejectionReason}>
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      {log.blockchain?.isAnchored && (
                        <a
                          href={`/verify?type=contribution&id=${log._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#1A9B9A] hover:underline"
                        >
                          <Shield className="w-3 h-3" />
                          <span>On-Chain #{log.blockchain.blockNumber} ↗</span>
                        </a>
                      )}
                    </td>

                    {isFco && (
                      <td className="py-3.5 px-4 text-right">
                        {log.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyOrReject(log._id, 'verified')}
                              disabled={actionLoadingId === log._id}
                              className="px-2.5 py-1 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs disabled:opacity-50"
                              title="Verify & Anchor On Blockchain"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleVerifyOrReject(log._id, 'rejected')}
                              disabled={actionLoadingId === log._id}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Reject Log"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No action</span>
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

      {/* Modal for adding log */}
      {isModalOpen && (
        <ContributionLoggerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          poolId={poolId}
          userId={userId}
          farmerName={userName}
          onSuccess={() => {
            fetchContributions();
            if (onRefreshPool) onRefreshPool();
          }}
        />
      )}

    </div>
  );
}
