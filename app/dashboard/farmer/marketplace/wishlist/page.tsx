"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Heart, X, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartWishlist } from '@/contexts/CartWishlistContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Product } from '@/types';

export default function WishlistPage() {
  const searchParams = useSearchParams();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToCart, toggleWishlist } = useCartWishlist();
  const { notify } = useNotification();

  // Helper function to build URLs with userId
  const buildUrl = (path: string) => {
    const userId = searchParams.get('userId');
    return userId ? `${path}?userId=${userId}` : path;
  };

  const loadWishlist = useCallback(async () => {
    try {
      const userId = searchParams.get('userId');
      if (!userId) {
        console.error('No userId provided');
        return;
      }
      
      const response = await fetch(`/api/marketplace/wishlist?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load wishlist');
      }
      const data = await response.json();
      // Ensure we're working with an array
      const items = Array.isArray(data.products) ? data.products : [];
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      notify('Failed to load wishlist', 'error');
      setWishlistItems([]); // Ensure it's always an array even on error
    } finally {
      setLoading(false);
    }
  }, [notify, setWishlistItems, searchParams]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    notify(`${product.name} added to cart`, 'success');
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const userId = searchParams.get('userId');
      if (!userId) {
        console.error('No userId provided');
        return;
      }
      
      const response = await fetch(`/api/marketplace/wishlist?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }
      
      // Update local state
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      notify('Item removed from wishlist', 'info');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      notify('Failed to remove from wishlist', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Wishlist
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href={buildUrl('/dashboard/farmer/marketplace')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
            <p className="mt-1 text-gray-500">Add items to your wishlist to save them for later.</p>
            <div className="mt-6">
              <Link
                href={buildUrl('/dashboard/farmer/marketplace')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {wishlistItems.map((item) => (
                <li key={item._id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-shrink-0">
                      <Image
                        className="w-32 h-32 object-cover rounded-md"
                        src={item.images?.[0]?.url || '/hero-bg.jpg'}
                        alt={item.images?.[0]?.alt || item.name}
                        width={128}
                        height={128}
                      />
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link href={`/dashboard/farmer/marketplace/products/${item._id}`}>
                            {item.name}
                          </Link>
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromWishlist(item._id)}
                          className="ml-auto p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-5 w-5" aria-hidden="true" />
                          <span className="sr-only">Remove from wishlist</span>
                        </button>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-500">
                        Sold by {item.seller?.companyName || 'Unknown Seller'}
                        {item.seller?.verificationStatus === 'verified' && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verified Seller
                          </span>
                        )}
                      </p>
                      
                      <div className="mt-2 flex items-center">
                        {item.rating !== undefined && item.rating !== null && (
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[0, 1, 2, 3, 4].map((rating) => (
                                <svg
                                  key={rating}
                                  className={`h-4 w-4 ${rating < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-1 text-sm text-gray-500">
                              {item.rating.toFixed(1)} ({item.reviewCount || 0} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-lg font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                          {item.discount && item.discount > 0 && (
                            <span className="ml-2 text-sm font-medium text-green-600">
                              {item.discount}% OFF
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ShoppingCart className="-ml-1 mr-2 h-5 w-5" />
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/farmer/marketplace/products/${item._id}`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
