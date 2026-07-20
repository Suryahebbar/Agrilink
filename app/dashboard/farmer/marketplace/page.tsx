'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Search, X, Loader2, ChevronRight, Shield, Truck, RefreshCw, Tag } from 'lucide-react';
import ProductCard from '@/components/marketplace/ProductCard';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';

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
  
  // State management
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<MarketplaceProduct[]>([]);
  const [bestsellers, setBestsellers] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
  const categories: Category[] = [
    { id: 'seeds', name: 'Seeds', image: '/images/categories/seeds.jpg', count: 42 },
    { id: 'fertilizers', name: 'Fertilizers', image: '/images/categories/fertilizers.jpg', count: 36 },
    { id: 'tools', name: 'Tools', image: '/images/categories/tools.jpg', count: 28 },
    { id: 'irrigation', name: 'Irrigation', image: '/images/categories/irrigation.jpg', count: 15 },
    { id: 'pesticides', name: 'Pesticides', image: '/images/categories/pesticides.jpg', count: 23 },
    { id: 'machinery', name: 'Machinery', image: '/images/categories/machinery.jpg', count: 17 },
  ];

  // Sample product data to use when API is not available
  const sampleProducts: MarketplaceProduct[] = [
    {
      _id: '1',
      name: 'Sample Product 1',
      description: 'This is a sample product',
      price: 999,
      originalPrice: 1299,
      images: [{ url: '/hero-bg.jpg' }],
      seller: {
        _id: 'seller1',
        companyName: 'Sample Seller',
        verificationStatus: 'verified'
      },
      category: 'seeds',
      stock: 10,
      rating: 4.5,
      reviewCount: 25,
      isInWishlist: false
    },
    {
      _id: '2',
      name: 'Sample Product 2',
      description: 'Another sample product',
      price: 1499,
      originalPrice: 1999,
      images: [{ url: '/hero-bg.jpg' }],
      seller: {
        _id: 'seller2',
        companyName: 'Another Seller',
        verificationStatus: 'verified' as const
      },
      category: 'tools',
      stock: 5,
      rating: 4.8,
      reviewCount: 42,
      isInWishlist: false
    }
  ];

  // Fetch products from API or use sample data
  const fetchProducts = useCallback(async (type: 'all' | 'featured' | 'bestsellers' = 'all') => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      if (type === 'all') setLoading(true);
      
      // In a real app, you would have different API endpoints for featured and bestsellers
      let apiUrl = '/api/marketplace/products';
      const params = new URLSearchParams();
      
      if (type === 'featured') {
        params.set('featured', 'true');
        params.set('limit', '4');
      } else if (type === 'bestsellers') {
        params.set('sortBy', 'bestselling');
        params.set('limit', '4');
      } else {
        if (category) params.set('category', category);
      }
      
      apiUrl = `${apiUrl}?${params.toString()}`;
      
      let productsData: MarketplaceProduct[] = [];
      let useSampleData = false;
      
      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          productsData = Array.isArray(data) ? data : (data.products || []);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (apiError) {
        console.error(`Error fetching ${type} products:`, apiError);
        useSampleData = true;
      }
      
      // Use sample data if API fails or returns no data
      if (useSampleData || productsData.length === 0) {
        console.log(`Using sample data for ${type}`);
        productsData = type === 'featured' 
          ? sampleProducts.slice(0, 4) 
          : type === 'bestsellers' 
            ? [...sampleProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4)
            : sampleProducts;
      }
      
      // Update the appropriate state based on the type
      if (type === 'featured') {
        setFeaturedProducts(productsData);
      } else if (type === 'bestsellers') {
        setBestsellers(productsData);
      } else {
        setProducts(productsData);
      }
      
    } catch (err) {
      console.error(`Error in fetchProducts (${type}):`, err);
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(`Failed to load ${type} products. Using sample data.`);
        if (type === 'all') setProducts(sampleProducts);
        else if (type === 'featured') setFeaturedProducts(sampleProducts.slice(0, 4));
        else if (type === 'bestsellers') setBestsellers([...sampleProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4));
      }
    } finally {
      if (type === 'all') {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [category]);

  // Load wishlist and initial data on mount
  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('marketplaceWishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
    
    // Fetch all necessary data
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
  
  // Fetch products when category changes
  useEffect(() => {
    if (category) {
      fetchProducts('all');
    }
  }, [category, fetchProducts]);

  // Handle adding/removing from wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newWishlist = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      localStorage.setItem('marketplaceWishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  // Handle adding to cart
  const handleAddToCart = async (productId: string) => {
    try {
      // In a real app, you would call your add to cart API here
      console.log('Adding to cart:', productId);
      // For now, show a non-intrusive toast
      setToast({ message: 'Added to cart', type: 'success' });
      setTimeout(() => setToast(null), 2000);
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to AgriMarket</h1>
            <p className="text-xl mb-8">Your one-stop shop for all farming needs</p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full px-6 py-4 pr-12 rounded-full text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

{/* Featured Products */}
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
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
                  product={product}
                  onView={() => navigateToProduct(product._id)}
                  onAddToWishlist={() => toggleWishlist(product._id)}
                  onAddToCart={() => handleAddToCart(product._id)}
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
            <h2 className="text-2xl font-bold text-gray-900">Bestsellers</h2>
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
                  product={product}
                  onView={() => navigateToProduct(product._id)}
                  onAddToWishlist={() => toggleWishlist(product._id)}
                  onAddToCart={() => handleAddToCart(product._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
