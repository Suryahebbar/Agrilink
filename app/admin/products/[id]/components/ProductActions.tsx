'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiEdit, FiArchive, FiTrash2, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

interface ProductActionsProps {
  productId: string;
  currentStatus: ProductStatus;
  onStatusChange: (newStatus: ProductStatus, reason?: string) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductActions({
  productId,
  currentStatus,
  onStatusChange,
  onEdit,
  onDelete,
}: ProductActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: ProductStatus) => {
    try {
      setIsLoading(true);
      if (newStatus === 'rejected' && !rejectionReason) {
        setShowRejectDialog(true);
        return;
      }
      
      if (newStatus === 'rejected') {
        await onStatusChange(newStatus, rejectionReason);
      } else {
        await onStatusChange(newStatus);
      }
      
      toast.success(`Product ${newStatus} successfully`);
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusActions = () => {
    switch (currentStatus) {
      case 'pending':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusUpdate('approved')}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <FiCheck className="mr-2" /> Approve
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <FiX className="mr-2" /> Reject
            </button>
          </div>
        );
      case 'approved':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiEdit className="mr-2" /> Edit
            </button>
            <button
              onClick={() => handleStatusUpdate('archived')}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              <FiArchive className="mr-2" /> Archive
            </button>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusUpdate('pending')}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <FiClock className="mr-2" /> Send for Review
            </button>
          </div>
        );
      default:
        return (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiEdit className="mr-2" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <FiTrash2 className="mr-2" /> Delete
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Product Actions</h3>
      <div className="space-y-4">
        {getStatusActions()}
        
        {showRejectDialog && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Reason for Rejection</h4>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Please specify the reason for rejection..."
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={!rejectionReason.trim() || isLoading}
                className={`px-4 py-2 text-white rounded-md ${
                  !rejectionReason.trim() || isLoading
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Submitting...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
