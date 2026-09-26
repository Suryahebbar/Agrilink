'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Shield, CheckCircle, AlertTriangle, Clock, 
  FileText, Activity, DollarSign, ShoppingCart, 
  TrendingUp, Search, RefreshCw, ExternalLink, ArrowRight 
} from 'lucide-react';

type ScopeType = 'agreement' | 'contribution' | 'settlement' | 'crop_sale' | 'investment';

type UniversalVerifyResult = {
  success: boolean;
  scope?: ScopeType;
  recordId?: string;
  title?: string;
  verified: boolean | null;
  status: 'intact' | 'tampered' | 'not_sealed' | 'not_anchored' | null;
  storedHash?: string;
  recomputedHash?: string;
  blockchainMetadata?: {
    isAnchored?: boolean;
    blockNumber?: number;
    transactionHash?: string;
    timestamp?: string;
    version?: string;
    sealedAt?: string;
  };
  details?: Record<string, any>;
  message?: string;
  error?: string;
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as ScopeType) || 'agreement';
  const initialId = searchParams.get('id') || searchParams.get('poolId') || '';

  const [scope, setScope] = useState<ScopeType>(initialType);
  const [recordId, setRecordId] = useState<string>(initialId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UniversalVerifyResult | null>(null);

  const scopeTabs = [
    { id: 'agreement', label: 'Farm Agreements', icon: FileText, placeholder: 'Enter Agreement / Pool ID (e.g. 6a6572...)' },
    { id: 'contribution', label: 'Contribution Ledger', icon: Activity, placeholder: 'Enter Contribution Log ID (Labour/Machinery/Capital)' },
    { id: 'settlement', label: 'Profit Distributions', icon: DollarSign, placeholder: 'Enter Settlement Distribution ID' },
    { id: 'crop_sale', label: 'Crop Sales & Escrow', icon: ShoppingCart, placeholder: 'Enter Crop Sale Receipt ID' },
    { id: 'investment', label: 'Partner Investments', icon: TrendingUp, placeholder: 'Enter Capital Investment Record ID' },
  ];

  const handleVerify = async (typeToVerify = scope, idToVerify = recordId) => {
    const target = idToVerify.trim();
    if (!target) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/blockchain/verify-record?type=${typeToVerify}&id=${encodeURIComponent(target)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        verified: null,
        status: null,
        error: 'Network error — could not reach the decentralized verification node.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlId = searchParams.get('id') || searchParams.get('poolId');
    const urlType = (searchParams.get('type') as ScopeType) || 'agreement';
    if (urlId) {
      setRecordId(urlId);
      setScope(urlType);
      handleVerify(urlType, urlId);
    }
  }, []);

  const statusColor = () => {
    if (!result) return 'bg-slate-50 border-slate-200';
    if (result.status === 'intact') return 'bg-emerald-50/80 border-emerald-300';
    if (result.status === 'tampered') return 'bg-rose-50/80 border-rose-300';
    if (result.status === 'not_sealed' || result.status === 'not_anchored') return 'bg-amber-50/80 border-amber-300';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-wider text-[#1A9B9A] font-mono">AGRILINK</span>
            <span className="text-slate-300 text-lg">|</span>
            <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Universal Blockchain Ledger Verifier</span>
          </div>
          <a
            href="/dashboard/farmer/pooling"
            className="text-xs font-bold text-[#1A9B9A] hover:underline flex items-center gap-1"
          >
            Farmer Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1 space-y-8 w-full">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 text-[#1A9B9A] rounded-3xl border border-teal-100 shadow-xs">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Universal Blockchain Ledger Verifier
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Cryptographically verify the authenticity and tamper-proof state of any 
            <strong> Farm Agreement, Contribution Entry, Profit Distribution, Crop Sale Receipt,</strong> or <strong>Capital Investment</strong>.
          </p>
        </div>

        {/* Scope Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/70">
          {scopeTabs.map((tab) => {
            const Icon = tab.icon;
            const active = scope === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setScope(tab.id as ScopeType);
                  setResult(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-[#1A9B9A] shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-[#1A9B9A]' : 'text-slate-400'}`} />
                <span className="text-[11px] leading-tight text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder={scopeTabs.find(t => t.id === scope)?.placeholder || 'Enter Record ID to verify...'}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-xs font-mono bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] transition-all"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={!recordId.trim() || loading}
              className="px-6 py-3 bg-[#1A9B9A] hover:bg-[#147878] text-white font-bold text-xs rounded-2xl shadow-xs hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying On-Chain…</>
              ) : (
                <><Shield className="w-4 h-4" /> Verify Cryptographic Proof</>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Deterministic SHA-256 Digest Re-computation</span>
            <span>Zero Knowledge Verification Standard</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
          </div>
        )}

        {/* Verification Result Card */}
        {result && !loading && (
          <div className={`border-2 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-all ${statusColor()}`}>
            
            {/* Header / Status Alert */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-2xl bg-white shadow-xs">
                  {result.status === 'intact' && <CheckCircle className="w-7 h-7 text-emerald-600" />}
                  {result.status === 'tampered' && <AlertTriangle className="w-7 h-7 text-rose-600" />}
                  {(result.status === 'not_sealed' || result.status === 'not_anchored') && <Clock className="w-7 h-7 text-amber-600" />}
                  {!result.success && <AlertTriangle className="w-7 h-7 text-slate-500" />}
                </div>
                <div>
                  <h3 className={`font-black text-base sm:text-lg ${
                    result.status === 'intact' ? 'text-emerald-900' :
                    result.status === 'tampered' ? 'text-rose-900' :
                    result.status === 'not_sealed' || result.status === 'not_anchored' ? 'text-amber-900' :
                    'text-slate-800'
                  }`}>
                    {result.status === 'intact' && '✓ Ledger Proof Verified — 100% Cryptographic Integrity'}
                    {result.status === 'tampered' && '⚠ Tamper Warning — Data Differs from Anchored Proof!'}
                    {(result.status === 'not_sealed' || result.status === 'not_anchored') && '⏳ Pending Blockchain Anchoring'}
                    {!result.success && 'Verification Query Error'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {result.title ? `${result.title} · ` : ''}
                    Scope: <span className="font-bold uppercase tracking-wider">{result.scope?.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              {result.blockchainMetadata?.blockNumber && (
                <span className="hidden sm:inline-block px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                  Block #{result.blockchainMetadata.blockNumber}
                </span>
              )}
            </div>

            {/* Hash Inspector Block */}
            {result.storedHash && (
              <div className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Immutable On-Chain Anchor Hash:
                  </span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                    {result.storedHash}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Re-computed Live Hash (from current Database snapshot):
                  </span>
                  <div className={`border rounded-xl p-3 font-mono text-[11px] break-all select-all font-semibold ${
                    result.verified
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50/80 border-rose-300 text-rose-800'
                  }`}>
                    {result.recomputedHash}
                  </div>
                </div>

                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  result.verified ? 'bg-emerald-100/70 text-emerald-900' : 'bg-rose-100/70 text-rose-900'
                }`}>
                  {result.verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      Hashes match exactly. No post-registration manipulation has occurred on this record.
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-700" />
                      Hash mismatch detected! The payload values in the database have been modified after blockchain recording.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Scope Details Grid */}
            {result.details && (
              <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  📋 Record Payload Snapshot
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  {Object.entries(result.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-slate-800 font-semibold">{typeof val === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('revenue') ? `₹${val.toLocaleString('en-IN')}` : String(val)}</span>
                    </div>
                  ))}
                </div>
                {result.blockchainMetadata?.transactionHash && (
                  <div className="pt-2 border-t border-slate-100 font-mono text-[10px]">
                    <span className="text-slate-400 block mb-0.5">Transaction Hash:</span>
                    <span className="text-slate-700 break-all select-all">{result.blockchainMetadata.transactionHash}</span>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default function UniversalVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#1A9B9A] mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Connecting to AgriLink Ledger node...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
