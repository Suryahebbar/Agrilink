'use client';

import { FiPackage, FiDollarSign, FiLayers, FiTag, FiCalendar, FiInfo, FiBox } from 'react-icons/fi';

type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

interface ProductDetailsProps {
  product: {
    name: string;
    sku: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    costPrice: number;
    status: ProductStatus;
    category: string;
    tags: string[];
    stockQuantity: number;
    weight?: number;
    weightUnit?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const getStatusBadge = (status: ProductStatus) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-gray-200 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusClasses[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-1 flex items-center">
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            <span className="mx-2 text-gray-300">•</span>
            {getStatusBadge(product.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiInfo className="mr-2 text-gray-500" />
            Product Information
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">
                {product.description || 'No description provided.'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1 text-sm text-gray-900 flex items-center">
                <FiTag className="mr-2 text-gray-400" />
                {product.category || 'Uncategorized'}
              </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDollarSign className="mr-2 text-gray-500" />
            Pricing & Inventory
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
              </div>
              {product.compareAtPrice && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Compare at price</h3>
                  <p className="mt-1 text-lg font-medium text-gray-400 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cost per item</h3>
                <p className="mt-1 text-sm text-gray-900">
                  ${product.costPrice?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Inventory</h3>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <FiPackage className="mr-2 text-gray-400" />
                    {product.stockQuantity} in stock
                  </p>
                </div>
                {product.status === 'approved' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FiCalendar className="mr-2 text-gray-500" />
          Additional Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(product.createdAt)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last updated</h3>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(product.updatedAt)}
            </p>
          </div>
          {(product.weight || product.weightUnit) && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Weight</h3>
              <p className="mt-1 text-sm text-gray-900 flex items-center">
                <FiBox className="mr-2 text-gray-400" />
                {product.weight} {product.weightUnit || 'g'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
