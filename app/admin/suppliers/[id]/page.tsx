'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-client-auth';

interface Supplier {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    pincode?: string;
  } | string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
  products?: Array<{
    _id: string;
    name: string;
    price: number;
    stock: number;
  }>;
  orders?: Array<{
    _id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

interface Props {
  params: Promise<{ id: string }>;
}

function SupplierDetailPage({ params }: Props) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null);
  const [products, setProducts] = useState<Array<{
    _id: string;
    name: string;
    price: number;
    stockQuantity: number;
    status: string;
    sku: string;
  }>>([]);

  const formatAddress = (address: Supplier['address']) => {
    if (!address) return 'Not provided';
    
    // If address is a string, return it directly
    if (typeof address === 'string') return address;
    
    // If address is an object, format it
    if (typeof address === 'object') {
      const { street, city, state, country, zipCode, pincode } = address;
      const addressParts = [];
      
      if (street) addressParts.push(street);
      if (city) addressParts.push(city);
      if (state) addressParts.push(state);
      if (zipCode || pincode) addressParts.push(zipCode || pincode);
      if (country) addressParts.push(country);
      
      return addressParts.length > 0 ? addressParts.join(', ') : 'Not provided';
    }
    
    return 'Invalid address format';
  };

  const handleDocumentView = (docUrl: string) => {
    if (!docUrl) {
      console.error('No document URL provided');
      return;
    }
    
    // Validate URL format
    try {
      new URL(docUrl);
    } catch (error) {
      console.error('Invalid document URL:', docUrl);
      return;
    }
    
    // Check if it's a PDF
    const isPdf = docUrl.toLowerCase().includes('.pdf');
    
    if (isPdf) {
      // For PDFs, create multiple URL options for better compatibility
      let pdfUrl = docUrl;
      
      if (docUrl.includes('cloudinary')) {
        // Create a URL with proper PDF parameters
        const baseUrl = docUrl.split('?')[0]; // Remove existing parameters
        const cloudinaryParams = 'fl_attachment=false&fl_inline=true&f_pdf&w=800&h=600';
        pdfUrl = `${baseUrl}?${cloudinaryParams}`;
        
        console.log('PDF URL:', pdfUrl);
        
        // Try multiple approaches for PDF viewing
        const tryOpenPDF = () => {
          // Method 1: Try window.open
          const newWindow = window.open(pdfUrl, '_blank');
          if (newWindow && !newWindow.closed) {
            return true;
          }
          
          // Method 2: Try direct download
          const downloadUrl = `${baseUrl}?fl_attachment=true`;
          const downloadWindow = window.open(downloadUrl, '_blank');
          if (downloadWindow && !downloadWindow.closed) {
            return true;
          }
          
          // Method 3: Create temporary link
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          return true;
        };
        
        if (!tryOpenPDF()) {
          alert('Could not open PDF. Please check your browser settings and try again.');
        }
      } else {
        // For non-Cloudinary PDFs, open directly
        window.open(docUrl, '_blank');
      }
    } else {
      // For images and other files, ensure proper Cloudinary parameters
      let imageUrl = docUrl;
      if (docUrl.includes('cloudinary')) {
        const separator = docUrl.includes('?') ? '&' : '?';
        // Add parameters for better image quality and caching
        imageUrl = `${docUrl}${separator}q_auto&f_auto`;
      }
      
      // Open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handlePDFView = (docUrl: string, docType: string) => {
    console.log('Opening PDF URL:', docUrl);
    // Try multiple approaches to open PDF
    try {
      // Method 1: Direct window.open
      const newWindow = window.open(docUrl, '_blank', 'noopener,noreferrer');
      if (newWindow && !newWindow.closed) {
        console.log('PDF opened successfully');
        return;
      }
      
      // Method 2: Try with different parameters
      const urlWithParams = `${docUrl}?raw=1`;
      window.open(urlWithParams, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Could not open PDF. Please try downloading it instead.');
    }
  };

  const handlePDFDownload = (docUrl: string, docType: string) => {
    console.log('Downloading PDF URL:', docUrl);
    try {
      // Method 1: Create download link
      const link = document.createElement('a');
      link.href = docUrl;
      link.download = `${docType}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Method 2: If download doesn't work, open in new tab
      setTimeout(() => {
        window.open(docUrl, '_blank', 'noopener,noreferrer');
      }, 1000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to direct URL
      window.open(docUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDocumentVerification = async (docType: string, status: string, reason?: string) => {
    try {
      setVerifying(true);
      setVerifyingDoc(docType);
      const resolvedParams = await params;
      
      console.log('Verifying document:', { docType, status, reason });
      
      const response = await fetch(`/api/admin/suppliers/${resolvedParams.id}/documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ documentType: docType, status, rejectionReason: reason }),
      });

      console.log('Verification response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Verification result:', result);
        setDocuments(result.data);
        
        // Refresh supplier data to update verification status
        const supplierResponse = await fetch(`/api/admin/suppliers/${resolvedParams.id}`, {
          credentials: 'include'
        });
        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();
          setSupplier(supplierData.data || supplierData);
          console.log('Updated supplier data:', supplierData.data || supplierData);
        }
      } else {
        console.error('Verification failed with status:', response.status);
        console.error('Response headers:', response.headers);
        
        let errorData;
        try {
          const responseText = await response.text();
          console.error('Response text:', responseText);
          
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              errorData = { error: 'Invalid JSON response', details: responseText };
            }
          } else {
            errorData = { error: 'Empty response from server' };
          }
        } catch (textError) {
          console.error('Error reading response text:', textError);
          errorData = { error: 'Could not read server response' };
        }
        
        console.error('Final error data:', errorData);
        
        // Better error message display
        let errorMessage = 'Verification failed';
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.details) {
          errorMessage += ` (${errorData.details})`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Error updating document. Please try again.');
    } finally {
      setVerifying(false);
      setVerifyingDoc(null);
    }
  };

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        
        // Resolve params to get the ID
        const resolvedParams = await params;
        
        // Fetch supplier details
        const supplierResponse = await adminFetch(`/api/admin/suppliers/${resolvedParams.id}`);
        if (!supplierResponse.ok) {
          throw new Error('Failed to fetch supplier details');
        }
        const supplierData = await supplierResponse.json();
        setSupplier(supplierData.data || supplierData);

        // Fetch documents
        const documentsResponse = await adminFetch(`/api/admin/suppliers/${resolvedParams.id}/documents`);
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData);
        }

        // Fetch products
        const productsResponse = await adminFetch(`/api/admin/suppliers/${resolvedParams.id}/products`);
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.data || productsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        console.error('Error fetching supplier:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/admin/suppliers')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Supplier not found</p>
          <button
            onClick={() => router.push('/admin/suppliers')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/suppliers')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Suppliers
        </button>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{supplier.companyName || supplier.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{supplier.email}</p>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  supplier.verificationStatus === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : supplier.verificationStatus === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {supplier.verificationStatus === 'verified' ? 'Verified' : supplier.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Supplier Information</h3>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Company name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {supplier.companyName || 'Not provided'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {supplier.email}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatAddress(supplier.address)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Member since</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(supplier.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Documents Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Documents Verification</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review and verify supplier submitted documents
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {documents && documents.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(documents.data.documents).map(([docType, docData]: [string, any]) => {
                // Handle various document data structures
                let docUrl = '';
                if (typeof docData === 'string') {
                  docUrl = docData;
                } else if (docData && typeof docData === 'object') {
                  docUrl = docData.url || docData.secure_url || docData.public_id ?
                    `https://res.cloudinary.com/raw/upload/${docData.public_id}` : '';
                }

                // Fix PDF URLs to use raw/upload instead of image/upload
                if (docUrl && docUrl.includes('.pdf') && docUrl.includes('/image/upload/')) {
                  docUrl = docUrl.replace('/image/upload/', '/raw/upload/');
                }

                console.log('Document data:', { docType, docData, docUrl });

                return (
                  <div key={docType} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {docType.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>

                      {docUrl && (
                        <div className="space-y-3">
                          {docUrl.includes('.pdf') ? (
                            <div className="flex flex-col items-center space-y-2">
                              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePDFView(docUrl, docType)}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handlePDFDownload(docUrl, docType)}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <img
                                src={docUrl}
                                alt={`${docType} Document`}
                                className="w-full h-32 object-cover rounded"
                                onError={(e) => {
                                  console.error('Image error:', e);
                                }}
                              />
                              <button
                                onClick={() => handleDocumentView(docUrl)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                              >
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Products</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Products listed by this supplier
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                          </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{product.price?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 
                          product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">This supplier hasn't listed any products yet.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default SupplierDetailPage;
