"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  stockQuantity: number;
  reorderThreshold: number;
  price: number;
  status: string;
}

interface InventoryLog {
  _id: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
  };
  change: number;
  reason: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [allProducts, setAllProducts] = useState<LowStockProduct[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateReason, setUpdateReason] = useState('manual');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');

  const loadInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
          setSupplierId(currentSupplierId);
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }

      // Get low stock products
      console.log('Fetching low stock products for supplier:', currentSupplierId);
      const lowStockResponse = await fetch(`/api/supplier/${currentSupplierId}/dashboard/low-stock`, withSupplierAuth());
      console.log('Low stock response status:', lowStockResponse.status);
      
      if (!lowStockResponse.ok) {
        const errorText = await lowStockResponse.text();
        console.error('Low stock API error response:', errorText);
        throw new Error(`Failed to load low stock products: ${lowStockResponse.status}`);
      }
      
      const lowStockData = await lowStockResponse.json().catch(() => ({}));
      setLowStockProducts((lowStockData as { products?: LowStockProduct[] }).products || []);

      // Get all active products for the dropdown
      console.log('Fetching products for supplier:', currentSupplierId);
      const productsResponse = await fetch(`/api/supplier/${currentSupplierId}/products?status=active`, withSupplierAuth());
      console.log('Products response status:', productsResponse.status);
      
      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        console.error('Products API error response:', errorText);
        throw new Error(`Failed to load products: ${productsResponse.status}`);
      }
      
      const productsData = await productsResponse.json().catch(() => ({}));
      console.log('Products data:', productsData);

      if (productsResponse.ok) {
        setAllProducts((productsData as { products?: LowStockProduct[] }).products || []);
      }

      // Get inventory logs
      console.log('Fetching inventory logs for supplier:', currentSupplierId);
      const logsResponse = await fetch(`/api/supplier/${currentSupplierId}/inventory/logs?limit=10`, withSupplierAuth());
      console.log('Logs response status:', logsResponse.status);
      
      if (!logsResponse.ok) {
        const errorText = await logsResponse.text();
        console.error('Logs API error response:', errorText);
        throw new Error(`Failed to load inventory logs: ${logsResponse.status}`);
      }
      
      const logsData = await logsResponse.json().catch(() => ({}));
      setInventoryLogs((logsData as { logs?: InventoryLog[] }).logs || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    void loadInventoryData();
  }, [loadInventoryData]);

  const filteredLowStockProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return lowStockProducts;
    }

    const term = searchTerm.trim().toLowerCase();
    return lowStockProducts.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [lowStockProducts, searchTerm]);

  const filteredAllProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return allProducts;
    }

    const term = searchTerm.trim().toLowerCase();
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [allProducts, searchTerm]);

  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProduct || !updateQuantity) {
      setError('Please select a product and enter quantity');
      return;
    }

    const parsedQuantity = Number(updateQuantity);

    if (Number.isNaN(parsedQuantity)) {
      setError('Quantity must be a valid number');
      return;
    }

    try {
      const currentSupplierId = supplierId || 'temp';
      console.log('Updating inventory for supplier:', currentSupplierId);
      console.log('Product ID:', selectedProduct);
      console.log('New quantity:', parsedQuantity);
      console.log('Reason:', updateReason);
      
      const response = await fetch(`/api/supplier/${currentSupplierId}/inventory/quick-update`, withSupplierAuth({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          quantity: parsedQuantity,
          reason: updateReason
        })
      }));

      console.log('Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update API error response:', errorText);
        setError(`Failed to update inventory: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('Update response data:', data);

      setSuccess('Inventory updated successfully!');
      setSelectedProduct('');
      setUpdateQuantity('');
      setUpdateReason('manual');
      await loadInventoryData(); // Reload data
    } catch (error) {
      console.error('Error updating inventory:', error);
      setError('Failed to update inventory');
    }
  };

  const getStockStatusColor = (stock: number, threshold: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock <= threshold) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'sale': return 'bg-blue-100 text-blue-800';
      case 'restock': return 'bg-green-100 text-green-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1f3b2c]">Inventory Management</h1>
        <p className="text-sm text-[#6b7280] mt-1">Monitor stock levels and manage inventory updates</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1f3b2c]">Low Stock Alerts</h2>
              <span className="text-sm text-[#6b7280]">
                {lowStockProducts.length} items need attention
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[#6b7280]">
                  <p className="text-lg font-medium">All stock levels healthy</p>
                  <p className="text-sm mt-1">No products are below reorder threshold</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLowStockProducts.map((product) => (
                  <div key={product._id} className="border border-[#e2d4b7] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-[#1f3b2c]">{product.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(product.stockQuantity, product.reorderThreshold)}`}>
                            {product.stockQuantity === 0 ? 'Out of Stock' : product.stockQuantity <= product.reorderThreshold ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-[#6b7280]">
                          <span>SKU: {product.sku}</span>
                          <span>Category: {product.category}</span>
                          <span>Price: ₹{product.price}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getStockStatusColor(product.stockQuantity, product.reorderThreshold).split(' ')[0]}`}>
                          {product.stockQuantity}
                        </div>
                        <div className="text-xs text-[#6b7280]">
                          Reorder at {product.reorderThreshold}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stock Update */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Quick Stock Update</h2>
            
            <form onSubmit={handleQuickUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Search Product
                </label>
                <input
                  type="text"
                  placeholder="Type product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                />
              </div>

              <div>
                <label htmlFor="selectedProduct" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Select Product
                </label>
                <select
                  id="selectedProduct"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                  required
                >
                  <option value="">Choose a product...</option>
                  {filteredAllProducts.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.sku}) - Current: {product.stockQuantity}
                    </option>
                  ))}
                </select>
                {searchTerm && filteredAllProducts.length === 0 && (
                  <p className="mt-2 text-xs text-[#6b7280]">
                    No active products match &quot;{searchTerm}&quot;.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="updateQuantity" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  New Quantity
                </label>
                <input
                  id="updateQuantity"
                  type="number"
                  min="0"
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                  placeholder="Enter new quantity"
                  required
                />
              </div>

              <div>
                <label htmlFor="updateReason" className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Update Reason
                </label>
                <select
                  id="updateReason"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e2d4b7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent placeholder-gray-600 text-gray-700"
                >
                  <option value="manual">Manual Update</option>
                  <option value="restock">Restock</option>
                  <option value="adjustment">Stock Adjustment</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1f3b2c] text-white py-2 px-4 rounded-md hover:bg-[#2d4f3c] focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:ring-offset-2 text-sm font-medium"
              >
                Update Stock
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inventory Activity Log */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c]">Recent Inventory Activity</h2>
          <Link
            href="/dashboard/supplier/inventory/logs"
            className="text-sm text-[#1f3b2c] hover:underline"
          >
            View all logs
          </Link>
        </div>

        {inventoryLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6b7280]">No recent inventory activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2d4b7]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Stock Before/After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e2d4b7]">
                {inventoryLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[#1f3b2c]">{log.productId.name}</div>
                        <div className="text-xs text-[#6b7280]">{log.productId.sku}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        log.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.change > 0 ? '+' : ''}{log.change}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(log.reason)}`}>
                        {log.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b7280]">
                      {log.previousStock} → {log.newStock}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b7280]">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
