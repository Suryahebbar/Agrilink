'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';
import ProductImages from './components/ProductImages';
import ProductDetails from './components/ProductDetails';
import FarmerInfo from './components/FarmerInfo';
import ProductActions from './components/ProductActions';

type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  status: ProductStatus;
  category: string;
  tags: string[];
  images: Array<{ url: string; alt?: string }>;
  stockQuantity: number;
  weight?: number;
  weightUnit?: string;
  createdAt: string;
  updatedAt: string;
  farmer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    verificationStatus: 'verified' | 'pending' | 'rejected';
    farmName?: string;
    registrationDate: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('admin-token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/admin/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleStatusUpdate = async (newStatus: ProductStatus, reason?: string) => {
    if (!product) return;

    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('admin-token');
      
      const response = await fetch(`/api/admin/products/${product._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(reason && { rejectionReason: reason })
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      toast.success(`Product ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating product status:', err);
      toast.error(`Failed to ${newStatus} product`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEdit = () => {
    if (product) {
      router.push(`/admin/products/${product._id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin-token');
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      router.push('/admin/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-600 mb-2" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-red-600 mb-2">Error loading product</h2>
          <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to products
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Product Images */}
          <div className="lg:col-span-2 space-y-6">
            <ProductImages 
              images={product.images} 
              productName={product.name} 
            />
            
            <ProductDetails product={product} />
          </div>

          {/* Right column - Actions and Farmer Info */}
          <div className="space-y-6">
            <ProductActions
              productId={product._id}
              currentStatus={product.status}
              onStatusChange={handleStatusUpdate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            
            {product.farmer && <FarmerInfo farmer={product.farmer} />}
          </div>
        </div>
      </div>
    </div>
  );
}
