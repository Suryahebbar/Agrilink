'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  FileText, 
  Eye, 
  Download, 
  Building, 
  CreditCard, 
  Package, 
  ShoppingBag, 
  ExternalLink,
  Check,
  X,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-client-auth';

interface StatutoryDoc {
  url?: string;
  status?: 'pending' | 'verified' | 'approved' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

interface Supplier {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  phone?: string;
  gstNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    zipCode?: string;
  } | string;
  businessDetails?: {
    businessType?: string;
    yearsInOperation?: string;
    productCategories?: string;
  };
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  documents?: {
    businessCertificate?: StatutoryDoc | string;
    tradeLicense?: StatutoryDoc | string;
    gstCertificate?: StatutoryDoc | string;
    fcoLicense?: StatutoryDoc | string;
    seedLicense?: StatutoryDoc | string;
    pesticideLicense?: StatutoryDoc | string;
    ownerIdProof?: StatutoryDoc | string;
    bankDetails?: StatutoryDoc | string;
  };
  compliance?: {
    gstinVerified: boolean;
    fcoAuthorized: boolean;
    seedsActAuthorized: boolean;
    bankKycCompleted: boolean;
    termsAccepted: boolean;
    termsVersion: string;
    termsAcceptedAt: string;
    statutoryWarranty: string;
  };
  stats?: {
    productsCount: number;
    activeProductsCount: number;
    totalRevenue: number;
    totalOrders: number;
  };
}

interface ProductItem {
  _id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
  description?: string;
}

interface OrderItem {
  _id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  totalAmount: number;
  platformFeeAmount?: number;
  sellerEarnings?: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function SupplierDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const supplierId = resolvedParams.id;
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'profile' | 'products' | 'orders'>('documents');

  // Modal State for Rejection / Suspension
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'reject_supplier' | 'suspend_supplier' | 'reject_doc'>('reject_supplier');
  const [targetDocType, setTargetDocType] = useState<string>('');
  const [reasonInput, setReasonInput] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  // Document preview modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);

      // 1. Fetch supplier details
      const supRes = await adminFetch(`/api/admin/suppliers/${supplierId}`);
      if (!supRes.ok) throw new Error('Failed to fetch supplier profile');
      const supJson = await supRes.json();
      setSupplier(supJson.data);

      // 2. Fetch products
      const prodRes = await adminFetch(`/api/admin/suppliers/${supplierId}/products`);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.data || []);
      }

      // 3. Fetch orders
      const ordRes = await adminFetch(`/api/admin/suppliers/${supplierId}/orders`);
      if (ordRes.ok) {
        const ordJson = await ordRes.json();
        setOrders(ordJson.data || []);
        setOrderSummary(ordJson.summary || null);
      }
    } catch (err) {
      console.error('Error loading supplier dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId]);

  // Overall status transitions
  const handleVerifySupplier = async () => {
    try {
      setActionProcessing(true);
      const res = await adminFetch(`/api/admin/suppliers/${supplierId}/verify`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Failed to verify supplier');
      await fetchSupplierData();
      alert('Supplier has been legally verified and activated for marketplace trading.');
    } catch (err) {
      alert(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDocumentAction = async (docType: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      setActionProcessing(true);
      const res = await adminFetch(`/api/admin/suppliers/${supplierId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docType,
          status,
          rejectionReason: reason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update document status');
      }

      await fetchSupplierData();
    } catch (err) {
      alert(`Document update error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionProcessing(false);
      setModalOpen(false);
      setReasonInput('');
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminFetch(`/api/admin/suppliers/${supplierId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          status: newStatus,
          complianceNote: `Compliance officer switched product to ${newStatus}`
        })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
    }
  };

  const submitModalAction = async () => {
    if (!reasonInput.trim()) {
      alert('Please enter a clear statutory reason for audit logging.');
      return;
    }

    try {
      setActionProcessing(true);
      if (modalMode === 'reject_doc') {
        await handleDocumentAction(targetDocType, 'rejected', reasonInput);
      } else if (modalMode === 'suspend_supplier') {
        const res = await adminFetch(`/api/admin/suppliers/${supplierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'suspended',
            suspensionReason: reasonInput,
            isActive: false
          })
        });
        if (!res.ok) throw new Error('Failed to suspend supplier');
        await fetchSupplierData();
        setModalOpen(false);
        setReasonInput('');
      } else if (modalMode === 'reject_supplier') {
        const res = await adminFetch(`/api/admin/suppliers/${supplierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'rejected',
            rejectionReason: reasonInput,
            isActive: false
          })
        });
        if (!res.ok) throw new Error('Failed to reject supplier');
        await fetchSupplierData();
        setModalOpen(false);
        setReasonInput('');
      }
    } catch (err) {
      alert(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Not provided';
    if (typeof address === 'string') return address;
    const parts = [address.street, address.city, address.state, address.pincode || address.zipCode, address.country];
    return parts.filter(Boolean).join(', ') || 'Not provided';
  };

  // Statutory Document Configuration List
  const statutoryDocSpecs = [
    {
      key: 'businessCertificate',
      title: 'Business Registration / Trade License',
      category: 'Corporate Identity',
      statutoryAct: 'Companies Act / Shops & Establishments Act',
      description: 'Certificate of Incorporation, Partnership Deed, or Local Municipal Trade License.'
    },
    {
      key: 'gstCertificate',
      title: 'GSTIN Registration Certificate',
      category: 'Tax Compliance',
      statutoryAct: 'Central Goods & Services Tax (CGST) Act 2017',
      description: 'Form GST REG-06 showing active GSTIN for agricultural input sales.'
    },
    {
      key: 'fcoLicense',
      title: 'Fertilizer Control Order (FCO) License',
      category: 'Agricultural Inputs',
      statutoryAct: 'Fertilizer Control Order 1985 & Essential Commodities Act',
      description: 'Authorization letter / license from Department of Agriculture for retail/wholesale fertilizer distribution.'
    },
    {
      key: 'seedLicense',
      title: 'Seed Dealer License & Insecticides Permit',
      category: 'Seed & Chemical Regulation',
      statutoryAct: 'Seeds Act 1966 & Insecticides Act 1968',
      description: 'Valid permit issued by the State Licensing Authority to trade certified seeds and crop protection chemicals.'
    },
    {
      key: 'ownerIdProof',
      title: 'Authorized Signatory Identity & PAN',
      category: 'Identity Verification (KYC)',
      statutoryAct: 'PMLA 2002 & Identity Regulations',
      description: 'PAN Card and Aadhaar/Passport of the managing director or authorized signatory.'
    },
    {
      key: 'bankDetails',
      title: 'Bank Account KYC & Cancelled Cheque',
      category: 'Financial Settlement',
      statutoryAct: 'RBI Electronic Settlement & Payout Norms',
      description: 'Commercial bank account proof with verified IFSC code and matching registered business legal name.'
    }
  ];

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A9B9A]"></div>
        <p className="mt-3 text-sm font-semibold text-gray-600">Loading supplier legal dossier...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-800">Supplier Not Found</h2>
        <p className="text-sm text-gray-500 mt-1">The requested supplier record could not be retrieved.</p>
        <button
          onClick={() => router.push('/admin/suppliers')}
          className="mt-4 px-4 py-2 bg-[#1A9B9A] text-white rounded-xl text-sm font-bold"
        >
          &larr; Back to Supplier Directory
        </button>
      </div>
    );
  }

  const isVerified = supplier.verificationStatus === 'verified';
  const isSuspended = supplier.isActive === false || (supplier as any).status === 'suspended';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <button
          onClick={() => router.push('/admin/suppliers')}
          className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-[#1A9B9A] mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Supplier Management
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-100 text-purple-700 font-bold text-xl shrink-0">
              <Building className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-[#232F3E]">
                  {supplier.companyName || supplier.name}
                </h1>
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <Ban className="h-3.5 w-3.5" /> Suspended
                  </span>
                ) : isVerified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5" /> Legally Verified & Authorized
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" /> Pending Legal Verification
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> {supplier.email}
                </span>
                {supplier.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" /> {supplier.phone}
                  </span>
                )}
                {supplier.gstNumber && supplier.gstNumber !== 'Not provided' && (
                  <span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    GSTIN: {supplier.gstNumber}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" /> Registered {new Date(supplier.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Legal Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isVerified && (
              <button
                onClick={handleVerifySupplier}
                disabled={actionProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" /> Legally Verify & Activate
              </button>
            )}

            {!isSuspended ? (
              <button
                onClick={() => {
                  setModalMode('suspend_supplier');
                  setModalOpen(true);
                }}
                disabled={actionProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <Ban className="h-4 w-4" /> Suspend
              </button>
            ) : (
              <button
                onClick={handleVerifySupplier}
                disabled={actionProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs hover:bg-emerald-200 transition-colors disabled:opacity-50"
              >
                Reactivate Supplier
              </button>
            )}

            {supplier.verificationStatus !== 'rejected' && (
              <button
                onClick={() => {
                  setModalMode('reject_supplier');
                  setModalOpen(true);
                }}
                disabled={actionProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'documents', label: 'Statutory & Legal Licenses', icon: ShieldCheck },
          { id: 'profile', label: 'Company & Compliance Profile', icon: Building },
          { id: 'products', label: `Catalog & Input Standards (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders & Tax Audit (${orders.length})`, icon: ShoppingBag },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-[#1A9B9A] text-white shadow-md shadow-[#1A9B9A]/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Statutory & Legal Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Legal Verification Mandate (FCO, Seeds Act & Insecticides Act)</p>
              <p className="mt-0.5 leading-relaxed text-blue-700">
                Administrators must verify each uploaded statutory license against state regulatory registries. When all required documents are verified, the supplier is granted authorized trading privileges on AgriLink.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statutoryDocSpecs.map((spec) => {
              const docEntry: any = (supplier.documents as any)?.[spec.key];
              let docUrl = '';
              let docStatus: 'pending' | 'verified' | 'rejected' | 'missing' = 'missing';
              let verifiedBy = '';
              let verifiedAt = '';
              let rejectionReason = '';

              if (typeof docEntry === 'string') {
                docUrl = docEntry;
                docStatus = docEntry ? 'pending' : 'missing';
              } else if (docEntry && typeof docEntry === 'object') {
                docUrl = docEntry.url || '';
                docStatus = docEntry.status === 'approved' ? 'verified' : (docEntry.status || (docUrl ? 'pending' : 'missing'));
                verifiedBy = docEntry.verifiedBy || '';
                verifiedAt = docEntry.verifiedAt ? new Date(docEntry.verifiedAt).toLocaleDateString() : '';
                rejectionReason = docEntry.rejectionReason || '';
              }

              return (
                <div 
                  key={spec.key}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A9B9A] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {spec.category}
                      </span>
                      {docStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Approved
                        </span>
                      ) : docStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <X className="h-3 w-3" /> Rejected
                        </span>
                      ) : docStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" /> Needs Review
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Not Provided
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm text-[#232F3E] leading-snug">{spec.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{spec.description}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-2 italic">Governed by: {spec.statutoryAct}</p>

                    {rejectionReason && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <span className="font-bold">Rejection reason:</span> {rejectionReason}
                      </div>
                    )}

                    {verifiedAt && (
                      <div className="mt-2 text-[11px] text-gray-500">
                        Verified on <span className="font-semibold">{verifiedAt}</span> {verifiedBy ? `by ${verifiedBy}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions & Viewer */}
                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                    {docUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <FileText className="h-4 w-4" /> View File <ExternalLink className="h-3 w-3" />
                        </a>

                        <a
                          href={docUrl}
                          download
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">No statutory file attached yet.</div>
                    )}

                    {/* Approve / Reject Controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDocumentAction(spec.key, 'verified')}
                        disabled={actionProcessing || docStatus === 'verified'}
                        className="flex-1 inline-flex justify-center items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setTargetDocType(spec.key);
                          setModalMode('reject_doc');
                          setModalOpen(true);
                        }}
                        disabled={actionProcessing}
                        className="inline-flex justify-center items-center gap-1 py-1.5 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition-colors disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Company & Compliance Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h3 className="font-extrabold text-base text-[#232F3E]">Statutory Business Credentials</h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Legal Entity Name</dt>
                <dd className="font-bold text-gray-900 text-sm mt-1">{supplier.companyName || supplier.name}</dd>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Registered GSTIN</dt>
                <dd className="font-mono font-bold text-blue-700 text-sm mt-1">{supplier.gstNumber || 'Not provided'}</dd>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Business Classification</dt>
                <dd className="font-bold text-gray-900 text-sm mt-1">{supplier.businessDetails?.businessType || 'Wholesale Agri Distributor'}</dd>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Operating Experience</dt>
                <dd className="font-bold text-gray-900 text-sm mt-1">{supplier.businessDetails?.yearsInOperation ? `${supplier.businessDetails.yearsInOperation} years` : 'Established Distributor'}</dd>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 sm:col-span-2">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Registered Physical Address</dt>
                <dd className="font-bold text-gray-900 text-sm mt-1 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  {formatAddress(supplier.address)}
                </dd>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 sm:col-span-2">
                <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Authorized Categories</dt>
                <dd className="font-semibold text-gray-800 text-xs mt-1">
                  {supplier.businessDetails?.productCategories || 'Seeds, Chemical Fertilizers, Organic Manures, Pesticides, Micro-Nutrients'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Legal Declarations & Warranty */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-[#232F3E]">Seller Legal Declarations</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Platform Seller Agreement
                </div>
                <p className="text-emerald-700 mt-1 text-[11px] leading-relaxed">
                  Version {supplier.compliance?.termsVersion || '2026.1'} digitally executed upon registration.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <div className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Statutory Input Warranty
                </div>
                <p className="text-teal-700 mt-1 text-[11px] leading-relaxed">
                  Legally bound to supply only genuine, non-expired, and non-banned agricultural inputs certified under the Fertilizer Control Order and Seeds Act.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="font-bold text-gray-700 text-[11px]">Jurisdiction & Governing Law</div>
                <p className="text-gray-500 mt-0.5 text-[11px]">
                  High Court of Karnataka, Bengaluru, India.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Products & Catalog Compliance */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#232F3E]">Supplier Agricultural Products</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review seed certificates, chemical classifications, and deactivate non-compliant agricultural inputs.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
              {products.length} Products Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Product Name & Category</th>
                  <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">SKU / Code</th>
                  <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Price</th>
                  <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Inventory Stock</th>
                  <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Compliance Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-bold text-gray-700 uppercase">Administrative Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      No products listed by this supplier.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-600">{p.sku}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">₹{p.price.toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          p.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            <CheckCircle className="h-3 w-3" /> Compliant & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                            <Ban className="h-3 w-3" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleProductStatus(p._id, p.status)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            p.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {p.status === 'active' ? 'Deactivate Listing' : 'Approve & Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Orders & Tax Settlement */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Gross Orders Volume</div>
              <div className="text-xl font-black text-gray-900 mt-1">₹{(orderSummary?.totalGross || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Platform Fee Commissions</div>
              <div className="text-xl font-black text-[#1A9B9A] mt-1">₹{(orderSummary?.totalPlatformFees || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Net Payable to Seller</div>
              <div className="text-xl font-black text-purple-700 mt-1">₹{(orderSummary?.totalSellerEarnings || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">Completed Orders</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{orderSummary?.paidOrdersCount || 0} / {orders.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#232F3E]">Fulfilled Orders & GST Invoices</h3>
              <span className="text-xs text-gray-400">Auditable for GST & Consumer Protection</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Order #</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Customer</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Total Amount</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Platform Fee</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Payment Status</th>
                    <th scope="col" className="px-4 py-3 text-left font-bold text-gray-700 uppercase">Fulfillment Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <ShoppingBag className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        No orders recorded for this supplier.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{o.orderNumber}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900">{o.customer?.name || 'Customer'}</div>
                          <div className="text-[11px] text-gray-500">{o.customer?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">₹{o.totalAmount?.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-gray-600">₹{(o.platformFeeAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.paymentStatus?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="capitalize font-semibold text-gray-700">{o.orderStatus || 'processing'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Reason Modal (for Rejection / Suspension) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <AlertCircle className="h-5 w-5" />
                {modalMode === 'reject_doc' && `Reject Document: ${targetDocType}`}
                {modalMode === 'suspend_supplier' && 'Suspend Supplier Account'}
                {modalMode === 'reject_supplier' && 'Reject Supplier Registration'}
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Please enter the statutory non-compliance grounds. This will be logged into the permanent administrative audit trail and communicated to the supplier.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Documented Reason</label>
              <textarea
                rows={4}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Expired FCO fertilizer dealer license; GSTIN certificate seal illegible; mismatch with registered entity..."
                className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-normal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitModalAction}
                disabled={actionProcessing || !reasonInput.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Confirm & Log Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
