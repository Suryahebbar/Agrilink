"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {  ArrowRight, ShieldCheck, Tag } from '../ui/icons';

interface Ad {
  _id: string;
  title: string;
  tagline?: string;
  imageUrl: string;
  targetUrl?: string;
  productId?: {
    _id: string;
    name: string;
    price: number;
    category: string;
  };
  sellerId?: {
    companyName: string;
    verificationStatus?: string;
  };
}

export default function SponsoredAdBanner({ userId }: { userId?: string | null }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads?placement=farmer_dashboard_banner');
        if (res.ok) {
          const data = await res.json();
          const activeAds = data.ads || [];
          setAds(activeAds);

          // Track impressions
          if (activeAds.length > 0) {
            void fetch('/api/ads', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adId: activeAds[0]._id, action: 'impression' }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to load sponsored ads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Auto-rotate ads every 6 seconds if multiple ads exist
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const handleAdClick = (adId: string) => {
    void fetch('/api/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId, action: 'click' }),
    }).catch(() => {});
  };

  const currentAd = ads[currentIndex];

  const buildMarketplaceUrl = (path: string) => {
    if (!userId) return path;
    const url = new URL(path, 'http://dummy');
    url.searchParams.set('userId', userId);
    return url.pathname + '?' + url.searchParams.toString();
  };

  if (loading) return null;

  if (!currentAd) {
    // Elegant fallback promotion banner
    return (
      <div className="mb-8 bg-[#166534] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-amber-950 mb-2">
              <Tag className="w-3 h-3" /> AgriLink Marketplace
            </span>
            <h3 className="text-xl font-bold text-white">Quality Seeds, Fertilizers & Farming Equipment</h3>
            <p className="text-sm text-green-100 mt-1 max-w-xl">
              Buy agricultural inputs directly from verified sellers with guaranteed doorstep delivery across Karnataka.
            </p>
          </div>
          <Link
            href={buildMarketplaceUrl('/dashboard/farmer/marketplace')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition whitespace-nowrap"
          >
            Explore Marketplace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const destinationUrl = currentAd.targetUrl || `/dashboard/farmer/marketplace/products/${currentAd.productId?._id}`;

  return (
    <div className="mb-8 bg-[#166534] rounded-2xl p-6 text-white relative overflow-hidden border border-emerald-500/30">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Ad Content */}
        <div className="flex items-center gap-5 flex-1">
          {currentAd.imageUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/10 p-1 flex-shrink-0 border border-white/20 overflow-hidden">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950">
                 Sponsored Deal
              </span>
              {currentAd.sellerId?.companyName && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  {currentAd.sellerId.companyName}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{currentAd.title}</h3>

            {currentAd.tagline && (
              <p className="text-xs sm:text-sm text-emerald-100">{currentAd.tagline}</p>
            )}

            {currentAd.productId && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm font-semibold text-white">
                  Special Price: ₹{currentAd.productId.price.toLocaleString('en-IN')}
                </span>
                {currentAd.productId.category && (
                  <span className="text-[11px] text-emerald-200 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
                    {currentAd.productId.category}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Link
            href={buildMarketplaceUrl(destinationUrl)}
            onClick={() => handleAdClick(currentAd._id)}
            className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition transform duration-150"
          >
            View Special Offer
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Pagination dots if multiple ads */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
