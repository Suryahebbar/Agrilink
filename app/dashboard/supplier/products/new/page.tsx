"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { withSupplierAuth } from '@/lib/supplier-auth';

interface SellerProfile {
  documents?: {
    businessCertificate?: string;
    tradeLicense?: string;
    ownerIdProof?: string;
    gstCertificate?: string;
  };
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    sku: '',
    category: '',
    description: '',
    tags: '',
    
    // Pricing & Inventory
    price: '',
    stockQuantity: '',
    reorderThreshold: '',
    
    // Specifications
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    
    // Images
    images: [] as string[],
    imageFiles: [] as File[]
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }
    
    // Validate file size (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = validFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Each image must be smaller than 5MB');
      return;
    }
    
    // Create preview URLs
    const imageUrls = validFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
      imageFiles: [...prev.imageFiles, ...validFiles]
    }));
    
    setError('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      const newFiles = prev.imageFiles.filter((_, i) => i !== index);
      
      // Revoke object URL to avoid memory leaks
      if (prev.images[index]) {
        URL.revokeObjectURL(prev.images[index]);
      }
      
      return {
        ...prev,
        images: newImages,
        imageFiles: newFiles
      };
    });
  };

  // Load supplier profile to check verification/documents before allowing product creation
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError('');

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

        const response = await fetch(`/api/supplier/${currentSupplierId}/profile`, withSupplierAuth());

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || 'Failed to load profile');
        }

        const data = await response.json();
        setProfile(data.seller as SellerProfile);
      } catch (err) {
        console.error('Error loading supplier profile for product creation:', err);
        setProfileError('Failed to load supplier profile. Please try again.');
      } finally {
        setProfileLoading(false);
      }
    };

    void loadProfile();
  }, [supplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate at least one image is uploaded
    if (formData.images.length === 0) {
      setError('Please upload at least one product image');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formPayload = new FormData();
      
      // Add all form fields
      formPayload.append('name', formData.name);
      formPayload.append('sku', formData.sku);
      formPayload.append('category', formData.category);
      formPayload.append('description', formData.description);
      formPayload.append('price', formData.price);
      formPayload.append('stockQuantity', formData.stockQuantity);
      formPayload.append('reorderThreshold', formData.reorderThreshold);
      
      // Add tags as JSON string
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      formPayload.append('tags', JSON.stringify(tagsArray));
      
      // Add dimensions as JSON string
      const dimensionsData = {
        ...formData.dimensions,
        length: parseFloat(formData.dimensions.length) || undefined,
        width: parseFloat(formData.dimensions.width) || undefined,
        height: parseFloat(formData.dimensions.height) || undefined
      };
      formPayload.append('dimensions', JSON.stringify(dimensionsData));
      
      // Add image files
      formData.imageFiles.forEach((file, index) => {
        formPayload.append(`images`, file);
      });

      const currentSupplierId = supplierId || 'temp';
      const response = await fetch(`/api/supplier/${currentSupplierId}/products`, withSupplierAuth({
        method: 'POST',
        body: formPayload, // Send FormData instead of JSON
      }));

      const data = await response.json();

      if (response.ok) {
        setSuccess('Product created successfully!');
        setTimeout(() => {
          router.push('/dashboard/supplier/products');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const hasRequiredDocuments = Boolean(
    profile?.documents?.businessCertificate &&
    profile?.documents?.tradeLicense &&
    profile?.documents?.ownerIdProof
  );

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280]">Checking your account status...</div>
      </div>
    );
  }

  if (!hasRequiredDocuments) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6 max-w-2xl mx-auto mt-12 text-center">
          <h1 className="text-2xl font-semibold text-[#1f3b2c] mb-2">Complete Verification to Add Products</h1>
          <p className="text-sm text-[#6b7280] mb-4">
            You need to upload your business verification documents before you can add products to the marketplace.
          </p>
          {profileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{profileError}</p>
            </div>
          )}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <Link
              href="/dashboard/supplier/profile/verification"
              className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c]"
            >
              Complete Document Upload
            </Link>
            <Link
              href="/dashboard/supplier/profile"
              className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-6 py-2 text-sm font-medium text-[#1f3b2c] hover:bg-[#f9fafb]"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Add New Product</h1>
          <p className="text-sm text-[#6b7280] mt-1">Create a new product listing for your store</p>
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
                placeholder="Enter product name"
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
                placeholder="PROD-001"
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
              placeholder="Describe your product in detail..."
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-6">Product Images</h2>
          
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#e2d4b7] rounded-lg p-6 text-center hover:border-[#1f3b2c] transition-colors">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer inline-flex items-center space-x-2 text-[#1f3b2c] hover:text-[#2d4a3a]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Upload Images</span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                JPEG, PNG, WebP, or GIF (max 5MB per file)
              </p>
            </div>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-[#e2d4b7]"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index === 0 ? 'Primary' : `Image ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No images uploaded yet</p>
                <p className="text-sm">Upload at least one product image</p>
              </div>
            )}
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
                placeholder="0.00"
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
                placeholder="0"
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
                placeholder="5"
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
                placeholder="0.00"
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
                placeholder="0.00"
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
                placeholder="0.00"
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
                placeholder="0.00"
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
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-[#1f3b2c] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d4f3c] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
