'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from '../../components/ui/icons';

const COOKIE_CONSENT_KEY = 'agrilink_cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() }));
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() }));
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#1f3b2c] text-white border border-[#2d523e] rounded-2xl p-5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center text-emerald-300 flex-shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                We value your privacy
                <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
              </h3>
              <p className="text-xs text-emerald-200/80">Cookie Preferences</p>
            </div>
          </div>
          <button
            onClick={handleAcceptEssential}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Dismiss cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-200 leading-relaxed mb-4">
          AgriLink uses cookies and related technologies to provide secure authentication, ensure blockchain transaction integrity, and enhance your platform experience.{' '}
          <Link
            href="/privacy"
            className="text-emerald-300 underline font-medium hover:text-emerald-200"
          >
            Read our Privacy Policy
          </Link>
          .
        </p>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-all active:scale-95 text-center"
          >
            Accept All
          </button>
          <button
            onClick={handleAcceptEssential}
            className="flex-1 bg-[#2d523e]/70 hover:bg-[#2d523e] text-emerald-100 text-xs font-medium py-2.5 px-3.5 rounded-xl border border-emerald-700/50 transition-all active:scale-95 text-center"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
