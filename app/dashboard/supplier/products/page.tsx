"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  status: 'active' | 'inactive' | 'draft';
  images: { url: string; alt: string; position: number }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [taxInclusive, setTaxInclusive] = useState<boolean>(true);
  const [taxRate, setTaxRate] = useState<number>(0.18);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [supplierId, setSupplierId] = useState<string>('');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'feed', label: 'Feed' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' }
  ];

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Try both supplier and seller keys
          currentSupplierId = profileData.supplier?._id || profileData.seller?._id || '';
          if (!currentSupplierId) {
            console.error('No supplier ID found in profile:', profileData);
            throw new Error('Supplier ID not found in profile');
          }
          setSupplierId(currentSupplierId);
        } else {
          const errorData = await profileResponse.json().catch(() => ({}));
          console.error('Failed to get supplier profile:', errorData);
          throw new Error(errorData.error || 'Failed to get supplier profile');
        }
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus })
      });

      const response = await fetch(`/api/supplier/${currentSupplierId}/products?${params}`, withSupplierAuth());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Products API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();
      console.log('Products loaded:', data.products?.length || 0, 'products');
      setProducts(data.products || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus, supplierId]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Get supplierId if not already set
        let currentSupplierId = supplierId;
        if (!currentSupplierId) {
          const profileResponse = await fetch('/api/supplier', withSupplierAuth());
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // Try both supplier and seller keys
            currentSupplierId = profileData.supplier?._id || profileData.seller?._id || '';
            if (currentSupplierId) {
              setSupplierId(currentSupplierId);
            }
          }
        }
        
        if (currentSupplierId) {
          const settingsRes = await fetch(`/api/supplier/${currentSupplierId}/settings`, withSupplierAuth());
          if (settingsRes.ok) {
            const data = await settingsRes.json();
            if (data.settings) {
              setTaxInclusive(!!data.settings.taxInclusive);
              setTaxRate(typeof data.settings.taxRate === 'number' ? data.settings.taxRate : 0.18);
            }
          }
        }
        
        loadProducts();
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
      }
    };
    
    loadAll();
  }, [loadProducts, supplierId]);

  const formatPrice = (basePrice: number) => {
    const price = taxInclusive ? basePrice * (1 + taxRate) : basePrice;
    return price.toFixed(2);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/products/${productId}`, withSupplierAuth({
        method: 'DELETE'
      }));

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      await loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    try {
      const currentSupplierId = supplierId || 'temp';
      
      // Determine new status
      let newStatus: string;
      if (currentStatus === 'active') {
        newStatus = 'inactive';
      } else if (currentStatus === 'inactive') {
        newStatus = 'active';
      } else if (currentStatus === 'draft') {
        newStatus = 'active';
      } else {
        newStatus = 'active';
      }
      
      const response = await fetch(`/api/supplier/${currentSupplierId}/products/${productId}`, withSupplierAuth({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to toggle product status');
      }

      await loadProducts(); // Reload products
    } catch (error) {
      console.error('Error toggling product status:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle product status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockColor = (stock: number, threshold: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Products</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage your product catalog and inventory.</p>
        </div>
        <Link
          href="/dashboard/supplier/products/new"
          className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c]"
        >
          Add New Product
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              aria-label="Select product category"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6b7280] mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
              aria-label="Select product status"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStatus('');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm font-medium text-[#6b7280] bg-white border border-[#e2d4b7] rounded-md hover:bg-[#f9fafb]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2d4b7]">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e2d4b7]">
              {products?.map((product) => (
                <tr key={product._id} className="hover:bg-[#f9fafb]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[#1f3b2c]">
                        {product.name}
                      </div>
                      <div className="text-sm text-[#6b7280]">
                        {product.images.length > 0 ? `${product.images.length} images` : 'No images'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b7280]">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b7280]">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1f3b2c]">
                    ₹{product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getStockColor(product.stockQuantity, product.reorderThreshold)}`}>
                      {product.stockQuantity}
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      Reorder at {product.reorderThreshold}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/supplier/products/${product._id}`}
                        className="text-[#1f3b2c] hover:text-[#2d4f3c]"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(product._id, product.status)}
                        className="text-[#1f3b2c] hover:text-[#2d4f3c]"
                      >
                        {product.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-[#6b7280]">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Get started by adding your first product.</p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/supplier/products/new"
                className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c]"
              >
                Add New Product
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-[#e2d4b7] rounded-lg px-4 py-3">
          <div className="text-sm text-[#6b7280]">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-[#e2d4b7] rounded-md hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-[#6b7280]">
              Page {currentPage} of {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className="px-3 py-1 text-sm border border-[#e2d4b7] rounded-md hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
