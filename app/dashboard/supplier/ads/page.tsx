"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSupplierId } from '../layout';
import { withSupplierAuth } from '@/lib/supplier-auth';
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShoppingBag
} from '../../../../components/ui/icons';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  images: { url: string; alt?: string }[];
}

interface SponsoredAdItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images?: { url: string }[];
  } | null;
  campaignType: 'farmer_dashboard_banner' | 'marketplace_featured';
  title: string;
  tagline?: string;
  imageUrl: string;
  status: 'active' | 'paused' | 'expired';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export default function SellerAdsPage() {
  const supplierId = useSupplierId();
  const [ads, setAds] = useState<SponsoredAdItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [campaignType, setCampaignType] = useState<'farmer_dashboard_banner' | 'marketplace_featured'>('farmer_dashboard_banner');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [budget, setBudget] = useState(500);

  useEffect(() => {
    if (!supplierId) return;
    loadData();
  }, [supplierId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch existing ads
      const adsRes = await fetch(`/api/ads?sellerId=${supplierId}`);
      if (adsRes.ok) {
        const data = await adsRes.json();
        setAds(data.ads || []);
      }

      // Fetch seller products
      const prodRes = await fetch(`/api/supplier/${supplierId}/products?status=active`, withSupplierAuth());
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error('Error loading ads data:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !title) {
      setError('Please select a product and enter a headline');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const chosenProd = products.find((p) => p._id === selectedProduct);
      const finalImage = customImage || chosenProd?.images?.[0]?.url || '';

      const res = await fetch('/api/ads', withSupplierAuth({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          campaignType,
          title,
          tagline,
          imageUrl: finalImage,
          budget: Number(budget),
        }),
      }));

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccess('Sponsored ad created and published live!');
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Error creating ad:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setTitle('');
    setTagline('');
    setCustomImage('');
    setBudget(500);
  };

  const selectedProductObj = useMemo(() => {
    return products.find((p) => p._id === selectedProduct);
  }, [products, selectedProduct]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Promotions & Sponsored Ads
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
               Boost Sales
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Display your products as featured banners on the Farmer Dashboard and pin them to the top of the Marketplace.
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setError('');
            setSuccess('');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition"
        >
          <Plus className="w-4 h-4" />
          Create Sponsored Ad
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-700" />
            Active Campaigns ({ads.length})
          </h2>
          <span className="text-xs text-gray-400">Real-time view & click tracking</span>
        </div>

        {ads.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <Megaphone className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">No campaigns running yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Reach thousands of verified farmers directly on their dashboard and maximize your product sales with sponsored placement.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Start Your First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Campaign & Product</th>
                  <th className="px-6 py-3.5">Placement</th>
                  <th className="px-6 py-3.5 text-center">Impressions</th>
                  <th className="px-6 py-3.5 text-center">Clicks</th>
                  <th className="px-6 py-3.5 text-center">CTR</th>
                  <th className="px-6 py-3.5 text-right">Budget Spent</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ads.map((ad) => {
                  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={ad._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0 border border-gray-200">
                            {ad.imageUrl ? (
                              <img
                                src={ad.imageUrl}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">{ad.title}</div>
                            {ad.tagline && <div className="text-[11px] text-gray-500">{ad.tagline}</div>}
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                              {ad.productId?.name || 'Linked Product'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {ad.campaignType === 'farmer_dashboard_banner'
                            ? 'Farmer Dashboard Banner'
                            : 'Marketplace Featured'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          <span>{ad.impressions.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-center font-medium text-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                          <span>{ad.clicks.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-center font-bold text-gray-900">
                        {ctr}%
                      </td>

                      <td className="px-6 py-4 text-xs text-right font-semibold text-gray-900">
                        ₹{ad.spent} / ₹{ad.budget}
                      </td>

                      <td className="px-6 py-4 text-xs text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            ad.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ad.status === 'active' ? '● Running' : ad.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Ad Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  
                </div>
                <h3 className="text-lg font-bold text-gray-900">New Sponsored Campaign</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-5">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Product to Promote *
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const prod = products.find((p) => p._id === e.target.value);
                    if (prod && !title) {
                      setTitle(`Special Offer: ${prod.name}`);
                    }
                  }}
                  required
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">-- Choose an active product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}  -  ₹{p.price} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Placement */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ad Placement Target *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      campaignType === 'farmer_dashboard_banner'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="campaignType"
                      checked={campaignType === 'farmer_dashboard_banner'}
                      onChange={() => setCampaignType('farmer_dashboard_banner')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-900">Farmer Dashboard Banner</span>
                      <span className="block text-[11px] text-gray-500 mt-0.5">
                        High visibility hero banner placed right on the farmer's dashboard.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      campaignType === 'marketplace_featured'
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="campaignType"
                      checked={campaignType === 'marketplace_featured'}
                      onChange={() => setCampaignType('marketplace_featured')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-900">Marketplace Featured</span>
                      <span className="block text-[11px] text-gray-500 mt-0.5">
                        Pinned to the top of category lists with a prominent "Sponsored" badge.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Promotional Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Premium Hybrid Cotton Seeds  -  20% Off"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={120}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Subtext / Offer Tagline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Certified germination rate 98% + Free Doorstep Delivery"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={200}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Custom Image URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Custom Banner / Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Leave empty to use product's default image"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Campaign Budget (₹)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Charged at standard ₹5 per verified farmer click until budget is reached.
                </p>
              </div>

              {/* Live Preview Card */}
              {title && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Live Farmer Preview
                  </span>
                  <div className="bg-[#166534] text-white p-4 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full mb-1">
                        Sponsored
                      </span>
                      <h4 className="font-bold text-sm text-white">{title}</h4>
                      {tagline && <p className="text-xs text-emerald-100 mt-0.5">{tagline}</p>}
                    </div>
                    {selectedProductObj?.price && (
                      <div className="text-right">
                        <span className="text-xs text-emerald-200 block">Offer Price</span>
                        <span className="text-lg font-bold text-white">₹{selectedProductObj.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition"
                >
                  {creating ? 'Publishing...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
