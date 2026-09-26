'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, CheckCircle, ShieldCheck, 
  Download, FileText, AlertCircle, Sparkles, Scale, 
  ArrowDownRight, ArrowUpRight, Loader2, Coins, User 
} from 'lucide-react';

interface MemberSettlement {
  userId: string;
  fullName: string;
  landAcres: number;
  equityPercentage: number;
  grossAllocation: number;
  expenseDeduction: number;
  labourReimbursement: number;
  machineryReimbursement: number;
  netPayout: number;
  payoutStatus: string;
  breakdownNotes: string;
}

interface SettlementDoc {
  _id: string;
  poolId: string;
  poolName: string;
  season: string;
  collaborationModel: number;
  modelName: string;
  harvestYield: number;
  yieldUnit: string;
  sellingPricePerUnit: number;
  buyerName?: string;
  grossHarvestRevenue: number;
  totalInputExpenses: number;
  agriLinkCommissionOrFee: number;
  netDistributableMargin: number;
  memberSettlements: MemberSettlement[];
  settlerName: string;
  settledAt: string;
  blockchainTxHash?: string;
  status: string;
}

interface PoolSettlementViewProps {
  poolId: string;
  poolName: string;
  collaborationModel: number;
  isFco?: boolean;
  userId?: string;
  userName?: string;
  onSettlementCreated?: () => void;
}

export default function PoolSettlementView({
  poolId,
  poolName,
  collaborationModel = 5,
  isFco = false,
  userId,
  userName,
  onSettlementCreated
}: PoolSettlementViewProps) {
  const [settlement, setSettlement] = useState<SettlementDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new settlement (FCO trigger)
  const [harvestYield, setHarvestYield] = useState<number>(120); // 120 Quintals
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number>(3200); // ₹3,200/quintal
  const [buyerName, setBuyerName] = useState('Karnataka State Agro Federation / APMC Mandi');
  const [season, setSeason] = useState('Kharif 2026');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettlement = async () => {
    if (!poolId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer/pooling/settlement?poolId=${poolId}`);
      const data = await res.json();
      if (data.success && data.settlements?.length > 0) {
        setSettlement(data.settlements[0]);
      } else {
        setSettlement(null);
      }
    } catch (err) {
      console.error('Error fetching settlement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, [poolId]);

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/farmer/pooling/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          season,
          harvestYield: Number(harvestYield),
          sellingPricePerUnit: Number(sellingPricePerUnit),
          buyerName,
          settledById: userId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize settlement');
      }

      setSettlement(data.settlement);
      if (onSettlementCreated) onSettlementCreated();
    } catch (err: any) {
      console.error('Settlement creation error:', err);
      setError(err.message || 'Error processing harvest settlement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white border border-[#e2d4b7] rounded-3xl">
        <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
        <span className="text-xs text-slate-500">Loading harvest & settlement ledger...</span>
      </div>
    );
  }

  // If no settlement exists yet
  if (!settlement) {
    return (
      <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200">
            <Scale className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-[#1f3b2c] text-base">Seasonal Harvest & P&L Settlement</h3>
            <p className="text-xs text-slate-500">
              Settlement statement is generated upon harvest sale execution and collective input expense reconciliation.
            </p>
          </div>
        </div>

        {isFco ? (
          <form onSubmit={handleCreateSettlement} className="mt-4 p-5 bg-[#f8fafc] border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#166534] uppercase">
              <Sparkles className="w-4 h-4" />
              <span>FCO Harvest Settlement Trigger (Model {collaborationModel})</span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Harvest Yield (Quintals)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={harvestYield}
                  onChange={(e) => setHarvestYield(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium text-[#1f3b2c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (₹ / Quintal)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={sellingPricePerUnit}
                  onChange={(e) => setSellingPricePerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-medium text-[#1f3b2c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Season / Cycle
                </label>
                <input
                  type="text"
                  required
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-[#1f3b2c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Buyer / Mandi Destination
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-[#1f3b2c]"
              />
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-600">Estimated Gross Harvest Revenue:</span>
                <div className="text-base font-black text-[#166534]">
                  ₹{(harvestYield * sellingPricePerUnit).toLocaleString()}
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Settlement...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Calculate & Finalize Settlement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-[#f8fafc] border border-dashed border-slate-200 rounded-2xl text-center">
            <p className="text-sm font-semibold text-[#1f3b2c]">
              Harvest cycle is currently active in the field.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your assigned Field Counseling Officer will trigger the harvest valuation and net profit settlement at season completion.
            </p>
          </div>
        )}
      </div>
    );
  }

  // If settlement IS finalized, display the complete verified financial statement
  return (
    <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-6 bg-emerald-50 text-[#1f3b2c] border-b border-emerald-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#166534] text-white rounded-full text-[10px] font-black uppercase">
                {settlement.modelName}
              </span>
              <span className="text-xs text-slate-600 font-semibold">{settlement.season}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-[#1f3b2c]">{settlement.poolName} - Final Settlement</h2>
            <p className="text-xs text-slate-600 mt-1">
              Certified by {settlement.settlerName} on {new Date(settlement.settledAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-200/60">
          <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium uppercase block">Harvest Yield</span>
            <div className="text-base font-black text-[#1f3b2c]">
              {settlement.harvestYield} <span className="text-xs font-normal text-slate-500">{settlement.yieldUnit}</span>
            </div>
            <div className="text-[10px] text-slate-500">@ ₹{settlement.sellingPricePerUnit.toLocaleString()}/unit</div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium uppercase block">Gross Crop Revenue</span>
            <div className="text-base font-black text-[#166534]">
              ₹{settlement.grossHarvestRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">From {settlement.buyerName || 'Mandi Sale'}</div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium uppercase block">Total Inputs & Fees</span>
            <div className="text-base font-black text-rose-600">
              -₹{(settlement.totalInputExpenses + settlement.agriLinkCommissionOrFee).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">Inputs + AgriLink Platform Cut</div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium uppercase block">Net Distributed</span>
            <div className="text-base font-black text-[#166534]">
              ₹{settlement.netDistributableMargin.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">100% Disbursed</div>
          </div>
        </div>
      </div>

      {/* Member Payouts Table */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-[#1f3b2c] text-sm">Individual Farmer Payout Breakdown</h4>
            <p className="text-xs text-slate-500">Calculated strictly under {settlement.modelName} business logic</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Audited Payouts</span>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Land & Equity</th>
                <th className="py-3 px-4">Gross Share</th>
                <th className="py-3 px-4">Input Deductions</th>
                <th className="py-3 px-4">Work / Mach. Additions</th>
                <th className="py-3 px-4 text-right">Net Farmer Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {settlement.memberSettlements.map((m) => (
                <tr key={m.userId} className="hover:bg-emerald-50/20">
                  <td className="py-3.5 px-4 font-bold text-[#1f3b2c]">
                    {m.fullName}
                    <div className="text-[10px] text-slate-500 font-normal">{m.breakdownNotes}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#1f3b2c]">{m.landAcres} Acres</span>
                    <div className="text-[10px] text-[#166534] font-bold">{m.equityPercentage}% Pool Share</div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    ₹{m.grossAllocation.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-rose-600">
                    {m.expenseDeduction > 0 ? `-₹${m.expenseDeduction.toLocaleString()}` : '₹0'}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-blue-600">
                    {m.labourReimbursement + m.machineryReimbursement > 0 ? (
                      `+₹${(m.labourReimbursement + m.machineryReimbursement).toLocaleString()}`
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="text-sm font-black text-[#166534]">
                      ₹{m.netPayout.toLocaleString()}
                    </div>
                    <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5">
                      Credited
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cryptographic Stamped Proof */}
        {settlement.blockchainTxHash && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
              <span className="font-bold text-[#1f3b2c]">Cryptographic Settlement Stamp:</span>
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs">{settlement.blockchainTxHash}</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase bg-white border border-emerald-200 px-2 py-0.5 rounded-md">Immutable Record</span>
          </div>
        )}
      </div>

    </div>
  );
}
