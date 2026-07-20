'use client';

import { useState, useEffect } from 'react';

interface DeletionRequest {
  _id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
}

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deletion-requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch deletion requests');
      }
      
      const data = await response.json();
      setRequests(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching deletion requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeletion = async (requestId: string, supplierId: string) => {
    if (!confirm('Are you sure you want to approve this deletion request? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(requestId);
      
      const response = await fetch(`/api/admin/suppliers/${supplierId}/delete`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Update request status
        await fetch('/api/admin/deletion-requests/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId,
            status: 'approved',
            adminNote: 'Deletion approved and executed'
          })
        });
        
        // Refresh requests
        fetchRequests();
      } else {
        setError('Failed to approve deletion request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve deletion');
    } finally {
      setProcessing('');
    }
  };

  const handleRejectDeletion = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setProcessing(requestId);
      
      const response = await fetch('/api/admin/deletion-requests/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status: 'rejected',
          adminNote: reason
        })
      });

      if (response.ok) {
        fetchRequests();
      } else {
        setError('Failed to update deletion request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setProcessing('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between md:space-y-0 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Deletion Requests</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage supplier account deletion requests
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Pending Deletion Requests
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Suppliers requesting account deletion
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {requests.length === 0 ? (
              <p className="text-sm text-gray-500">No deletion requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.supplierName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.supplierEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDeletion(request._id, request.supplierId)}
                                  disabled={processing === request._id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processing === request._id ? '...' : 'Approve & Delete'}
                                </button>
                                <button
                                  onClick={() => handleRejectDeletion(request._id)}
                                  disabled={processing === request._id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                  {processing === request._id ? '...' : 'Reject'}
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <span className="text-green-600">Deletion completed</span>
                            )}
                            {request.status === 'rejected' && request.adminNote && (
                              <span className="text-red-600">Rejected: {request.adminNote}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
