'use client';

import { FiTrendingUp, FiTrendingDown, FiPackage, FiDollarSign } from 'react-icons/fi';

interface Product {
  id: string;
  _id?: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  stockQuantity?: number;
  avgPrice?: number;
  change?: number;
  price?: number;
}

interface TopProductsProps {
  products?: Product[];
}

export default function TopProducts({ products }: TopProductsProps) {
  // Only show products that exist in the database
  const displayProducts = (products || []).map((product) => ({
    id: product.id || product._id || '',
    name: product.name,
    category: product.category || 'Uncategorized',
    price: product.avgPrice || (product.sales > 0 ? (product.revenue / product.sales) : 0),
    sales: product.sales || 0,
    stock: product.stockQuantity || 0,
    change: product.change || 0,
    revenue: product.revenue || 0
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Top Selling Products</h2>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {displayProducts.map((product) => (
          <div key={product.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center text-gray-400">
              <FiPackage className="h-6 w-6" />
            </div>
            
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <div className="ml-2 flex-shrink-0 flex">
                  {product.change >= 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <FiTrendingUp className="mr-1 h-3 w-3" />
                      {product.change.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <FiTrendingDown className="mr-1 h-3 w-3" />
                      {Math.abs(product.change).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500">{product.category}</p>
                <p className="text-sm font-medium text-gray-900">
                  ₹{product.price ? product.price.toFixed(2) : 'N/A'}
                </p>
              </div>
              
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>₹{(product.price * product.sales).toLocaleString('en-IN')}</span>
                  <span>Stock: {product.stock} units</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${
                      product.stock < 50 ? 'bg-red-500' : 
                      product.stock < 100 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${product.stock > 0 ? Math.min(100, (product.stock / 250) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}