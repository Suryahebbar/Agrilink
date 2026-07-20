"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Document {
  _id: string;
  documentType: 'businessLicense' | 'gstCertificate' | 'bankDetails' | 'identityProof';
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    role: 'supplier' | 'farmer';
    companyName?: string;
    farmName?: string;
  };
}

export default function AdminDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        filter: filter
      });
      
      const response = await fetch(`/api/admin/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        setError('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });

      if (response.ok) {
        setDocuments(documents.map(doc => 
          doc._id === documentId 
            ? { ...doc, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: reason }
            : doc
        ));
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || doc.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Approval</h1>
          <p className="text-sm text-gray-600 mt-1">Review and approve submitted documents</p>
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
              Search Documents
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by file name or submitter..."
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
              <option value="all">All Documents</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{doc.documentType}</div>
                      <div className="text-sm text-gray-500">{doc.fileName}</div>
                      <div className="text-xs text-gray-400">{(doc.fileSize / 1024).toFixed(2)} KB</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{doc.submittedBy.name}</div>
                      <div className="text-gray-500">{doc.submittedBy.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{doc.submittedBy.role}</div>
                      {doc.submittedBy.companyName && <div className="text-xs text-gray-400">{doc.submittedBy.companyName}</div>}
                      {doc.submittedBy.farmName && <div className="text-xs text-gray-400">{doc.submittedBy.farmName}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doc.status}
                    </span>
                    {doc.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {doc.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentAction(doc._id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please enter rejection reason:');
                            if (reason) handleDocumentAction(doc._id, 'reject', reason);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {doc.status === 'approved' && (
                      <button
                        onClick={() => handleDocumentAction(doc._id, 'reject', 'Revoked by admin')}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Revoke
                      </button>
                    )}
                    {doc.status === 'rejected' && (
                      <button
                        onClick={() => handleDocumentAction(doc._id, 'approve')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reconsider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600">No documents found matching your criteria</div>
        </div>
      )}
    </div>
  );
}
