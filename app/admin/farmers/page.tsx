'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, X, Check, ChevronDown, CheckCircle, Download, MoreVertical } from 'lucide-react';
import { adminFetch } from '@/lib/admin-client-auth';

interface Farmer {
  _id: string;
  email: string;
  isVerified: boolean;
  phone?: string;
  createdAt: string;
}

interface Filters {
  search?: string;
  status?: 'all' | 'verified' | 'pending';
  sortBy?: 'newest' | 'oldest' | 'name';
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmers, setSelectedFarmers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkActionStatus, setBulkActionStatus] = useState<{
    success: number;
    failed: number;
    total: number;
  } | null>(null);
  const bulkActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    sortBy: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const router = useRouter();

  const fetchFarmers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        sortBy: filters.sortBy || 'newest',
      });

      const response = await adminFetch(`/api/admin/farmers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch farmers');
      }

      const data = await response.json();
      setFarmers(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
      
      // Reset select all when data changes
      setSelectAll(false);
      setSelectedFarmers(new Set());
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    const timer = setTimeout(() => {
      fetchFarmers();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [fetchFarmers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'newest',
    });
  };

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.sortBy !== 'newest';

  const handleVerify = async (farmerId: string) => {
    try {
      const response = await adminFetch(`/api/admin/farmers/${farmerId}/verify`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to verify farmer');
      }

      fetchFarmers();
      return true;
    } catch (error) {
      console.error('Error verifying farmer:', error);
      return false;
    }
  };

  const handleSelectFarmer = (farmerId: string) => {
    const newSelected = new Set(selectedFarmers);
    if (newSelected.has(farmerId)) {
      newSelected.delete(farmerId);
    } else {
      newSelected.add(farmerId);
    }
    setSelectedFarmers(newSelected);
    setSelectAll(newSelected.size === farmers.length);
  };

  const handleSelectAll = () => {
    if (selectAll || selectedFarmers.size > 0) {
      setSelectedFarmers(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(farmers.map(farmer => farmer._id));
      setSelectedFarmers(allIds);
      setSelectAll(true);
    }
  };

  const handleBulkAction = async (action: 'verify' | 'export') => {
    if (selectedFarmers.size === 0) return;

    setBulkAction(action);
    setIsProcessing(true);
    setBulkActionStatus(null);

    try {
      let success = 0;
      const total = selectedFarmers.size;
      const results = [];

      for (const farmerId of selectedFarmers) {
        if (action === 'verify') {
          const result = await handleVerify(farmerId);
          results.push(result);
          if (result) success++;
        }
        // Add more bulk actions here
      }

      setBulkActionStatus({
        success,
        failed: total - success,
        total
      });

      // Auto-hide status after 5 seconds
      if (bulkActionTimeoutRef.current) {
        clearTimeout(bulkActionTimeoutRef.current);
      }
      
      bulkActionTimeoutRef.current = setTimeout(() => {
        setBulkActionStatus(null);
      }, 5000);

      // Refresh data if needed
      if (action === 'verify') {
        fetchFarmers();
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    } finally {
      setIsProcessing(false);
      setBulkAction('');
    }
  };

  const exportToCSV = () => {
    if (selectedFarmers.size === 0) return;
    
    const selectedData = farmers.filter(farmer => selectedFarmers.has(farmer._id));
    
    // Create CSV content
    const headers = ['Email', 'Phone', 'Status', 'Joined At'];
    const rows = selectedData.map(farmer => ({
      email: `"${farmer.email}"`,
      phone: `"${farmer.phone || ''}"`,
      status: farmer.isVerified ? 'Verified' : 'Pending',
      joinedAt: new Date(farmer.createdAt).toLocaleDateString()
    }));
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => Object.values(row).join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farmers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Bulk action status */}
      {bulkActionStatus && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {bulkActionStatus.success} of {bulkActionStatus.total} farmers {bulkAction}ed successfully
                {bulkActionStatus.failed > 0 && `, ${bulkActionStatus.failed} failed`}.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setBulkActionStatus(null)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedFarmers.size > 0 && (
        <div className="mb-4 rounded-lg bg-indigo-50 p-4 shadow sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex sm:items-center">
            <div className="flex items-center">
              <div className="flex h-5 items-center">
                <input
                  id="select-all"
                  name="select-all"
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
                {selectedFarmers.size} selected
              </label>
            </div>
            
            <div className="mt-3 sm:ml-4 sm:mt-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Actions
                  <ChevronDown className="ml-2 -mr-1 h-4 w-4" aria-hidden="true" />
                </button>

                {showBulkActions && (
                  <div className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleBulkAction('verify');
                          setShowBulkActions(false);
                        }}
                        disabled={isProcessing}
                        className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <CheckCircle className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Verify Selected
                      </button>
                      <button
                        onClick={() => {
                          exportToCSV();
                          setShowBulkActions(false);
                        }}
                        className="flex w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Download className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Export to CSV
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={() => {
                setSelectedFarmers(new Set());
                setSelectAll(false);
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Farmers</h1>
        </div>
      </div>

      {/* Farmers table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                      />
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Joined At
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : farmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                        No farmers found
                      </td>
                    </tr>
                  ) : (
                    farmers.map((farmer) => (
                      <tr 
                        key={farmer._id} 
                        className={`${selectedFarmers.has(farmer._id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                          {selectedFarmers.has(farmer._id) && (
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                          )}
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            checked={selectedFarmers.has(farmer._id)}
                            onChange={() => handleSelectFarmer(farmer._id)}
                          />
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {farmer.email}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {farmer.phone || '-'}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              farmer.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {farmer.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {new Date(farmer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/admin/farmers/${farmer._id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            {!farmer.isVerified && (
                              <button
                                onClick={() => handleVerify(farmer._id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
                  }}
                  disabled={pagination.page <= 1}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
