"use client";

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, Filter } from 'lucide-react';

interface Review {
  _id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  sellerResponse?: {
    response: string;
    respondedAt: string;
  };
  createdAt: string;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: number[];
}

interface ReviewSectionProps {
  productId: string;
  userId?: string;
  canReview?: boolean;
  orderId?: string;
}

export default function ReviewSection({ productId, userId, canReview = false, orderId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, filter, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        productId,
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/marketplace/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews || []);
        setRatingStats(data.ratingStats);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userId || !orderId) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/marketplace/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          orderId,
          userId,
          userName: 'Current User', // This should come from user profile
          userEmail: 'user@example.com', // This should come from user profile
          ...reviewForm
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', comment: '', images: [] });
        fetchReviews(); // Refresh reviews
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/marketplace/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      fetchReviews(); // Refresh to update helpful count
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const renderStars = (rating: number, size = 'small') => {
    const starSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!ratingStats) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingStats.ratingDistribution[rating - 1];
          const percentage = ratingStats.totalReviews > 0 ? (count / ratingStats.totalReviews) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-3">{rating}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratingStats && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold">{ratingStats.averageRating}</span>
                <span className="text-gray-600">({ratingStats.totalReviews} reviews)</span>
              </div>
              {renderStars(Math.round(ratingStats.averageRating))}
            </div>
            <div>
              <h4 className="font-medium mb-3">Rating Distribution</h4>
              {renderRatingDistribution()}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {canReview && (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="btn-primary"
        >
          Write a Review
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewForm.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Share your experience with this product"
                maxLength={1000}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewForm.title.trim() || !reviewForm.comment.trim()}
                className="btn-primary"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.userName}</span>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h4 className="font-medium mb-2">{review.title}</h4>
            <p className="text-gray-700 mb-3">{review.comment}</p>

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}

            {review.sellerResponse && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                <div className="text-sm font-medium text-blue-800 mb-1">Seller Response</div>
                <p className="text-sm text-blue-700">{review.sellerResponse.response}</p>
                <div className="text-xs text-blue-600 mt-1">
                  {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button
                onClick={() => handleHelpful(review._id)}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpful})
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this product!
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
