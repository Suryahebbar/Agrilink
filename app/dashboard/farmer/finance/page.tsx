'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, 
  BarChart2, FileText, Download, Plus, Filter, 
  Calendar, Layers, ShieldCheck, Tractor, Droplet, 
  Zap, AlertCircle, CheckCircle, RefreshCw, X, ArrowUpRight, ArrowDownRight
} from '../../../../components/ui/icons';
import { exportSeasonalFinancialReportPDF } from '@/lib/utils/seasonal-financial-pdf';

type FinanceTab = 'pnl' | 'expenses' | 'investments' | 'roi' | 'reports';

export default function FarmerFinanceDashboard() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [activeTab, setActiveTab] = useState<FinanceTab>('pnl');
  const [season, setSeason] = useState<string>('All Seasons');
  const [loading, setLoading] = useState<boolean>(true);

  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  // Expense Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCrop, setExpenseCrop] = useState('Arecanut');
  const [expenseCategory, setExpenseCategory] = useState('fertilizer');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseQuantity, setExpenseQuantity] = useState<number | ''>('');
  const [expenseUnit, setExpenseUnit] = useState('Bags');
  const [expensePlotAcres, setExpensePlotAcres] = useState<number>(1);
  const [expensePaymentMode, setExpensePaymentMode] = useState('cash');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Investment Modal States
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [invCrop, setInvCrop] = useState('Arecanut');
  const [invType, setInvType] = useState('self_equity');
  const [invTitle, setInvTitle] = useState('');
  const [invAmount, setInvAmount] = useState<number | ''>('');
  const [invTenure, setInvTenure] = useState<number>(3);
  const [invInterest, setInvInterest] = useState<number>(4);
  const [invExpectedRev, setInvExpectedRev] = useState<number | ''>('');
  const [invFunding, setInvFunding] = useState('KCC Agri Loan / Savings');
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  const fetchFinanceData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer/finance?userId=${userId}&season=${encodeURIComponent(season)}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setExpenses(data.expenses || []);
        setInvestments(data.investments || []);
        setSales(data.sales || []);
        setSettlements(data.settlements || []);
      }
    } catch (e) {
      console.error('Error fetching finance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [userId, season]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !expenseTitle || !expenseAmount) return;

    try {
      setSubmittingExpense(true);
      const res = await fetch('/api/farmer/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_expense',
          userId,
          cropName: expenseCrop,
          season: season === 'All Seasons' ? 'Kharif 2026' : season,
          category: expenseCategory,
          title: expenseTitle,
          amount: Number(expenseAmount),
          quantity: Number(expenseQuantity) || 1,
          unit: expenseUnit,
          plotAreaAcres: Number(expensePlotAcres) || 1,
          paymentMode: expensePaymentMode,
          vendorName: expenseVendor,
          notes: expenseNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseQuantity('');
        setExpenseVendor('');
        setExpenseNotes('');
        fetchFinanceData();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating expense record');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !invTitle || !invAmount) return;

    try {
      setSubmittingInvestment(true);
      const res = await fetch('/api/farmer/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_investment',
          userId,
          cropName: invCrop,
          season: season === 'All Seasons' ? 'Annual 2026' : season,
          investmentType: invType,
          title: invTitle,
          capitalAmount: Number(invAmount),
          tenureYears: Number(invTenure) || 1,
          interestRateAnnual: Number(invInterest) || 0,
          expectedRevenue: Number(invExpectedRev) || 0,
          fundingSource: invFunding
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowInvestmentModal(false);
        setInvTitle('');
        setInvAmount('');
        setInvExpectedRev('');
        fetchFinanceData();
      } else {
        alert(data.error || 'Failed to record investment');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording capital investment');
    } finally {
      setSubmittingInvestment(false);
    }
  };

  const handleDeleteRecord = async (id: string, type: 'expense' | 'investment') => {
    if (!confirm(`Are you sure you want to delete this ${type} record?`)) return;
    try {
      const res = await fetch(`/api/farmer/finance?id=${id}&type=${type}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFinanceData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seed': return '';
      case 'fertilizer': return '';
      case 'diesel_fuel': return '';
      case 'labour': return '';
      case 'irrigation_electricity': return '';
      case 'machinery_rent': return '';
      case 'pesticides': return '️';
      case 'transportation': return '';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-bold text-[#166534] uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Module 10: Farm Financial Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1f3b2c] tracking-tight mt-1">
            Farm Financials, Expenses & P&L Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track seed, fertilizer, diesel, labour and irrigation costs, calculate crop-level ROI, and export certified balance sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Season Filter Dropdown */}
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#166534] focus:outline-none"
          >
            <option value="All Seasons">All Seasons (Consolidated)</option>
            <option value="Kharif 2026">Kharif 2026</option>
            <option value="Rabi 2026">Rabi 2026</option>
            <option value="Zaid 2026">Zaid 2026</option>
            <option value="Annual 2026">Annual 2026</option>
          </select>

          {/* PDF Export Button */}
          <button
            onClick={() => {
              if (summary) {
                exportSeasonalFinancialReportPDF(summary, 'Farmer Owner', expenses, investments);
              }
            }}
            disabled={!summary || loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#166534]" />
            <span>Export Balance Sheet (PDF)</span>
          </button>

          {/* Add Action Buttons */}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>

          <button
            onClick={() => setShowInvestmentModal(true)}
            className="px-3.5 py-2 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Capital</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/70">
        {[
          { id: 'pnl', label: 'Profit & Loss (P&L)', icon: DollarSign },
          { id: 'expenses', label: 'Expense Tracking', count: expenses.length, icon: Layers },
          { id: 'investments', label: 'Capital & Investment Ledger', count: investments.length, icon: TrendingUp },
          { id: 'roi', label: 'Per-Acre & Crop ROI', icon: BarChart2 },
          { id: 'reports', label: 'Seasonal Balance Sheets', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active 
                  ? 'bg-white text-[#166534]  border border-slate-200/60' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#166534]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${active ? 'bg-emerald-50 text-[#166534]' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Key Metric Strip Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Revenue Card */}
          <div className="p-4.5 from-emerald-50/70 to-white border border-emerald-100 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Gross Farm Revenue</span>
              <ArrowUpRight className="w-4 h-4 text-[#166534]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#166534]">
              ₹{summary.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              ₹{Math.round(summary.revenuePerAcre).toLocaleString('en-IN')} / Acre ({summary.totalAcreage} acres total)
            </div>
          </div>

          {/* Operating Costs Card */}
          <div className="p-4.5 from-rose-50/70 to-white border border-rose-100 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Operating Expenses</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              ₹{Math.round(summary.costPerAcre).toLocaleString('en-IN')} / Acre operating cost
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="p-4.5 from-teal-50/70 to-white border border-teal-100 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Net Profit (P&L)</span>
              <span className={`text-xs font-bold px-2 py-0.2 rounded-full ${summary.netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {summary.profitMarginPercentage.toFixed(1)}% Margin
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black ${summary.netProfit >= 0 ? 'text-[#166534]' : 'text-rose-600'}`}>
              ₹{summary.netProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              ₹{Math.round(summary.profitPerAcre).toLocaleString('en-IN')} / Acre net realization
            </div>
          </div>

          {/* Capital & ROI Card */}
          <div className="p-4.5 from-indigo-50/70 to-white border border-indigo-100 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Return on Investment</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700">
              {summary.roiPercentage.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Capital Invested: ₹{summary.totalInvestments.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 1: PROFIT & LOSS (P&L) ─────────────────── */}
      {activeTab === 'pnl' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Area: Complete P&L Statement */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1f3b2c]">
                  Farm-Level Income Statement (P&L)
                </h3>
                <p className="text-xs text-slate-500">{season} · Revenue minus direct operational outflows</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Audited Statements
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Revenue Section */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100">
                <div className="flex justify-between font-bold text-slate-800 font-sans">
                  <span>A. REVENUE INFLOWS</span>
                  <span className="text-emerald-700">₹{summary.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-4">
                  <span>Direct Produce Sales ({sales.length} transactions)</span>
                  <span>₹{sales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-4">
                  <span>Farm Pooling Settlements ({settlements.length} disbursements)</span>
                  <span>₹{(summary.totalRevenue - sales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Operating Expenses Section */}
              <div className="space-y-1.5 pb-3 border-b border-slate-100">
                <div className="flex justify-between font-bold text-slate-800 font-sans">
                  <span>B. OPERATIONAL EXPENDITURES (COGS)</span>
                  <span className="text-rose-600">-₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                {Object.entries(summary.expensesByCategory).map(([cat, data]: [string, any]) => {
                  if (data.totalAmount === 0) return null;
                  return (
                    <div key={cat} className="flex justify-between text-slate-500 pl-4">
                      <span className="capitalize">{getCategoryIcon(cat)} {cat.replace('_', ' ')}</span>
                      <span>-₹{data.totalAmount.toLocaleString('en-IN')} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>

              {/* Net Farm Operating Income */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-sm font-black text-slate-900 font-sans">
                  <span>NET OPERATING INCOME (EBITDA)</span>
                  <span className={summary.netProfit >= 0 ? 'text-[#166534]' : 'text-rose-600'}>
                    ₹{summary.netProfit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                  <span>Profit Margin on Sales:</span>
                  <span className="font-bold text-slate-800">{summary.profitMarginPercentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Capital ROI Efficiency:</span>
                  <span className="font-bold text-indigo-700">{summary.roiPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Area: Categorical Expense Doughnut / Distribution */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#166534]" /> Expense Composition
              </h3>
              <p className="text-xs text-slate-500">Breakdown of operational capital outflows</p>
            </div>

            <div className="space-y-3">
              {Object.entries(summary.expensesByCategory).map(([cat, data]: [string, any]) => {
                if (data.totalAmount === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="capitalize">{getCategoryIcon(cat)} {cat.replace('_', ' ')}</span>
                      <span>₹{data.totalAmount.toLocaleString('en-IN')} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          cat === 'seed' ? 'bg-emerald-500' :
                          cat === 'fertilizer' ? 'bg-blue-500' :
                          cat === 'diesel_fuel' ? 'bg-amber-500' :
                          cat === 'labour' ? 'bg-purple-500' :
                          cat === 'irrigation_electricity' ? 'bg-cyan-500' : 'bg-slate-400'
                        }`} 
                        style={{ width: `${Math.min(100, data.percentage)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────── TAB 2: EXPENSES ─────────────────── */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1f3b2c]">
                Logged Farming Expenses
              </h3>
              <p className="text-xs text-slate-500">Seed, fertilizer, diesel, labour, and irrigation costs</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Expense</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date & Crop</th>
                  <th className="py-3 px-4">Category & Item</th>
                  <th className="py-3 px-4">Quantity / Unit</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Payment & Vendor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                      <span>No farm expenses logged yet. Click &quot;Add New Expense&quot; above.</span>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-emerald-50/20 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{exp.cropName}</span>
                        <div className="text-[11px] text-slate-400">{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{getCategoryIcon(exp.category)}</span>
                          <span className="font-semibold text-slate-800">{exp.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{exp.category.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700">{exp.quantity} {exp.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-600">
                        ₹{exp.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                          {exp.paymentMode}
                        </span>
                        {exp.vendorName && <div className="text-[10px] text-slate-400 mt-0.5">{exp.vendorName}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRecord(exp._id, 'expense')}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 3: INVESTMENTS ─────────────────── */}
      {activeTab === 'investments' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1f3b2c]">
                Capital Asset & Investment Ledger
              </h3>
              <p className="text-xs text-slate-500">Irrigation infrastructure, machinery down payments, and bank loan capital</p>
            </div>
            <button
              onClick={() => setShowInvestmentModal(true)}
              className="px-3.5 py-2 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Capital Asset</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Asset / Investment Title</th>
                  <th className="py-3 px-4">Type & Funding Source</th>
                  <th className="py-3 px-4">Capital Amount</th>
                  <th className="py-3 px-4">Tenure & Interest</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                      <span>No capital investments recorded. Click &quot;Record Capital Asset&quot; to begin tracking long-term assets.</span>
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv._id} className="hover:bg-emerald-50/20 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {inv.title}
                        <div className="text-[10px] text-slate-400 font-normal">{inv.cropName} · {inv.season}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-slate-700">{inv.investmentType.replace('_', ' ')}</span>
                        {inv.fundingSource && <div className="text-[10px] text-slate-400">{inv.fundingSource}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-black text-indigo-700">
                        ₹{inv.capitalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {inv.tenureYears} yrs @ {inv.interestRateAnnual}% p.a.
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold uppercase">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRecord(inv._id, 'investment')}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 4: ROI PER ACRE & CROP ─────────────────── */}
      {activeTab === 'roi' && summary && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#166534]" /> Crop-Wise Financial Performance & Return on Investment (ROI)
              </h3>
              <p className="text-xs text-slate-500">Per-acre revenue density, operational expenditure, and net returns by crop</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.cropPerformance?.map((c: any) => (
                <div key={c.cropName} className="p-5 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{c.cropName}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      {c.roiPercentage.toFixed(1)}% ROI
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-200 py-2.5 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cultivated Area:</span>
                      <span className="font-bold text-slate-800">{c.acreage} Acres</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Revenue:</span>
                      <span className="font-bold text-emerald-700">₹{c.revenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Expenses:</span>
                      <span className="font-bold text-rose-600">₹{c.expenses.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Profit:</span>
                      <span className={`font-bold ${c.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        ₹{c.netProfit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Revenue per Acre: <strong className="text-slate-800 font-mono">₹{Math.round(c.revenuePerAcre).toLocaleString('en-IN')}</strong></span>
                    <span>Cost / Acre: <strong className="text-slate-800 font-mono">₹{Math.round(c.costPerAcre).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 5: BALANCE SHEETS & PDF EXPORT ─────────────────── */}
      {activeTab === 'reports' && summary && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-16 h-16 bg-emerald-50 text-[#166534] rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Export Certified Seasonal Balance Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Download an official PDF financial statement containing categorized expenditures, crop ROI rankings, and balance sheet assets suitable for bank credit reviews and KCC subsidies.
            </p>
          </div>

          <div className="max-w-xl mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Reporting Period:</span>
              <span className="font-bold text-slate-800">{season}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Harvest Revenue:</span>
              <span className="font-bold text-emerald-700">₹{summary.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Operational Outflow:</span>
              <span className="font-bold text-rose-600">₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-900 font-sans">
              <span>Net Profit Balance:</span>
              <span className={summary.netProfit >= 0 ? 'text-[#166534]' : 'text-rose-600'}>₹{summary.netProfit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => exportSeasonalFinancialReportPDF(summary, 'Farmer Owner', expenses, investments)}
            className="px-6 py-3 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-2xl transition inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download Statement PDF</span>
          </button>
        </div>
      )}

      {/* ─────────────────── EXPENSE MODAL ─────────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 space-y-4 animate-scaleUp">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#1f3b2c] flex items-center gap-1.5">
                 Log New Farm Operational Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Crop Type</label>
                  <input
                    type="text"
                    required
                    value={expenseCrop}
                    onChange={(e) => setExpenseCrop(e.target.value)}
                    placeholder="e.g. Arecanut, Paddy, Pepper"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold"
                  >
                    <option value="seed">Seed & Saplings</option>
                    <option value="fertilizer">Fertilizer & Nutrients</option>
                    <option value="diesel_fuel">Diesel & Tractor Fuel</option>
                    <option value="labour">Daily Farm Labour</option>
                    <option value="irrigation_electricity">Irrigation & Power</option>
                    <option value="machinery_rent">Machinery Rental</option>
                    <option value="pesticides">Pesticides & Spraying</option>
                    <option value="transportation">Transport & Logistics</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Expense Title / Description</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. NPK 19-19-19 (5 Bags), Tractor Weeding 4 Hours"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="₹ Amount"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={expenseQuantity}
                    onChange={(e) => setExpenseQuantity(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g. 5"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    value={expenseUnit}
                    onChange={(e) => setExpenseUnit(e.target.value)}
                    placeholder="Bags / Litres / Hours"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={expensePaymentMode}
                    onChange={(e) => setExpensePaymentMode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="kcc_loan">KCC Loan Account</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vendor / Mandi Dealer</label>
                  <input
                    type="text"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    placeholder="Dealer Name"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-xl font-bold"
                >
                  {submittingExpense ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── INVESTMENT MODAL ─────────────────── */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 space-y-4 animate-scaleUp">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#1f3b2c] flex items-center gap-1.5">
                 Record Capital Investment / Infrastructure
              </h3>
              <button onClick={() => setShowInvestmentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Crop / Enterprise</label>
                  <input
                    type="text"
                    required
                    value={invCrop}
                    onChange={(e) => setInvCrop(e.target.value)}
                    placeholder="e.g. Arecanut Plantation"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Investment Type</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold"
                  >
                    <option value="self_equity">Self Equity / Savings</option>
                    <option value="kcc_loan">KCC (Kisan Credit Card)</option>
                    <option value="bank_agri_loan">Bank Agri Term Loan</option>
                    <option value="government_subsidy">Govt Subsidy / NABARD</option>
                    <option value="private_partner">Private Capital Partner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Asset Title / Infrastructure Description</label>
                <input
                  type="text"
                  required
                  value={invTitle}
                  onChange={(e) => setInvTitle(e.target.value)}
                  placeholder="e.g. Borewell Drilling & Submersible Pump, Drip Line Network"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Capital Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="₹ Capital"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Expected Revenue (INR)</label>
                  <input
                    type="number"
                    value={invExpectedRev}
                    onChange={(e) => setInvExpectedRev(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="₹ Target Output"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Amortization Tenure (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={invTenure}
                    onChange={(e) => setInvTenure(parseFloat(e.target.value) || 1)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Funding Source Bank</label>
                  <input
                    type="text"
                    value={invFunding}
                    onChange={(e) => setInvFunding(e.target.value)}
                    placeholder="e.g. Canara Bank, SBI, Self"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvestmentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvestment}
                  className="px-4 py-2 bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl font-bold"
                >
                  {submittingInvestment ? 'Recording...' : 'Save Capital Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
