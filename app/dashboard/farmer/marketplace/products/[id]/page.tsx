"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Package, User, Phone, Mail, MapPin } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string; alt?: string }[];
  category: string;
  seller: {
    _id: string;
    companyName: string;
    email?: string;
    phone?: string;
  };
  stock: number;
  tags?: string[];
  specifications?: Record<string, any>;
  shippingInfo?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  createdAt?: string;
  status?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/marketplace/products/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch product');
        }

        setProduct(data.product);
        if (data.product?.images?.length > 0) {
          setSelectedImage(0);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      // Get current user ID
      const authResponse = await fetch('/api/auth/me');
      let userId = null;
      if (authResponse.ok) {
        const authData = await authResponse.json();
        userId = authData.user?.id || authData.user?._id;
      }

      if (!userId) {
        // Redirect to login if not authenticated
        setToast({ message: 'Please login to add items to cart', type: 'error' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      console.log('Adding to cart with userId:', userId);

      const response = await fetch('/api/farmer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.images?.[0]?.url || '/hero-bg.jpg',
          sellerId: product.seller?._id,
          sellerName: product.seller?.companyName || 'Unknown Seller'
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        setQuantity(1);
        setToast({ message: `${product.name} added to cart`, type: 'success' });
        setTimeout(() => setToast(null), 2000);
      } else {
        console.error('Cart API error details:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(responseData.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToast({ message: 'Failed to add item to cart', type: 'error' });
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-600">{product.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4">
              {product.images?.length > 0 ? (
                <Image
                  src={product.images[selectedImage]?.url || '/hero-bg.jpg'}
                  alt={product.images[selectedImage]?.alt || product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-green-600' : 'border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            {/* Product Name and Price */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{product.price ? product.price.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {product.stock > 0 ? (
                  <span className="text-green-600 font-medium">
                    {product.stock} items in stock
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of stock</span>
                )}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5 inline mr-2" />
                  Add to Cart
                </button>
              </div>
              <div className="mt-2">
                <Link href={userId ? `/dashboard/farmer/marketplace/cart?userId=${userId}` : "/dashboard/farmer/marketplace/cart"} className="text-green-700 hover:text-green-800 text-sm font-medium">
                  View Cart
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Specifications</h2>
                <div className="bg-white rounded-lg border p-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-900 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            {product.shippingInfo && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Shipping Information</h2>
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Weight</span>
                    <span className="text-gray-900 font-medium">{product.shippingInfo.weight} kg</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Dimensions</span>
                    <span className="text-gray-900 font-medium">
                      {product.shippingInfo.dimensions.length} × {product.shippingInfo.dimensions.width} × {product.shippingInfo.dimensions.height} cm
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <div className="mt-12 bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {product.seller?.companyName || 'Unknown Seller'}
                </h3>
                <p className="text-sm text-gray-600">Seller</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">{product.seller?.email || 'Email not available'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{product.seller?.phone || 'Phone not available'}</span>
              </div>
            </div>
          </div>
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
