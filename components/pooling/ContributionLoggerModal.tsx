'use client';

import React, { useState } from 'react';
import { 
  X, Clock, Tractor, Coins, Calendar, 
  FileText, CheckCircle2, AlertCircle, Loader2 } from '../ui/icons';

interface ContributionLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  userId: string;
  farmerName: string;
  onSuccess: () => void;
}

export default function ContributionLoggerModal({
  isOpen,
  onClose,
  poolId,
  userId,
  farmerName,
  onSuccess
}: ContributionLoggerModalProps) {
  const [type, setType] = useState<'labour' | 'machinery' | 'capital'>('labour');
  const [activityName, setActivityName] = useState('Field Weeding & Soil Aeration');
  const [quantity, setQuantity] = useState<number>(4);
  const [unitRate, setUnitRate] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'labour' | 'machinery' | 'capital') => {
    setType(newType);
    if (newType === 'labour') {
      setActivityName('Field Weeding & Sowing Assistance');
      setUnitRate(100); // standard ₹100/hr
      setQuantity(4);
    } else if (newType === 'machinery') {
      setActivityName('Tractor Ploughing & Bed Preparation');
      setUnitRate(750); // ₹750/hr tractor
      setQuantity(2);
    } else {
      setActivityName('Seasonal Input Cash Injection');
      setUnitRate(1);
      setQuantity(5000);
    }
  };

  const calculatedTotal = type === 'capital' ? quantity : quantity * unitRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/farmer/pooling/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          userId,
          farmerName,
          type,
          activityName,
          quantity: Number(quantity),
          unit: type === 'capital' ? 'INR' : 'hours',
          unitRate: Number(unitRate),
          date,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit contribution log');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit contribution error:', err);
      setError(err.message || 'Error recording contribution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#e2d4b7] w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-[#166534] rounded-2xl border border-emerald-200">
              
            </div>
            <div>
              <h3 className="font-bold text-[#1f3b2c] text-lg">Log Member Contribution</h3>
              <p className="text-xs text-slate-600">Record daily labour, machinery hours, or capital for dynamic pool weighting</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Contribution Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('labour')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                  type === 'labour'
                    ? 'bg-[#166534] text-white border-[#166534] '
                    : 'bg-[#f8fafc] text-slate-600 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Labour (Hours)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('machinery')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                  type === 'machinery'
                    ? 'bg-[#166534] text-white border-[#166534] '
                    : 'bg-[#f8fafc] text-slate-600 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <Tractor className="w-4 h-4" />
                <span>Machinery</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('capital')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                  type === 'capital'
                    ? 'bg-[#166534] text-white border-[#166534] '
                    : 'bg-[#f8fafc] text-slate-600 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Extra Capital</span>
              </button>
            </div>
          </div>

          {/* Activity Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activity / Work Description
            </label>
            <input
              type="text"
              required
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g. Sowing, Weeding, Harvester Operation, Drip Repair"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#166534] focus:outline-hidden text-[#1f3b2c]"
            />
          </div>

          {/* Quantity & Unit Rate Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {type === 'capital' ? 'Amount Contributed (₹)' : 'Duration (Hours)'}
              </label>
              <input
                type="number"
                required
                min="0.5"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#166534] focus:outline-hidden font-medium text-[#1f3b2c]"
              />
            </div>

            {type !== 'capital' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Agreed Rate (₹ / Hour)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={unitRate}
                  onChange={(e) => setUnitRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#166534] focus:outline-hidden font-medium text-[#1f3b2c]"
                />
              </div>
            )}
            
            {type === 'capital' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Injection Method
                </label>
                <div className="px-3.5 py-2.5 text-sm bg-[#f8fafc] text-slate-600 border border-slate-200 rounded-xl">
                  Direct Pool Escrow / Cash
                </div>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date of Activity
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#166534] focus:outline-hidden text-[#1f3b2c]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Field Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Covered Plot Survey 45/2 north section..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#166534] focus:outline-hidden text-[#1f3b2c]"
            />
          </div>

          {/* Value Summary Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-[#166534] font-bold">Estimated Contribution Value:</span>
              <p className="text-xs text-slate-500">Credit added upon FCO verification</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#166534]">
                ₹{calculatedTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || quantity <= 0}
              className="px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Contribution</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
