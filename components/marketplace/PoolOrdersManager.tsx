'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, 
  ShoppingBag, ShieldCheck, ArrowRight, RefreshCw, 
  AlertCircle, ChevronRight, PackageCheck, FileText, Check 
} from 'lucide-react';

interface PoolOrdersManagerProps {
  userId: string | null;
  onOrderExecuted?: () => void;
}

export default function PoolOrdersManager({ userId, onOrderExecuted }: PoolOrdersManagerProps) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'voting' | 'executed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProposals = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/marketplace/pool-proposals?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProposals(data.proposals || []);
          setPool(data.pool);
        }
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [userId]);

  const handleVote = async (proposalId: string, vote: 'approve' | 'reject') => {
    if (!userId) return;
    setVotingId(proposalId);
    try {
      const res = await fetch(`/api/marketplace/pool-proposals/${proposalId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vote })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message || 'Vote recorded successfully!');
        await fetchProposals();
        if (data.consensusReached && onOrderExecuted) {
          onOrderExecuted();
        }
      } else {
        alert(data.error || 'Failed to submit vote');
      }
    } catch (err: any) {
      console.error('Vote error:', err);
      alert(err.message || 'Error voting');
    } finally {
      setVotingId(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#166534] border-t-transparent animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Checking Farm Pool group orders & proposals...</p>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-900 text-base">No Active Farm Pool Connected</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Form or join an active Farm Pool in the Digital Farm Pooling portal to unlock collective group purchases with your neighbours.
        </p>
        <a
          href={`/dashboard/farmer/pooling?userId=${userId || ''}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#166534] text-white text-xs font-bold rounded-xl hover:bg-[#14532d] transition-all"
        >
          Go to Farm Pooling <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  const filteredProposals = proposals.filter((p) => {
    if (filter === 'voting') return p.status === 'voting';
    if (filter === 'executed') return p.status === 'executed';
    return true;
  });

  const pendingCount = proposals.filter(p => p.status === 'voting').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-[#166534]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1f3b2c]">{pool.name}</h3>
            <p className="text-[11px] text-gray-500">
              {pool.participants?.length || 0} Pooled Farmers • Consensus Threshold: 100% Unanimous
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({proposals.length})
            </button>
            <button
              onClick={() => setFilter('voting')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filter === 'voting' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active Voting ({pendingCount})
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => setFilter('executed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'executed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Executed ({proposals.filter(p => p.status === 'executed').length})
            </button>
          </div>

          <button
            onClick={fetchProposals}
            title="Refresh Proposals"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-2">
          <PackageCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-700 text-sm">No proposals in this category</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Browse marketplace products and click &quot;Buy with Farm Pool&quot; to initiate a collective group purchase.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((prop) => {
            const approvedCount = (prop.memberSplits || []).filter((s: any) => s.status === 'approved').length;
            const totalMembers = prop.memberSplits?.length || 1;
            const consensusPercent = Math.round((approvedCount / totalMembers) * 100);

            const mySplit = (prop.memberSplits || []).find(
              (s: any) => s.userId?.toString() === userId?.toString()
            );
            const myVoteStatus = mySplit?.status || 'pending';
            const isExecuted = prop.status === 'executed';
            const isCancelled = prop.status === 'cancelled';

            return (
              <div 
                key={prop._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Proposal Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/50 to-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isExecuted 
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled 
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {isExecuted ? '✓ 100% Consensus Executed' : isCancelled ? '✗ Declined / Cancelled' : '⏳ Voting in Progress'}
                      </span>

                      {isExecuted && prop.fcoExpenseId && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> FCO Ledger Synced
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        Proposed by <strong className="text-gray-700">{prop.proposerName}</strong> on {new Date(prop.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                      {prop.items.map((i: any) => i.name).join(', ')}
                    </h4>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Total Pool Cost</span>
                    <span className="text-xl font-black text-[#166534] font-mono">
                      ₹{prop.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items & Consensus Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Column: Items Preview */}
                  <div className="lg:col-span-6 space-y-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order Items</p>
                    <div className="space-y-2">
                      {prop.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          {it.image ? (
                            <img 
                              src={it.image} 
                              alt={it.name}
                              className="w-12 h-12 rounded-lg object-cover bg-white border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {it.category?.slice(0, 2).toUpperCase() || 'IN'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-gray-900 truncate">{it.name}</p>
                            <p className="text-[11px] text-gray-500">
                              Qty: {it.quantity} • ₹{it.price} / {it.unit || 'unit'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs text-[#166534] font-mono">
                              ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {prop.notes && (
                      <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        &quot;{prop.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Right Column: Consensus Progress & Voting */}
                  <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-5 pt-4 lg:pt-0">
                    
                    {/* Consensus Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Consensus Meter
                        </span>
                        <span className="font-mono font-bold text-emerald-800">
                          {approvedCount} / {totalMembers} Approved ({consensusPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${consensusPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Member Vote Status Chips */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member Approvals</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(prop.memberSplits || []).map((split: any, sIdx: number) => {
                          const isApproved = split.status === 'approved';
                          const isDeclined = split.status === 'rejected';
                          return (
                            <div 
                              key={sIdx}
                              className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                                isApproved 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                                  : isDeclined 
                                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="truncate pr-1">
                                <p className="font-bold text-[11px] truncate">{split.fullName}</p>
                                <p className="text-[10px] opacity-75">
                                  {split.landSize} Ac • ₹{split.amountDue}
                                </p>
                              </div>
                              <span className="text-[10px] font-extrabold flex-shrink-0">
                                {isApproved ? '✓ Agreed' : isDeclined ? '✗ Declined' : '⏳ Pending'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Panel for Current Farmer */}
                    {prop.status === 'voting' && mySplit && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-950">Your Pro-Rata Share:</span>
                          <span className="font-mono font-extrabold text-base text-emerald-800">
                            ₹{mySplit.amountDue.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {myVoteStatus === 'approved' ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-white p-2 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>You have approved this proposal. Waiting for other farmers.</span>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleVote(prop._id, 'approve')}
                              disabled={votingId === prop._id}
                              className="flex-1 py-2 px-3 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve & Authorize
                            </button>
                            <button
                              onClick={() => handleVote(prop._id, 'reject')}
                              disabled={votingId === prop._id}
                              className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Details Link if Executed */}
                    {isExecuted && prop.executedOrderId && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">Order Number: <strong>AGR-POOL-ORDER</strong></span>
                        <a 
                          href={`/dashboard/farmer/marketplace/orders?userId=${userId || ''}`}
                          className="font-bold text-[#166534] hover:underline flex items-center gap-1"
                        >
                          View in Orders →
                        </a>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
