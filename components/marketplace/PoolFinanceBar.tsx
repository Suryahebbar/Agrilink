'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, DollarSign, PieChart, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, 
  Layers, ShoppingBag, ShieldCheck, ArrowRight
} from 'lucide-react';

interface FinanceMetrics {
  poolId?: string;
  poolName: string | null;
  totalPooledLand?: number;
  crop?: string;
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  myLand?: number;
  mySharePercentage?: number;
  personalAllocatedBudget?: number;
  personalShareSpent?: number;
  personalShareRemaining?: number;
  pendingProposalsCount?: number;
  categoryBreakdown?: {
    seeds: number;
    fertilizers: number;
    equipment: number;
    labor: number;
    others: number;
  };
  recentExpenses?: Array<{
    id: string;
    category: string;
    amount: number;
    date: string;
    farmerName: string;
    reason: string;
  }>;
}

interface PoolFinanceBarProps {
  userId: string | null;
  onOpenPoolOrders?: () => void;
  variant?: 'compact' | 'full';
}

export default function PoolFinanceBar({ userId, onOpenPoolOrders, variant = 'full' }: PoolFinanceBarProps) {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [hasPool, setHasPool] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchMetrics = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/farmer/finance-bar?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHasPool(data.hasPool);
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching finance bar metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // live updates every 15s
    return () => clearInterval(interval);
  }, [userId]);

  if (loading || !metrics || !hasPool) {
    return null; // Only render for pooled farmers
  }

  const utilization = metrics.utilizationPercentage || 0;
  const progressColor = 
    utilization > 85 ? 'bg-rose-500' : 
    utilization > 60 ? 'bg-amber-500' : 'bg-emerald-500';

  const progressBg = 
    utilization > 85 ? 'text-rose-700 bg-rose-50 border-rose-200' : 
    utilization > 60 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className="w-full bg-white text-[#1f3b2c] rounded-3xl shadow-sm border border-[#e2d4b7] p-5 md:p-6 mb-6 transition-all relative overflow-hidden animate-fadeIn">
      {/* Main Top Summary Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        
        {/* Left: Pool Identity & Badges */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Users className="w-3.5 h-3.5" /> Farm Pool Finance Bar
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {metrics.totalPooledLand ? `${metrics.totalPooledLand} Combined Acres` : ''} • Crop: {metrics.crop}
            </span>
            {metrics.pendingProposalsCount && metrics.pendingProposalsCount > 0 ? (
              <button
                onClick={onOpenPoolOrders}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse hover:bg-amber-200 transition-all shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5" /> {metrics.pendingProposalsCount} Action Required
              </button>
            ) : null}
          </div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#1f3b2c] flex items-center gap-2">
            {metrics.poolName}
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-normal border border-emerald-200">
              FCO Synced ✓
            </span>
          </h2>
        </div>

        {/* Middle/Right: Quick Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 text-left">
          <div className="bg-[#f8fafc] rounded-2xl px-3.5 py-2.5 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pool Budget</p>
            <p className="text-base font-extrabold text-[#1f3b2c]">₹{metrics.budget.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-[#f8fafc] rounded-2xl px-3.5 py-2.5 border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Spent</p>
            <p className="text-base font-extrabold text-[#1f3b2c]">₹{metrics.spent.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-emerald-50 rounded-2xl px-3.5 py-2.5 border border-emerald-200 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Your Share</p>
            <p className="text-base font-extrabold text-[#166534]">
              ₹{(metrics.personalShareSpent || 0).toLocaleString('en-IN')}
              <span className="text-[10px] text-emerald-700 font-normal ml-1">({metrics.mySharePercentage}%)</span>
            </p>
          </div>
        </div>

      </div>

      {/* Progress Bar & Split Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Budget Utilized:</span>
            <span className="font-mono font-bold text-[#1f3b2c]">{utilization}%</span>
            <span className="text-slate-500 hidden sm:inline">
              (₹{(metrics.remaining).toLocaleString('en-IN')} remaining of ₹{metrics.budget.toLocaleString('en-IN')})
            </span>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-[#166534] hover:text-[#14532d] flex items-center gap-1 transition-colors underline-offset-4 hover:underline"
          >
            {expanded ? 'Hide Breakdown' : 'View Breakdown & FCO Log'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* The Animated Progress Track */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(1, utilization))}%` }}
          />
        </div>
      </div>

      {/* Expandable Breakdown Drawer */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          
          {/* Category Expenditure Breakdown */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <p className="font-bold text-[#1f3b2c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <PieChart className="w-3.5 h-3.5 text-[#166534]" /> Category Breakdown
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>🌱 Seeds & Nutrients</span>
                <span className="font-bold text-[#1f3b2c] font-mono">₹{(metrics.categoryBreakdown?.seeds || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🧪 Fertilizers & Bio-stimulants</span>
                <span className="font-bold text-[#1f3b2c] font-mono">₹{(metrics.categoryBreakdown?.fertilizers || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🚜 Tools & Equipment</span>
                <span className="font-bold text-[#1f3b2c] font-mono">₹{(metrics.categoryBreakdown?.equipment || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🛡️ Pesticides & Crop Care</span>
                <span className="font-bold text-[#1f3b2c] font-mono">₹{(metrics.categoryBreakdown?.others || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Recent Synced Pool Purchases */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-bold text-[#1f3b2c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" /> FCO Ledger Recent Entries
              </p>
              {onOpenPoolOrders && (
                <button
                  onClick={onOpenPoolOrders}
                  className="text-[#166534] hover:text-[#14532d] font-semibold text-[11px] flex items-center gap-1"
                >
                  Manage Proposals <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {(!metrics.recentExpenses || metrics.recentExpenses.length === 0) ? (
                <p className="text-slate-400 italic py-2">No cooperative marketplace purchases executed yet.</p>
              ) : (
                metrics.recentExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between items-start bg-white p-2.5 rounded-xl border border-slate-100 text-[11px]">
                    <div className="truncate max-w-[70%]">
                      <p className="font-bold text-[#1f3b2c] truncate">{e.reason || e.category}</p>
                      <p className="text-[10px] text-slate-500">{e.date} • {e.farmerName}</p>
                    </div>
                    <span className="font-bold text-[#166534] font-mono">₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
