"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface Review {
  _id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  sentiment: 'good' | 'moderate' | 'poor';
  isFlagged: boolean;
  sellerResponse?: {
    response: string;
    respondedBy?: string;
    respondedAt: string;
  };
  createdAt: string;
}

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');

  const tabs = useMemo(() => [
    { id: 'all', label: 'All Reviews', count: 0 },
    { id: 'good', label: 'Positive', count: 0 },
    { id: 'moderate', label: 'Neutral', count: 0 },
    { id: 'poor', label: 'Negative', count: 0 },
    { id: 'flagged', label: 'Flagged', count: 0 }
  ], []);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
          setSupplierId(currentSupplierId);
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }
      
      const params = new URLSearchParams({
        sentiment: activeTab === 'all' || activeTab === 'flagged' ? '' : activeTab,
        flagged: activeTab === 'flagged' ? 'true' : 'false',
        search: searchTerm
      });

      const response = await fetch(`/api/supplier/${currentSupplierId}/reviews?${params}`, withSupplierAuth());

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, supplierId]);

  useEffect(() => {
    loadReviews();
  }, [activeTab, searchTerm, loadReviews]);

  const handleResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/reviews/${reviewId}/respond`, withSupplierAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response: responseText })
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Response submitted successfully!');
        setResponseText('');
        setRespondingTo(null);
        await loadReviews(); // Reload reviews
      } else {
        setError(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit response');
    }
  };

  const handleFlag = async (reviewId: string, flagged: boolean) => {
    try {
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/reviews/${reviewId}/flag`, withSupplierAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flagged })
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Review ${flagged ? 'flagged' : 'unflagged'} successfully!`);
        await loadReviews(); // Reload reviews
      } else {
        setError(data.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setError('Failed to update review');
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Update tab counts
  useEffect(() => {
    tabs.forEach(tab => {
      if (tab.id === 'all') {
        tab.count = reviews.length;
      } else if (tab.id === 'flagged') {
        tab.count = reviews.filter(review => review.isFlagged).length;
      } else {
        tab.count = reviews.filter(review => review.sentiment === tab.id).length;
      }
    });
  }, [reviews, tabs]);

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1f3b2c]">Customer Reviews</h1>
        <p className="text-sm text-[#6b7280] mt-1">Manage customer feedback and respond to reviews</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg">
        <div className="border-b border-[#e2d4b7]">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-[#1f3b2c] text-[#1f3b2c]'
                    : 'border-transparent text-[#6b7280] hover:text-[#1f3b2c] hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#e2d4b7]">
          <input
            type="text"
            placeholder="Search reviews by customer name, product, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
          />
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-[#e2d4b7]">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[#6b7280]">
                <p className="text-lg font-medium">No reviews found</p>
                <p className="text-sm mt-1">
                  {activeTab === 'all' 
                    ? "You haven't received any customer reviews yet" 
                    : `No ${activeTab} reviews found`
                  }
                </p>
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Review Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-[#1f3b2c]">{review.customerName}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(review.sentiment)}`}>
                            {review.sentiment}
                          </span>
                          {review.isFlagged && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Flagged
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center">
                            {getRatingStars(review.rating)}
                            <span className="ml-2 text-sm text-[#6b7280]">{review.rating}.0</span>
                          </div>
                          <span className="text-sm text-[#6b7280]">{review.productName}</span>
                          <span className="text-sm text-[#6b7280]">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="mb-4">
                      <h4 className="font-medium text-[#1f3b2c] mb-2">{review.title}</h4>
                      <p className="text-[#6b7280]">{review.body}</p>
                    </div>

                    {/* Seller Response */}
                    {review.sellerResponse && (
                      <div className="bg-[#f9fafb] border border-[#e2d4b7] rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#1f3b2c]">Your Response</span>
                          <span className="text-xs text-[#6b7280]">
                            {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#6b7280]">{review.sellerResponse.response}</p>
                      </div>
                    )}

                    {/* Response Form */}
                    {respondingTo === review._id && (
                      <div className="border border-[#e2d4b7] rounded-lg p-4 mb-4">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response to this review..."
                          className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                          rows={3}
                        />
                        <div className="flex items-center justify-end space-x-2 mt-3">
                          <button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            className="px-3 py-1 text-sm border border-[#e2d4b7] rounded-md text-[#1f3b2c] hover:bg-[#f9fafb]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResponse(review._id)}
                            className="px-3 py-1 text-sm bg-[#1f3b2c] text-white rounded-md hover:bg-[#2d4f3c]"
                          >
                            Submit Response
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {!review.sellerResponse && respondingTo !== review._id && (
                        <button
                          onClick={() => setRespondingTo(review._id)}
                          className="text-sm text-[#1f3b2c] hover:underline"
                        >
                          Respond
                        </button>
                      )}
                      <button
                        onClick={() => handleFlag(review._id, !review.isFlagged)}
                        className="text-sm text-[#1f3b2c] hover:underline"
                      >
                        {review.isFlagged ? 'Unflag' : 'Flag'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
