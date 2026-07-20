'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, ShoppingCart, Heart, Star, Loader2, Grid, List } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/marketplace/ProductCard';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; alt?: string }[];
  category: string;
  stock: number;
  rating?: number;
  reviews?: number;
  seller: {
    _id: string;
    companyName: string;
    verificationStatus?: 'verified' | 'pending' | 'unverified';
  };
  tags?: string[];
  status?: string;
  createdAt?: string;
}

export default function MarketplaceProductsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const userId = searchParams.get('userId');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'seeds', name: 'Seeds' },
    { id: 'fertilizers', name: 'Fertilizers' },
    { id: 'tools', name: 'Tools' },
    { id: 'irrigation', name: 'Irrigation' },
    { id: 'pesticides', name: 'Pesticides' },
    { id: 'machinery', name: 'Machinery' },
  ];

  useEffect(() => {
    fetchProducts();
    loadWishlist();
  }, [selectedCategory, searchQuery, sortBy]);

  const loadWishlist = async () => {
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
      
      // Extract product IDs from wishlist items
      const productIds = Array.isArray(data.products) ? data.products.map((p: any) => p._id) : [];
      setWishlist(productIds);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      let productsData = data.products || [];
      
      // Filter by category
      if (selectedCategory !== 'all') {
        productsData = productsData.filter((p: Product) => p.category === selectedCategory);
      }
      
      // Filter by search
      if (searchQuery) {
        productsData = productsData.filter((p: Product) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Sort products
      productsData.sort((a: Product, b: Product) => {
        switch (sortBy) {
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'newest':
          default:
            return 0; // In real app, sort by creation date
        }
      });
      
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    try {
      const userId = searchParams.get('userId');
      if (!userId) {
        console.error('No userId provided');
        return;
      }
      
      // Check if product is already in wishlist
      const isInWishlist = wishlist.includes(productId);
      
      if (isInWishlist) {
        // Remove from wishlist
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
        
        setWishlist(prev => prev.filter(id => id !== productId));
        setToast({ message: 'Removed from wishlist', type: 'success' });
      } else {
        // Add to wishlist
        const response = await fetch(`/api/marketplace/wishlist?userId=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to add to wishlist');
        }
        
        setWishlist(prev => [...prev, productId]);
        setToast({ message: 'Added to wishlist', type: 'success' });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      setToast({ message: 'Failed to update wishlist', type: 'error' });
    }
    
    setTimeout(() => setToast(null), 2000);
  };

  const handleAddToCart = (productId: string) => {
    // Hook up to cart API/localStorage as needed; show non-intrusive UI feedback
    setToast({ message: 'Added to cart', type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketplace Products</h1>
              <p className="text-gray-700">Browse our wide selection of agricultural products</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-700">{error}</p>
            <button onClick={fetchProducts} className="mt-4 text-green-700 hover:text-green-800">
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {products.map((product) => (
              <div key={product._id} className={viewMode === 'list' ? 'bg-white rounded-lg shadow p-4' : ''}>
                <ProductCard
                  product={product}
                  onView={() => {
                    const base = `/dashboard/farmer/marketplace/products/${product._id}`;
                    const url = userId ? `${base}?userId=${userId}` : base;
                    window.location.href = url;
                  }}
                  onAddToWishlist={() => toggleWishlist(product._id)}
                  onAddToCart={() => handleAddToCart(product._id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Summary */}
      {wishlist.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            <span className="text-sm font-medium text-gray-900">{wishlist.length} items in wishlist</span>
            <Link
              href={userId ? `/dashboard/farmer/marketplace/wishlist?userId=${userId}` : "/dashboard/farmer/marketplace/wishlist"}
              className="text-green-700 hover:text-green-800 text-sm font-medium"
            >
              View
            </Link>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
            <span className={`${toast.type === 'success' ? 'text-green-700' : 'text-red-700'} text-sm font-medium`}>
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
