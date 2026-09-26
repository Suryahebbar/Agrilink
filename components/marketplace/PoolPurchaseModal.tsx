'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, X, Check, ShieldCheck, AlertCircle, 
  HelpCircle, ChevronRight, Loader2, Sparkles 
} from 'lucide-react';

interface PoolPurchaseModalProps {
  product: {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    price: number;
    images?: any[];
    image?: any;
    category?: string;
    unit?: string;
    sellerId?: string;
    sellerName?: string;
  };
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (proposalId: string) => void;
}

export default function PoolPurchaseModal({
  product,
  userId,
  isOpen,
  onClose,
  onSuccess
}: PoolPurchaseModalProps) {
  const [loadingPool, setLoadingPool] = useState(true);
  const [pool, setPool] = useState<any>(null);
  const [quantity, setQuantity] = useState(2);
  const [notes, setNotes] = useState('Collective input procurement for active pool parcel');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchPool = async () => {
      setLoadingPool(true);
      setError(null);
      try {
        const res = await fetch(`/api/marketplace/pool-proposals?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.pool) {
          setPool(data.pool);
          // Recommended quantity based on combined land extent
          const totalLand = data.pool.participants?.reduce(
            (s: number, p: any) => s + (Number(p.landContribution || p.landSize) || 1), 
            0
          ) || 1;
          setQuantity(Math.max(1, Math.round(totalLand * 2)));
        } else {
          setPool(null);
        }
      } catch (err: any) {
        console.error('Error fetching pool:', err);
        setError('Failed to load pool configuration.');
      } finally {
        setLoadingPool(false);
      }
    };

    fetchPool();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const productName = product.name || product.title || 'Agricultural Input';
  const unitPrice = Number(product.price) || 0;
  const totalAmount = unitPrice * quantity;

  // Calculate live splits
  const participants = pool?.participants || [];
  const totalLand = participants.reduce(
    (sum: number, p: any) => sum + (Number(p.landContribution || p.landSize) || 1), 
    0
  ) || 1;

  let allocated = 0;
  const splits = participants.map((p: any, idx: number) => {
    const land = Number(p.landContribution || p.landSize) || 1;
    const sharePct = Number(((land / totalLand) * 100).toFixed(1));
    let shareAmount = Math.round(totalAmount * (land / totalLand));
    if (idx === participants.length - 1) {
      shareAmount = totalAmount - allocated;
    } else {
      allocated += shareAmount;
    }

    const isMe = p.userId?.toString() === userId?.toString();
    return {
      name: p.fullName || 'Farmer Partner',
      land,
      sharePct,
      shareAmount,
      isMe
    };
  });

  const handleSubmitProposal = async () => {
    if (!pool || !userId) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        poolId: pool._id,
        userId,
        items: [
          {
            productId: product._id || product.id,
            name: productName,
            price: unitPrice,
            quantity,
            category: product.category || 'Inputs',
            image: typeof product.image === 'string' ? product.image : (product.images?.[0]?.url || product.images?.[0] || ''),
            unit: product.unit || 'pack',
            sellerId: product.sellerId,
            sellerName: product.sellerName
          }
        ],
        notes
      };

      const res = await fetch('/api/marketplace/pool-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.proposal) {
        onSuccess(data.proposal._id);
        onClose();
      } else {
        setError(data.error || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      console.error('Submit proposal error:', err);
      setError(err.message || 'Network error submitting proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-emerald-100 shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#166534] to-[#15803d] px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Buy with Farm Pool</h3>
              <p className="text-xs text-emerald-100">Cooperative Group Purchase & Consensus Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {loadingPool ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#166534] animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Verifying Farm Pool membership & land split ratios...</p>
            </div>
          ) : !pool ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">No Active Farm Pool Found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Your farmland is not currently registered in an active cooperative Farm Pool. You can discover neighbouring farms and form a pool to unlock collective bulk purchasing.
                </p>
              </div>
              <a
                href={`/dashboard/farmer/pooling?userId=${userId || ''}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#166534] text-white text-xs font-bold hover:bg-[#14532d] transition-all shadow-md"
              >
                Go to Digital Farm Pooling <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {/* Product & Pool Overview Pill */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Target Farm Pool</span>
                  <p className="font-bold text-sm text-[#1f3b2c]">{pool.name}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {participants.length} Farmers • {totalLand.toFixed(2)} Combined Acres • Crop: {pool.farmPlan?.selectedCrop || 'Farming Inputs'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Product</span>
                  <p className="font-bold text-xs text-gray-800 max-w-[140px] truncate">{productName}</p>
                  <p className="text-xs font-mono font-bold text-emerald-800">₹{unitPrice} / {product.unit || 'unit'}</p>
                </div>
              </div>

              {/* Quantity Selector & Live Total */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Quantity Needed</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-all text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-bold text-sm bg-white border border-gray-300 rounded-lg py-1 text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-all text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-500 font-medium">{product.unit || 'units'}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-100 space-y-0.5 text-right flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Gross Order Total</span>
                  <p className="text-2xl font-black text-[#166534] font-mono">₹{totalAmount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Bulk Rate Guaranteed ✓</p>
                </div>
              </div>

              {/* Pro-Rata Cost Split Breakdown Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Member Pro-Rata Cost Distribution
                  </label>
                  <span className="text-[10px] text-gray-400">Pro-rata on registered land extent</span>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
                  {splits.map((s: any, i: number) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-3 text-xs transition-colors ${
                        s.isMe ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 font-bold">{s.name}</span>
                          {s.isMe && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-bold">
                              You (Proposer)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal">
                          {s.land} Acres • {s.sharePct}% Land Share
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-[#166534] font-mono">₹{s.shareAmount.toLocaleString('en-IN')}</p>
                        <span className={`text-[10px] font-medium ${s.isMe ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {s.isMe ? '✓ Auto-Agreed' : 'Pending Vote ⏳'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note / Purpose input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Procurement Purpose / Note for Partners
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sowing fertilizer requirement for Plot A & B"
                  className="w-full text-xs border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProposal}
                  disabled={submitting}
                  className="flex-2 py-3 px-6 bg-gradient-to-r from-[#166534] to-[#15803d] hover:from-[#14532d] hover:to-[#166534] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting to Pool...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" /> Propose to Farm Pool
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
