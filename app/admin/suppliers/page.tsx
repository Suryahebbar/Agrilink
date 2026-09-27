'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  X, 
  Check, 
  ChevronDown, 
  CheckCircle, 
  Download, 
  MoreVertical,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Truck,
  Eye,
  Trash2,
  Ban,
  Building,
  CreditCard,
  Package
} from '../../../components/ui/icons';
import { adminFetch } from '@/lib/admin-client-auth';

interface Supplier {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  gstNumber?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  status?: string;
  isActive?: boolean;
  createdAt: string;
  productsCount?: number;
  totalRevenue?: number;
  documents?: {
    businessLicense?: string;
    gstCertificate?: string;
    fcoLicense?: string;
    seedLicense?: string;
    pesticideLicense?: string;
    ownerIdProof?: string;
    bankDetails?: string;
  };
}

interface Filters {
  search?: string;
  status?: 'all' | 'verified' | 'pending' | 'rejected' | 'suspended';
  sortBy?: 'newest' | 'oldest' | 'name' | 'company';
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    sortBy: 'newest',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const router = useRouter();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        sortBy: filters.sortBy || 'newest',
      });

      const response = await fetch(`/api/admin/suppliers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      const list = data.data || data.suppliers || [];
      setSuppliers(list);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || list.length,
        totalPages: data.pagination?.totalPages || 1,
      }));
      
      setSelectAll(false);
      setSelectedSuppliers(new Set());
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  const handleStatusUpdate = async (supplierId: string, action: 'verify' | 'suspend' | 'activate') => {
    try {
      setActionLoadingId(supplierId);
      const response = await adminFetch(`/api/admin/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} supplier`);
      }

      fetchSuppliers();
    } catch (error) {
      console.error(`Error updating supplier (${action}):`, error);
      alert(`Error updating supplier status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSupplier = async (supplierId: string, companyName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the supplier "${companyName}"? This will delete all their products and associated platform data.`)) {
      return;
    }
    try {
      setActionLoadingId(supplierId);
      const response = await adminFetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete supplier');
      }
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete supplier');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectSupplier = (supplierId: string) => {
    const newSelected = new Set(selectedSuppliers);
    if (newSelected.has(supplierId)) {
      newSelected.delete(supplierId);
    } else {
      newSelected.add(supplierId);
    }
    setSelectedSuppliers(newSelected);
    setSelectAll(newSelected.size === suppliers.length);
  };

  const handleSelectAll = () => {
    if (selectAll || selectedSuppliers.size > 0) {
      setSelectedSuppliers(new Set());
      setSelectAll(false);
    } else {
      setSelectedSuppliers(new Set(suppliers.map(s => s._id)));
      setSelectAll(true);
    }
  };

  const handleExportCSV = () => {
    if (suppliers.length === 0) return;
    const headers = ['Company Name', 'Email', 'Phone', 'GST Number', 'Legal Verification', 'Products', 'Revenue', 'Joined At'];
    const rows = suppliers.map(s => [
      `"${s.companyName || s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.gstNumber || 'N/A'}"`,
      `"${s.verificationStatus || 'pending'}"`,
      s.productsCount || 0,
      s.totalRevenue || 0,
      `"${new Date(s.createdAt).toLocaleDateString()}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `agrilink_suppliers_legal_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper badge for statutory document state
  const renderDocBadge = (status?: string, label?: string) => {
    if (status === 'approved' || status === 'verified') {
      return <span title={`${label}: Verified`} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800"> {label}</span>;
    }
    if (status === 'uploaded' || status === 'pending') {
      return <span title={`${label}: Pending Review`} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">⏳ {label}</span>;
    }
    if (status === 'rejected') {
      return <span title={`${label}: Rejected`} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800"> {label}</span>;
    }
    return <span title={`${label}: Not Uploaded`} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">- {label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#232F3E]">Supplier Legal Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Statutory licensing, GSTIN compliance, FCO/Seed oversight, and market authorizations.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 text-gray-500" />
            Export Legal Manifest
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Suppliers' },
              { id: 'verified', label: 'Verified & Authorized' },
              { id: 'pending', label: 'Pending Legal Review' },
              { id: 'suspended', label: 'Suspended' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilters(prev => ({ ...prev, status: tab.id as any }))}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filters.status === tab.id
                    ? 'bg-[#1A9B9A] text-white  shadow-[#1A9B9A]/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search company, GSTIN, email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-[#1A9B9A] focus:ring-[#1A9B9A]"
                  />
                </th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Supplier / Company
                </th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  GSTIN & Identity
                </th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Statutory Licenses
                </th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Catalog & Orders
                </th>
                <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3.5 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Compliance Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A9B9A]"></div>
                    <p className="mt-2 text-xs font-medium">Loading supplier compliance records...</p>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-semibold text-gray-700">No suppliers found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => {
                  const isSuspended = supplier.isActive === false || supplier.status === 'suspended';
                  const isVerified = supplier.verificationStatus === 'verified';
                  const isPending = supplier.verificationStatus === 'pending' || !supplier.verificationStatus;

                  return (
                    <tr 
                      key={supplier._id} 
                      className={`hover:bg-gray-50/70 transition-colors ${
                        selectedSuppliers.has(supplier._id) ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.has(supplier._id)}
                          onChange={() => handleSelectSupplier(supplier._id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#1A9B9A] focus:ring-[#1A9B9A]"
                        />
                      </td>

                      {/* Company Info */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <Link 
                            href={`/admin/suppliers/${supplier._id}`}
                            className="text-sm font-bold text-[#232F3E] hover:text-[#1A9B9A] transition-colors"
                          >
                            {supplier.companyName || supplier.name || 'Unnamed Supplier'}
                          </Link>
                          <div className="text-xs text-gray-500 mt-0.5">{supplier.email}</div>
                          {supplier.phone && <div className="text-[11px] text-gray-400">{supplier.phone}</div>}
                        </div>
                      </td>

                      {/* GSTIN / Tax */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          {supplier.gstNumber && supplier.gstNumber !== 'Not provided' ? (
                            <span className="font-mono font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                              {supplier.gstNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No GST registered</span>
                          )}
                          <div className="text-[11px] text-gray-400 mt-1">
                            Joined {new Date(supplier.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Statutory Document Badges */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {renderDocBadge(supplier.documents?.businessLicense, 'Trade License')}
                          {renderDocBadge(supplier.documents?.gstCertificate, 'GSTIN')}
                          {renderDocBadge(supplier.documents?.fcoLicense, 'FCO')}
                          {renderDocBadge(supplier.documents?.seedLicense, 'Seed/Pesticide')}
                          {renderDocBadge(supplier.documents?.bankDetails, 'Bank KYC')}
                        </div>
                      </td>

                      {/* Catalog & Sales */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span>{supplier.productsCount || 0} items</span>
                        </div>
                        <div className="font-semibold text-emerald-700 mt-0.5">
                          ₹{(supplier.totalRevenue || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <Ban className="h-3 w-3" /> Suspended
                          </span>
                        ) : isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3" /> Verified & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3" /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/suppliers/${supplier._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Dossier
                          </Link>

                          {!isVerified && (
                            <button
                              onClick={() => handleStatusUpdate(supplier._id, 'verify')}
                              disabled={actionLoadingId === supplier._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-colors disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}

                          {!isSuspended ? (
                            <button
                              onClick={() => handleStatusUpdate(supplier._id, 'suspend')}
                              disabled={actionLoadingId === supplier._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-800 transition-colors disabled:opacity-50"
                              title="Suspend for legal compliance check"
                            >
                              <Ban className="h-3.5 w-3.5" /> Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(supplier._id, 'activate')}
                              disabled={actionLoadingId === supplier._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSupplier(supplier._id, supplier.companyName || supplier.email)}
                            disabled={actionLoadingId === supplier._id}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Supplier"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{' '}
            <span className="font-bold text-gray-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-bold text-gray-800">{pagination.total}</span> suppliers
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-gray-700 bg-gray-100 rounded-xl">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
