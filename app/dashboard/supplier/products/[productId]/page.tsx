"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  reorderThreshold: number;
  tags: string[];
  specifications?: Record<string, unknown>;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  status: 'active' | 'inactive' | 'draft';
  images: { url: string; alt: string; position: number }[];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [supplierId, setSupplierId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    tags: '',
    price: '',
    stockQuantity: '',
    reorderThreshold: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    status: 'draft' as 'active' | 'inactive' | 'draft'
  });

  const categories = [
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'feed', label: 'Feed' },
    { value: 'other', label: 'Other' }
  ];

  const loadProduct = useCallback(async () => {
    try {
      // Get supplier ID first
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.supplier?._id || profileData.seller?._id || '';
          if (currentSupplierId) {
            setSupplierId(currentSupplierId);
          }
        } else {
          throw new Error('Failed to get supplier ID');
        }
      }

      const response = await fetch(`/api/supplier/${currentSupplierId}/products/${productId}`, withSupplierAuth());

      if (!response.ok) {
        throw new Error('Failed to load product');
      }

      const data = await response.json();
      const productData = data;
      
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        sku: productData.sku || '',
        category: productData.category || '',
        description: productData.description || '',
        tags: productData.tags?.join(', ') || '',
        price: productData.price?.toString() || '',
        stockQuantity: productData.stockQuantity?.toString() || '',
        reorderThreshold: productData.reorderThreshold?.toString() || '',
        weight: productData.dimensions?.weight?.toString() || '',
        dimensions: {
          length: productData.dimensions?.length?.toString() || '',
          width: productData.dimensions?.width?.toString() || '',
          height: productData.dimensions?.height?.toString() || ''
        },
        status: productData.status || 'draft'
      });
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId, supplierId]);

  useEffect(() => {
    loadProduct();
  }, [productId, loadProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Get supplier ID if not already available
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.supplier?._id || profileData.seller?._id || '';
        } else {
          throw new Error('Failed to get supplier ID');
        }
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        reorderThreshold: parseInt(formData.reorderThreshold),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        dimensions: {
          ...formData.dimensions,
          length: parseFloat(formData.dimensions.length) || undefined,
          width: parseFloat(formData.dimensions.width) || undefined,
          height: parseFloat(formData.dimensions.height) || undefined,
          weight: parseFloat(formData.weight) || undefined
        }
      };

      const response = await fetch(`/api/supplier/${currentSupplierId}/products/${productId}`, withSupplierAuth({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Product updated successfully!');
        // Redirect to products page after successful save
        setTimeout(() => {
          router.push('/dashboard/supplier/products');
        }, 1500); // Wait 1.5 seconds to show success message
      } else {
        setError(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Product not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Edit Product</h1>
          <p className="text-sm text-[#6b7280] mt-1">Update product information and inventory</p>
        </div>
        <Link
          href="/dashboard/supplier/products"
          className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-4 py-2 text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
        >
          Back to Products
        </Link>
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

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Product Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                SKU *
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                required
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-[#1f3b2c] mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="tags" className="block text-sm font-medium text-[#1f3b2c] mb-2">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              placeholder="organic, premium, bestseller (comma separated)"
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Price (₹) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Stock Quantity *
              </label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                required
                min="0"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="reorderThreshold" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Reorder Threshold *
              </label>
              <input
                id="reorderThreshold"
                name="reorderThreshold"
                type="number"
                required
                min="0"
                value={formData.reorderThreshold}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Specifications (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Weight (kg)
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                min="0"
                step="0.01"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="length" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Length (cm)
              </label>
              <input
                id="length"
                name="dimensions.length"
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.length}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="width" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Width (cm)
              </label>
              <input
                id="width"
                name="dimensions.width"
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.width}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                Height (cm)
              </label>
              <input
                id="height"
                name="dimensions.height"
                type="number"
                min="0"
                step="0.01"
                value={formData.dimensions.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/dashboard/supplier/products"
            className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-6 py-2 text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
