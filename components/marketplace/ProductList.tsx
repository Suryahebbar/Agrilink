"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';

interface ProductListProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  loading?: boolean;
}

export default function ProductList({ 
  products, 
  onAddToCart, 
  onAddToWishlist,
  loading = false 
}: ProductListProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64 w-full"></div>
            <div className="mt-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product._id} className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="relative aspect-square overflow-hidden">
            <Link href={`/dashboard/farmer/marketplace/products/${product._id}`}>
              <Image
                src={product.images?.[0]?.url || '/hero-bg.jpg'}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <button
              onClick={() => onAddToWishlist(product._id)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart 
                className={`w-5 h-5 ${product.isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                strokeWidth={1.5} 
              />
            </button>
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">Out of Stock</span>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 h-12">
              <Link href={`/dashboard/farmer/marketplace/products/${product._id}`} className="hover:text-blue-600">
                {product.name}
              </Link>
            </h3>
            
            <p className="text-sm text-gray-500 mb-2">
              {product.seller?.companyName || 'Unknown Seller'}
            </p>
            
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  ₹{product.price.toLocaleString()}
                </p>
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-xs text-gray-500 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </p>
                )}
              </div>
              
              <Button 
                size="sm" 
                onClick={() => onAddToCart(product._id)}
                disabled={product.stock <= 0}
                className="shrink-0"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
