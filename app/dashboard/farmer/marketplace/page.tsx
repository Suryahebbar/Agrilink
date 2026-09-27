'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Search, X, Loader2, ChevronRight, Shield, Truck, RefreshCw, Tag, Sprout, Droplets, Wrench, Bug, Tractor, Wheat, Users } from '../../../../components/ui/icons';
import ProductCard from '@/components/marketplace/ProductCard';
import PoolFinanceBar from '@/components/marketplace/PoolFinanceBar';
import PoolPurchaseModal from '@/components/marketplace/PoolPurchaseModal';
import PoolOrdersManager from '@/components/marketplace/PoolOrdersManager';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useCartWishlist } from '@/contexts/CartWishlistContext';

// Define the Product type to match our API response
interface MarketplaceProduct extends Omit<Product, 'seller' | 'verificationStatus' | 'rating' | 'reviewCount' | 'stock' | 'description'> {
  seller: {
    _id: string;
    companyName: string;
    verificationStatus?: 'verified' | 'pending' | 'unverified';
  };
  isInWishlist?: boolean;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  description: string;
  isSponsored?: boolean;
}

// Category type
type Category = {
  id: string;
  name: string;
  image: string;
  count: number;
};

export default function MarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const userId = searchParams.get('userId');
  const { addToCart, toggleWishlist: contextToggleWishlist, isInWishlist } = useCartWishlist();
  
  // State management
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<MarketplaceProduct[]>([]);
  const [bestsellers, setBestsellers] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeView, setActiveView] = useState<'catalog' | 'pool-orders'>('catalog');
  const [poolModalProduct, setPoolModalProduct] = useState<any>(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    priceRange: [number, number];
    categories: string[];
    minRating: number;
  }>({
    priceRange: [0, 10000],
    categories: [],
    minRating: 0,
  });
  
  // Categories for the marketplace
  const categories = [
    { id: 'seeds', name: 'Seeds', icon: Sprout, count: 42, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'fertilizers', name: 'Fertilizers', icon: Droplets, count: 36, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'pesticides', name: 'Pesticides', icon: Bug, count: 23, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'tools', name: 'Tools', icon: Wrench, count: 28, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'equipment', name: 'Equipment', icon: Tractor, count: 18, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'feed', name: 'Cattle & Poultry Feed', icon: Wheat, count: 15, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  ];

  // Fetch products from API
  const fetchProducts = useCallback(async (type: 'all' | 'featured' | 'bestsellers' = 'all') => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    try {
      if (type === 'all') setLoading(true);
      
      let apiUrl = '/api/marketplace/products';
      const params = new URLSearchParams();
      
      if (type === 'featured') {
        params.set('featured', 'true');
        params.set('limit', '8');
      } else if (type === 'bestsellers') {
        params.set('sortBy', 'bestselling');
        params.set('limit', '8');
      } else {
        if (category) params.set('category', category);
      }
      
      apiUrl = `${apiUrl}?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const productsData = Array.isArray(data) ? data : (data.products || []);
        
        if (type === 'featured') {
          setFeaturedProducts(productsData);
        } else if (type === 'bestsellers') {
          setBestsellers(productsData);
        } else {
          setProducts(productsData);
        }
      }
    } catch (err) {
      console.error(`Error in fetchProducts (${type}):`, err);
    } finally {
      if (type === 'all') {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
  }, [category]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchProducts('all'),
          fetchProducts('featured'),
          fetchProducts('bestsellers')
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchProducts]);
  
  // Refetch when category changes
  useEffect(() => {
    if (category) {
      fetchProducts('all');
    }
  }, [category, fetchProducts]);

  // Handle adding/removing from wishlist
  const handleToggleWishlist = (productId: string) => {
    contextToggleWishlist(productId);
    const inWish = isInWishlist(productId);
    setToast({ 
      message: inWish ? 'Removed from wishlist' : 'Added to wishlist', 
      type: 'success' 
    });
    setTimeout(() => setToast(null), 2000);
  };

  // Handle adding to cart
  const handleAddToCart = async (product: MarketplaceProduct) => {
    try {
      addToCart(product as any, 1);
      setToast({ message: `Added "${product.name}" to cart`, type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setToast({ message: 'Failed to add product to cart', type: 'error' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  // Extract unique categories from products
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories);
  }, [products]);

  // Get price range for filters
  const priceRange = useMemo(() => {
    if (products.length === 0) return [0, 10000] as [number, number];
    
    const prices = products.map(p => p.price);
    return [
      Math.floor(Math.min(...prices) / 100) * 100,
      Math.ceil(Math.max(...prices) / 100) * 100
    ] as [number, number];
  }, [products]);

  // Handle filter changes with useCallback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: {
    priceRange: [number, number];
    categories: string[];
    minRating: number;
  }) => {
    setFilters(prevFilters => {
      // Only update if the filters have actually changed
      if (
        prevFilters.priceRange[0] === newFilters.priceRange[0] &&
        prevFilters.priceRange[1] === newFilters.priceRange[1] &&
        prevFilters.categories.length === newFilters.categories.length &&
        prevFilters.categories.every((val, index) => val === newFilters.categories[index]) &&
        prevFilters.minRating === newFilters.minRating
      ) {
        return prevFilters;
      }
      return newFilters;
    });
  }, []);

  // Search functionality is handled in the hero section's search bar

  // Handle navigation to category
  const navigateToCategory = (categoryId: string) => {
    const base = `/dashboard/farmer/marketplace?category=${categoryId}`;
    const url = userId ? `${base}&userId=${userId}` : base;
    router.push(url);
  };

  // Handle navigation to product details
  const navigateToProduct = (productId: string) => {
    const base = `/dashboard/farmer/marketplace/products/${productId}`;
    const url = userId ? `${base}?userId=${userId}` : base;
    router.push(url);
  };

  // Handle view all products
  const viewAllProducts = () => {
    const base = '/dashboard/farmer/marketplace/products';
    const url = userId ? `${base}?userId=${userId}` : base;
    router.push(url);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Cooperative Pool Finance Bar */}
      <div className="container mx-auto px-4 pt-6">
        <PoolFinanceBar 
          userId={userId} 
          onOpenPoolOrders={() => setActiveView('pool-orders')} 
        />

        {/* View Tabs */}
        <div className="flex items-center gap-3 border-b border-gray-200 mb-6 pb-2">
          <button
            onClick={() => setActiveView('catalog')}
            className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'catalog'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Marketplace Catalog
          </button>
          <button
            onClick={() => setActiveView('pool-orders')}
            className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeView === 'pool-orders'
                ? 'border-[#166534] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" /> Farm Pool Group Orders
          </button>
        </div>
      </div>

      {activeView === 'pool-orders' ? (
        <div className="container mx-auto px-4 pb-16">
          <PoolOrdersManager 
            userId={userId} 
            onOrderExecuted={() => {
              fetchProducts('all');
            }} 
          />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="bg-[#166534] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to AgriMarket</h1>
            <p className="text-xl mb-8">Your one-stop shop for all farming needs</p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full px-6 py-4 pr-12 rounded-full text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.currentTarget.value.trim();
                    if (query) {
                      const base = `/dashboard/farmer/marketplace/products?search=${encodeURIComponent(query)}`;
                      const url = userId ? `${base}&userId=${userId}` : base;
                      router.push(url);
                    }
                  }
                }}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const query = input.value.trim();
                  if (query) {
                    const base = `/dashboard/farmer/marketplace/products?search=${encodeURIComponent(query)}`;
                    const url = userId ? `${base}&userId=${userId}` : base;
                    router.push(url);
                  }
                }}
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-12 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Truck className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Fast Delivery</h3>
              <p className="text-gray-700">Quick and reliable delivery to your farm</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Shield className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Quality Products</h3>
              <p className="text-gray-700">Verified suppliers and products</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-50">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <RefreshCw className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Easy Returns</h3>
              <p className="text-gray-700">Hassle-free return policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Discovery */}
      <div className="py-10 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
              <p className="text-sm text-gray-600 mt-1">High-quality certified inputs from verified agricultural sellers</p>
            </div>
            <button 
              onClick={viewAllProducts}
              className="text-green-700 hover:text-green-800 font-medium text-sm flex items-center gap-1"
            >
              All Categories <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    const base = `/dashboard/farmer/marketplace/products?category=${cat.id}`;
                    const url = userId ? `${base}&userId=${userId}` : base;
                    router.push(url);
                  }}
                  className={`flex flex-col items-center p-5 rounded-xl border bg-white  transition-all text-center group cursor-pointer ${
                    category === cat.id ? 'ring-2 ring-green-600 border-green-600 ' : 'border-gray-200'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-3 group- transition-transform ${cat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{cat.count}+ Products</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Agricultural Inputs</h2>
              <p className="text-sm text-gray-600 mt-1">Handpicked top-grade seeds, fertilizers, and tools</p>
            </div>
            <button 
              onClick={viewAllProducts}
              className="text-green-600 hover:text-green-700 flex items-center"
            >
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          {loading && featuredProducts.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading featured products...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id}
                  product={{
                    ...product,
                    isInWishlist: isInWishlist(product._id)
                  }}
                  onView={() => navigateToProduct(product._id)}
                  onAddToWishlist={() => handleToggleWishlist(product._id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onBuyAsPool={() => {
                    setPoolModalProduct(product);
                    setIsPoolModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bestsellers */}
      <div className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bestsellers & High-Demand Stock</h2>
              <p className="text-sm text-gray-600 mt-1">Most popular farming inputs trusted by cooperative clusters</p>
            </div>
            <button 
              onClick={viewAllProducts}
              className="text-green-600 hover:text-green-700 flex items-center"
            >
              View all <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          {loading && bestsellers.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading bestsellers...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard 
                  key={product._id}
                  product={{
                    ...product,
                    isInWishlist: isInWishlist(product._id)
                  }}
                  onView={() => navigateToProduct(product._id)}
                  onAddToWishlist={() => handleToggleWishlist(product._id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onBuyAsPool={() => {
                    setPoolModalProduct(product);
                    setIsPoolModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-lg  border ${toast.type === 'success' ? 'bg-white border-green-200' : 'bg-white border-red-200'}`}>
            <span className={`${toast.type === 'success' ? 'text-green-700' : 'text-red-700'} text-sm font-medium`}>
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {poolModalProduct && (
        <PoolPurchaseModal
          isOpen={isPoolModalOpen}
          onClose={() => {
            setIsPoolModalOpen(false);
            setPoolModalProduct(null);
          }}
          product={poolModalProduct}
          userId={userId}
          onSuccess={(propId) => {
            setToast({
              message: 'Group purchase proposed! Notification sent to all pooled farmers.',
              type: 'success'
            });
            setActiveView('pool-orders');
          }}
        />
      )}
    </div>
  );
}
