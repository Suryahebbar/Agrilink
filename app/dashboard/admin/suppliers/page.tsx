"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  gstNumber?: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  createdAt: string;
  productsCount?: number;
  totalRevenue?: number;
  documents?: {
    businessLicense?: string;
    gstCertificate?: string;
    bankDetails?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export default function AdminSuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        filter: filter
      });
      
      const response = await fetch(`/api/admin/suppliers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      } else {
        setError('Failed to load suppliers');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (supplierId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuppliers(suppliers.map(supplier => 
          supplier._id === supplierId ? { ...supplier, status: newStatus as any } : supplier
        ));
      }
    } catch (error) {
      console.error('Error updating supplier status:', error);
    }
  };

  const handleDocumentApproval = async (supplierId: string, documentType: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, status })
      });

      if (response.ok) {
        setSuppliers(suppliers.map(supplier => 
          supplier._id === supplierId 
            ? { 
                ...supplier, 
                documents: { 
                  ...(supplier.documents || {}), 
                  [documentType]: { 
                    ...((supplier.documents || {})[documentType as keyof typeof supplier.documents] as any), 
                    status 
                  } 
                } 
              } 
            : supplier
        ) as any);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || supplier.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading suppliers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Supplier Management</h1>
          <p className="text-sm text-gray-600 mt-1">Approve and manage supplier accounts</p>
        </div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Suppliers
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Suppliers</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                      {supplier.phone && <div className="text-sm text-gray-500">{supplier.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{supplier.companyName}</div>
                      {supplier.gstNumber && <div className="text-gray-500">GST: {supplier.gstNumber}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.status === 'active' ? 'bg-green-100 text-green-800' :
                      supplier.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      supplier.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {supplier.documents?.businessLicense && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">Business License:</span>
                          <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded ${
                            supplier.documents.businessLicense === 'approved' ? 'bg-green-100 text-green-800' :
                            supplier.documents.businessLicense === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {supplier.documents.businessLicense}
                          </span>
                          {supplier.documents.businessLicense === 'pending' && (
                            <button
                              onClick={() => handleDocumentApproval(supplier._id, 'businessLicense', 'approved')}
                              className="text-xs text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      )}
                      {supplier.documents?.gstCertificate && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">GST Certificate:</span>
                          <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded ${
                            supplier.documents.gstCertificate === 'approved' ? 'bg-green-100 text-green-800' :
                            supplier.documents.gstCertificate === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {supplier.documents.gstCertificate}
                          </span>
                          {supplier.documents.gstCertificate === 'pending' && (
                            <button
                              onClick={() => handleDocumentApproval(supplier._id, 'gstCertificate', 'approved')}
                              className="text-xs text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Products: {supplier.productsCount || 0}</div>
                      <div>Revenue: ₹{supplier.totalRevenue?.toLocaleString() || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(supplier.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {supplier.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(supplier._id, 'active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(supplier._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {supplier.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(supplier._id, 'suspended')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Suspend
                        </button>
                      )}
                      {supplier.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(supplier._id, 'active')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600">No suppliers found matching your criteria</div>
        </div>
      )}
    </div>
  );
}
