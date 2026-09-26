"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSupplierId } from '../layout';
import { withSupplierAuth } from '@/lib/supplier-auth';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Filter,
  Search,
  ArrowUpRight
} from 'lucide-react';

interface EarningsSummary {
  totalGrossSales: number;
  totalPlatformFees: number;
  totalNetEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  totalOrders: number;
  defaultCommissionRate: number;
}

interface Transaction {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  createdAt: string;
  grossAmount: number;
  feeRate: number;
  feeAmount: number;
  netAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: string;
}

export default function SellerEarningsPage() {
  const supplierId = useSupplierId();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!supplierId) return;
    loadEarnings();
  }, [supplierId]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/supplier/${supplierId}/earnings`, withSupplierAuth());
      if (!res.ok) {
        throw new Error('Failed to load earnings data');
      }
      const data = await res.json();
      setSummary(data.summary);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.customerCity.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && tx.paymentStatus === 'paid') ||
        (statusFilter === 'pending' && tx.paymentStatus === 'pending');

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Earnings & Revenue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your gross marketplace sales, platform commission deductions, and net payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export Statement
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Sales */}
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Sales</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">
              ₹{(summary?.totalGrossSales || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total revenue collected from buyers</p>
        </div>

        {/* Platform Fee (5%) */}
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">AgriLink Cut (5%)</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-amber-600">
              -₹{(summary?.totalPlatformFees || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Standard 5% platform commission</p>
        </div>

        {/* Net Seller Earnings */}
        <div className="bg-gradient-to-br from-emerald-900 to-green-800 text-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Net Take-Home</span>
            <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center backdrop-blur-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold">
              ₹{(summary?.totalNetEarnings || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-emerald-200 mt-1">95% of gross sales payable to you</p>
        </div>

        {/* Payout Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout Status</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Settled:</span>
              <span className="font-semibold text-emerald-700">₹{(summary?.paidEarnings || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Pending Settlement:</span>
              <span className="font-semibold text-amber-600">₹{(summary?.pendingEarnings || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Payouts processed weekly to linked UPI</p>
        </div>
      </div>

      {/* Monetization Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 space-y-1">
          <p className="font-semibold">Transparent Revenue Model</p>
          <p className="text-emerald-800">
            AgriLink retains a flat <strong>5% platform fee</strong> on completed order sales. This covers farmer payment gateways, order tracking synchronization, customer support, and buyer discovery. You keep <strong>95%</strong> of every order value.
          </p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Settled / Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5 text-right">Gross Total</th>
                <th className="px-6 py-3.5 text-right">Platform Fee (5%)</th>
                <th className="px-6 py-3.5 text-right">Net Earnings</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No order transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-xs">
                      {tx.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-medium text-gray-800">{tx.customerName}</span>
                      {tx.customerCity && (
                        <span className="block text-gray-400 text-[11px]">{tx.customerCity}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-right font-medium text-gray-800">
                      ₹{tx.grossAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-right font-medium text-amber-600">
                      -₹{tx.feeAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-right font-bold text-emerald-700">
                      ₹{tx.netAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          tx.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.paymentStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {tx.paymentStatus === 'paid' ? 'Settled' : tx.paymentStatus === 'pending' ? 'Pending' : tx.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredTransactions.length} of {transactions.length} total orders</span>
          <span className="font-mono">AgriLink Payouts Engine v1.0</span>
        </div>
      </div>
    </div>
  );
}
