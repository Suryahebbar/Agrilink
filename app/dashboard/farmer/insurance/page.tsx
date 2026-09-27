'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, ShieldAlert, FileText, Calculator, 
  Layers, UploadCloud, AlertTriangle, CheckCircle2, 
  Clock, ArrowRight, DollarSign, Building2, 
  ExternalLink, Eye, ChevronRight, X, RefreshCw,
  Umbrella, Award, FileCheck2, Search, SlidersHorizontal
} from '../../../../components/ui/icons';
import { INSURANCE_CATALOG, InsurancePolicy } from '@/lib/data/insurance-catalog';

export default function FarmerInsurancePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'calculator' | 'compare' | 'claims'>('overview');
  const [loading, setLoading] = useState(false);
  const [activePool, setActivePool] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);

  // Policy Filter States
  const [selectedType, setSelectedType] = useState<'all' | 'government' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Comparison State (Array of max 3 policy IDs)
  const [comparePolicyIds, setComparePolicyIds] = useState<string[]>(['pmfby-govt', 'hdfc-ergo-agri', 'icici-lombard-crop']);

  // Calculator State
  const [calcCrop, setCalcCrop] = useState('Coffee');
  const [calcSeason, setCalcSeason] = useState<'Kharif' | 'Rabi' | 'Commercial/Horticulture' | 'Perennial'>('Commercial/Horticulture');
  const [calcAcres, setCalcAcres] = useState<number>(4);
  const [calcCost, setCalcCost] = useState<number>(160000);
  const [calculatedQuotes, setCalculatedQuotes] = useState<any[]>([]);

  // Claim Filing Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimCrop, setClaimCrop] = useState('');
  const [claimPolicyName, setClaimPolicyName] = useState('');
  const [claimPolicyType, setClaimPolicyType] = useState<'government' | 'private'>('government');
  const [claimProvider, setClaimProvider] = useState('');
  const [claimAffectedAcres, setClaimAffectedAcres] = useState<number>(2);
  const [claimCalamityType, setClaimCalamityType] = useState('excess_rain');
  const [claimIncidentDate, setClaimIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimLossPct, setClaimLossPct] = useState<number>(60);
  const [claimLossAmount, setClaimLossAmount] = useState<number>(80000);
  const [claimDesc, setClaimDesc] = useState('');
  const [claimMediaUrl, setClaimMediaUrl] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  // Fetch farmer's active pool and insurance claims
  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Fetch pool details
      const poolRes = await fetch(`/api/farmer/pooling?userId=${userId}`);
      const poolData = await poolRes.json();
      if (poolData.success && poolData.activePool) {
        setActivePool(poolData.activePool);
        const crop = poolData.activePool.farmPlan?.selectedCrop || 'Coffee';
        setCalcCrop(crop);
        const acres = poolData.activePool.farmPlan?.farmArea || 4;
        setCalcAcres(acres);
        const cost = poolData.activePool.farmPlan?.estimatedCost || (acres * 40000);
        setCalcCost(cost);
      }

      // 2. Fetch existing claims
      const claimsRes = await fetch(`/api/insurance/claims?farmerId=${userId}`);
      const claimsData = await claimsRes.json();
      if (claimsData.success) {
        setClaims(claimsData.claims || []);
      }
    } catch (e) {
      console.error('Error loading insurance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Recalculate quotes when inputs change
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/insurance/calculate-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cropName: calcCrop,
            season: calcSeason,
            acres: calcAcres,
            estimatedCost: calcCost
          })
        });
        const data = await res.json();
        if (data.success) {
          setCalculatedQuotes(data.quotes || []);
        }
      } catch (err) {
        console.error('Error computing quotes:', err);
      }
    };
    fetchQuotes();
  }, [calcCrop, calcSeason, calcAcres, calcCost]);

  // Handle open claim modal prefilled with pool policy
  const handleOpenClaimModal = (policy?: any) => {
    if (policy) {
      setClaimPolicyName(policy.name || policy.policyName || 'Standard Crop Policy');
      setClaimPolicyType(policy.type || 'government');
      setClaimProvider(policy.provider || policy.insuranceProvider || 'AIC of India');
    } else if (activePool?.farmPlan) {
      setClaimPolicyName(activePool.farmPlan.insuranceProvider ? `${activePool.farmPlan.insuranceProvider} Crop Plan` : 'Pradhan Mantri Fasal Bima Yojana (PMFBY)');
      setClaimPolicyType(activePool.farmPlan.insuranceType === 'private' ? 'private' : 'government');
      setClaimProvider(activePool.farmPlan.insuranceProvider || 'Government Scheme / AIC');
    }
    setClaimCrop(activePool?.farmPlan?.selectedCrop || calcCrop || 'Coffee');
    setShowClaimModal(true);
  };

  // Submit Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmittingClaim(true);
    setClaimSuccessMsg('');
    try {
      const payload = {
        action: 'create_claim',
        farmerId: userId,
        farmerName: activePool?.participants?.find((p: any) => p.userId?.toString() === userId?.toString())?.fullName || 'Registered Farmer',
        poolId: activePool?._id,
        policyName: claimPolicyName || 'Crop Shield Policy',
        policyType: claimPolicyType,
        providerName: claimProvider || 'AIC / Provider',
        cropName: claimCrop,
        affectedAcres: Number(claimAffectedAcres),
        totalFarmAcres: Number(activePool?.farmPlan?.farmArea) || Number(claimAffectedAcres),
        calamityType: claimCalamityType,
        incidentDate: claimIncidentDate,
        estimatedLossPercentage: Number(claimLossPct),
        estimatedLossAmount: Number(claimLossAmount),
        description: claimDesc || 'Crop damage due to adverse weather/disease',
        damageMedia: claimMediaUrl ? [{ url: claimMediaUrl, type: 'image', caption: 'Field damage evidence', uploadedAt: new Date() }] : []
      };

      const res = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setClaimSuccessMsg(`Claim #${data.claim?.claimNumber} filed successfully! An FCO field officer has been notified for on-site damage inspection.`);
        setTimeout(() => {
          setShowClaimModal(false);
          setActiveTab('claims');
          fetchData();
        }, 1800);
      } else {
        alert(data.error || 'Failed to file claim.');
      }
    } catch (err: any) {
      alert('Error submitting claim: ' + err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Filtered Catalog
  const filteredCatalog = INSURANCE_CATALOG.filter(policy => {
    const matchType = selectedType === 'all' || policy.type === selectedType;
    const matchSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      policy.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const toggleCompare = (id: string) => {
    if (comparePolicyIds.includes(id)) {
      setComparePolicyIds(comparePolicyIds.filter(item => item !== id));
    } else {
      if (comparePolicyIds.length >= 3) {
        alert('You can compare a maximum of 3 policies simultaneously.');
        return;
      }
      setComparePolicyIds([...comparePolicyIds, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#166534] text-white p-7 md:p-9">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-emerald-200 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Module 11: Crop Insurance & Protection
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Crop Insurance & Protection Suite
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              Compare government schemes (PMFBY, RWBCIS) and private multi-peril policies, calculate actuarial premiums, review FCO pool recommendations, and track rapid field claim inspections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenClaimModal()}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-sm transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-900" />
              File Damage Claim
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-sm transition-all backdrop-blur-md flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Premium Calculator
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200">
        {[
          { id: 'overview', label: 'My Active Coverage', icon: Umbrella },
          { id: 'catalog', label: 'Policy Catalog & FCO Recommendations', icon: Layers },
          { id: 'calculator', label: 'Actuarial Premium Calculator', icon: Calculator },
          { id: 'compare', label: 'Policy Comparison Matrix', icon: FileCheck2 },
          { id: 'claims', label: `Claims & Damage Tracking (${claims.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#166534] text-white '
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE COVERAGE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Pool Coverage Card */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  Pool Agreement & Blockchain Protection
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">
                  {activePool ? activePool.name : 'Individual / Unpooled Farm Cover'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assigned FCO Counselor: <strong className="text-gray-700">{activePool?.counselorName || 'Assigned AgriLink Agri Officer'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  activePool?.farmPlan?.insuranceType === 'private'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : activePool?.farmPlan?.insuranceType === 'government'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  {activePool?.farmPlan?.insuranceType ? `${activePool.farmPlan.insuranceType.toUpperCase()} INSURANCE` : 'GOVERNMENT PMFBY'}
                </span>
              </div>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Selected Provider</p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {activePool?.farmPlan?.insuranceProvider || 'AIC of India (Govt)'}
                </p>
                <span className="text-[10px] text-gray-400">Notified under Pradhan Mantri Scheme</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Insured Crop & Acreage</p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {activePool?.farmPlan?.selectedCrop || 'Coffee / Multi-crop'} ({activePool?.farmPlan?.farmArea || 4} Acres)
                </p>
                <span className="text-[10px] text-gray-400">Integrated Roster Parcel</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Estimated Crop Investment</p>
                <p className="text-base font-bold text-emerald-700 mt-1">
                  ₹{Number(activePool?.farmPlan?.estimatedCost || 160000).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">Total Sum Insured Base</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Contract Agreement Seal</p>
                <p className="text-xs font-mono font-semibold text-gray-700 mt-1 truncate">
                  {activePool?.blockchain?.contractHash ? `${activePool.blockchain.contractHash.slice(0, 16)}...` : 'Pending Signature Hash'}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">Clause 5 (Crop Insurance) Active</span>
              </div>
            </div>

            {/* Coverage & Policy Breakdown Notes */}
            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">Coverage Terms & Payout Mechanism:</p>
                  <p className="text-emerald-900 leading-relaxed">
                    {activePool?.farmPlan?.coverageDetails || 
                      'Full production investment protection against prevented sowing, localized inundation, cloudburst, pest infestation, and drought. Payouts are distributed to farmers proportionate to their contribution ratio.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-emerald-100">
                <FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">Claim Procedure & FCO Responsibility:</p>
                  <p className="text-emerald-900 leading-relaxed">
                    {activePool?.farmPlan?.claimResponsibility || 
                      'AgriLink FCO Field Officers conduct on-site verification within 48 hours of claim filing, digitally certifying photo evidence and uploading survey reports directly to the insurer portal.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-emerald-100">
                <DollarSign className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">Premium Contribution Split:</p>
                  <p className="text-emerald-900 leading-relaxed font-mono">
                    {activePool?.farmPlan?.premiumSharing || 'Shared proportionate to profit sharing percentages among pool participants.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleOpenClaimModal()}
                className="px-5 py-2.5 rounded-xl bg-[#166534] hover:bg-[#15803d] text-white font-bold text-xs transition-all flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                File Damage Assessment Claim
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-all flex items-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                Compare With Other Providers
              </button>
            </div>
          </div>

          {/* Quick FAQ / Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">1</div>
              <h4 className="font-bold text-gray-900 text-sm">72-Hour Intimation Window</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                In case of localized storm, hail, or pest damage, notify via the app within 72 hours for prompt FCO physical inspection.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">2</div>
              <h4 className="font-bold text-gray-900 text-sm">Geotagged Photo Verification</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload clear photos showing affected plots. FCO field officers digitally sign loss reports to expedite insurer approval.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">3</div>
              <h4 className="font-bold text-gray-900 text-sm">Escrow / Direct DBT Payouts</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Approved insurance payouts are disbursed directly to Aadhaar-linked accounts or pool shared accounts per contract loss ratios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: POLICY CATALOG & FCO RECOMMENDATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
              {(['all', 'government', 'private'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    selectedType === type
                      ? 'bg-[#166534] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All Policies' : type}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy, provider, peril..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Catalog Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalog.map((policy) => {
              const isSelectedForCompare = comparePolicyIds.includes(policy.id);
              const isGovt = policy.type === 'government';

              return (
                <div 
                  key={policy.id} 
                  className={`bg-white rounded-3xl border ${
                    policy.fcoRecommendationTier === 'Highly Recommended' 
                      ? 'border-emerald-500  ring-1 ring-emerald-500/20' 
                      : 'border-gray-200 '
                  } p-6 flex flex-col justify-between  transition-all duration-300 relative overflow-hidden`}
                >
                  {policy.fcoRecommendationTier === 'Highly Recommended' && (
                    <div className="absolute top-0 right-0 bg-[#166534] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                       FCO Choice
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isGovt ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {policy.type.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {policy.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-gray-900 line-clamp-2">
                        {policy.name}
                      </h3>
                      <p className="text-xs font-medium text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {policy.provider}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {policy.tagline}
                    </p>

                    {/* Premium Rate Highlights */}
                    <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Commercial / Hort. Rate:</span>
                        <strong className="text-gray-900 font-mono">{policy.commercialHorticultureRate}%</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Kharif / Foodgrain Rate:</span>
                        <strong className="text-gray-900 font-mono">{policy.kharifPremiumRate}%</strong>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Govt Subsidy:</span>
                        <strong className={isGovt ? "text-emerald-700 font-bold" : "text-gray-400"}>
                          {isGovt ? `${policy.governmentSubsidyRate}% Covered` : 'Direct Private'}
                        </strong>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                        <span className="text-gray-500">Claim Settlement TAT:</span>
                        <strong className="text-indigo-700 font-bold">{policy.claimTurnaroundDays} Days</strong>
                      </div>
                    </div>

                    {/* FCO Suitability Note */}
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900">
                      <strong>FCO Note:</strong> {policy.fcoSuitabilityNote}
                    </div>

                    {/* Perils list */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Covered Perils:</p>
                      <div className="flex flex-wrap gap-1">
                        {policy.coveragePerils.slice(0, 3).map((peril, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium">
                            {peril}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleCompare(policy.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelectedForCompare
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      {isSelectedForCompare ? ' In Compare' : '+ Compare'}
                    </button>

                    <button
                      onClick={() => {
                        setCalcCrop('Coffee');
                        setActiveTab('calculator');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      Calculate <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACTUARIAL PREMIUM CALCULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Configurator Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <SlidersHorizontal className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-gray-900 text-base">Farm & Crop Actuarial Inputs</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Crop Type</label>
                  <select
                    value={calcCrop}
                    onChange={(e) => setCalcCrop(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                  >
                    <option value="Coffee">Coffee (Plantation)</option>
                    <option value="Black Pepper">Black Pepper (Spices)</option>
                    <option value="Arecanut">Arecanut (Horticulture)</option>
                    <option value="Cardamom">Cardamom (Spices)</option>
                    <option value="Paddy / Rice">Paddy / Rice (Kharif)</option>
                    <option value="Maize">Maize (Commercial)</option>
                    <option value="Ginger">Ginger (Horticulture)</option>
                    <option value="Cotton">Cotton (Commercial)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Cropping Season</label>
                  <select
                    value={calcSeason}
                    onChange={(e) => setCalcSeason(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                  >
                    <option value="Commercial/Horticulture">Commercial / Horticulture (Annual/Perennial)</option>
                    <option value="Kharif">Kharif (Monsoon Season)</option>
                    <option value="Rabi">Rabi (Winter Season)</option>
                    <option value="Perennial">Perennial Plantation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Total Insured Land (Acres)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={calcAcres}
                    onChange={(e) => setCalcAcres(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Estimated Cultivation Cost (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={calcCost}
                    onChange={(e) => setCalcCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Used to determine full cost sum-insured coverage ceiling.</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                <p className="font-bold">Actuarial Formula Used:</p>
                <p className="leading-relaxed">
                  Net Premium = (Sum Insured × Applicable Base Peril Rate) - Government Premium Subsidy.
                </p>
              </div>
            </div>

            {/* Calculated Quotes Display */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base">
                  Estimated Premium Quotes for {calcCrop} ({calcAcres} Acres)
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {calculatedQuotes.length} Quotes Computed
                </span>
              </div>

              <div className="space-y-3">
                {calculatedQuotes.map((quote) => (
                  <div
                    key={quote.policy.id}
                    className={`bg-white rounded-2xl p-5 border ${
                      quote.isRecommended 
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 ' 
                        : 'border-gray-200 '
                    } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          quote.policy.type === 'government' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {quote.policy.type}
                        </span>
                        {quote.isRecommended && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                             Recommended for {calcCrop}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-medium">{quote.policy.provider}</span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm">
                        {quote.policy.name}
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2">
                        <div>
                          <span className="text-gray-400 text-[10px] block">Sum Insured</span>
                          <strong className="text-gray-800 font-mono">₹{quote.totalSumInsured.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Premium Rate</span>
                          <strong className="text-gray-800 font-mono">{quote.applicableRatePercent}%</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Govt Subsidy</span>
                          <strong className="text-emerald-700 font-mono">₹{quote.govtSubsidyAmount.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] block">Per Acre Outlay</span>
                          <strong className="text-indigo-700 font-mono">₹{quote.perAcreCost.toLocaleString('en-IN')} / acre</strong>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Farmer Net Premium</span>
                      <p className="text-2xl font-black text-[#166534] font-mono">
                        ₹{quote.farmerNetPremium.toLocaleString('en-IN')}
                      </p>
                      <button
                        onClick={() => handleOpenClaimModal(quote.policy)}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        Enroll / Select Policy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: POLICY COMPARISON MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 overflow-x-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Side-by-Side Crop Insurance Comparison</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Evaluate key differences between National Schemes and Private Parametric Covers.
                </p>
              </div>

              <div className="flex gap-2">
                {INSURANCE_CATALOG.map((p) => {
                  const active = comparePolicyIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleCompare(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        active 
                          ? 'bg-[#166534] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.code.split('-')[1]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comparison Table */}
            <table className="w-full text-left border-collapse text-xs mt-4 min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-3 font-bold text-gray-500 uppercase tracking-wider w-1/4">Metric / Feature</th>
                  {comparePolicyIds.map(id => {
                    const policy = INSURANCE_CATALOG.find(p => p.id === id);
                    if (!policy) return null;
                    return (
                      <th key={id} className="p-3 font-bold text-gray-900 w-1/4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase block w-fit mb-1 ${
                          policy.type === 'government' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {policy.type}
                        </span>
                        {policy.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">Provider Organization</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3 font-medium text-gray-900">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.provider}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">Commercial Crop Premium Rate</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3 font-mono font-bold text-emerald-700">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.commercialHorticultureRate}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">Government Premium Subsidy</td>
                  {comparePolicyIds.map(id => {
                    const p = INSURANCE_CATALOG.find(p => p.id === id);
                    return (
                      <td key={id} className="p-3 font-bold text-gray-800">
                        {p?.type === 'government' ? `${p.governmentSubsidyRate}% Subsidized` : 'No Subsidy (Full Private)'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">Claim Settlement Speed</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3 font-bold text-indigo-700">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.claimTurnaroundDays} Days Turnaround
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">Payout Trigger Mechanism</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3 text-gray-600">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.payoutMethod}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">FCO Field Inspection Required?</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.inspectionRequired ? (
                        <span className="text-amber-700 font-bold"> Yes (FCO Field Surveyor)</span>
                      ) : (
                        <span className="text-blue-700 font-bold"> Automated Weather Index (No inspection needed)</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-gray-50/30">FCO Suitability Verdict</td>
                  {comparePolicyIds.map(id => (
                    <td key={id} className="p-3 text-[11px] text-gray-700 bg-emerald-50/30 leading-relaxed font-medium">
                      {INSURANCE_CATALOG.find(p => p.id === id)?.fcoSuitabilityNote}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CLAIMS & DAMAGE TRACKING */}
      {/* ========================================================================= */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filed Insurance Claims & Inspections</h3>
              <p className="text-xs text-gray-500">
                Track status of damage claims, FCO field inspection notes, and settlement disbursements.
              </p>
            </div>

            <button
              onClick={() => handleOpenClaimModal()}
              className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#15803d] text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              File New Claim
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">No Open Claims Found</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Your crops are in healthy standing. If you experience adverse weather, pest outbreak, or flood losses, click the button above to file a claim.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim._id} className="bg-white rounded-3xl border border-gray-200/90 p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-900">{claim.claimNumber}</span>
                          <span className="text-xs text-gray-400">• Filed on {new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-0.5">
                          {claim.cropName} Damage ({claim.calamityType.replace('_', ' ').toUpperCase()})
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        claim.status === 'settled' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : claim.status === 'inspected' || claim.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : claim.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Incident Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">Affected Area</span>
                      <strong className="text-gray-800 font-bold">{claim.affectedAcres} Acres</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">Estimated Loss Pct</span>
                      <strong className="text-amber-700 font-bold">{claim.estimatedLossPercentage}% Damage</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">Claimed Loss Amount</span>
                      <strong className="text-gray-900 font-mono font-bold">₹{claim.estimatedLossAmount?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">Approved Payout</span>
                      <strong className="text-emerald-700 font-mono font-bold">
                        {claim.approvedPayoutAmount ? `₹${claim.approvedPayoutAmount.toLocaleString('en-IN')}` : 'Under Evaluation'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <strong>Farmer Statement:</strong> {claim.description}
                  </p>

                  {/* FCO Inspection Report Section */}
                  {claim.fcoInspection && (
                    <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-700" /> FCO On-Site Inspection Report
                        </span>
                        <span className="text-[10px] font-mono text-blue-700 font-semibold">
                          Inspector: {claim.fcoInspection.inspectorName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-blue-900 pt-1">
                        <div>
                          <span>Verified Damage: </span>
                          <strong>{claim.fcoInspection.verifiedDamagePercent}%</strong>
                        </div>
                        <div>
                          <span>Assessed Loss: </span>
                          <strong className="font-mono">₹{claim.fcoInspection.assessedLossAmount?.toLocaleString('en-IN')}</strong>
                        </div>
                        <div>
                          <span>Recommendation: </span>
                          <strong className="uppercase">{claim.fcoInspection.recommendation}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed pt-1">
                        <strong>Field Notes:</strong> {claim.fcoInspection.inspectionNotes}
                      </p>
                    </div>
                  )}

                  {/* Settlement Banner */}
                  {claim.status === 'settled' && (
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                      <div className="space-y-0.5">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settlement Finalized & Disbursed
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          Ref: <span className="font-mono font-semibold">{claim.settlementReference}</span> • {claim.payoutDistributionNotes}
                        </p>
                      </div>
                      <span className="text-base font-black font-mono text-emerald-700">
                        ₹{claim.approvedPayoutAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLAIM FILING MODAL */}
      {/* ========================================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 relative space-y-5 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowClaimModal(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">File Crop Damage Claim</h3>
                <p className="text-xs text-gray-500">AgriLink will assign an FCO officer for physical verification.</p>
              </div>
            </div>

            {claimSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
                {claimSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={claimCrop}
                    onChange={(e) => setClaimCrop(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                    placeholder="e.g. Coffee / Pepper"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Calamity / Peril Type</label>
                  <select
                    value={claimCalamityType}
                    onChange={(e) => setClaimCalamityType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                  >
                    <option value="excess_rain">Excess / Unseasonal Rainfall</option>
                    <option value="drought">Drought / Dry Spell</option>
                    <option value="flood">Flood / Inundation</option>
                    <option value="hailstorm">Hailstorm & Heavy Wind</option>
                    <option value="pest_outbreak">Pest & Fungal Disease Epidemic</option>
                    <option value="wildfire">Wildfire / Heatwave</option>
                    <option value="cyclone">Cyclone / Landslide</option>
                    <option value="other">Other Crop Adversity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Affected Area (Acres)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={claimAffectedAcres}
                    onChange={(e) => setClaimAffectedAcres(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Incident / Damage Date</label>
                  <input
                    type="date"
                    required
                    value={claimIncidentDate}
                    onChange={(e) => setClaimIncidentDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Estimated Loss (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={claimLossPct}
                    onChange={(e) => setClaimLossPct(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Claim Loss Valuation (₹)</label>
                  <input
                    type="number"
                    required
                    value={claimLossAmount}
                    onChange={(e) => setClaimLossAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Field Damage Description</label>
                <textarea
                  rows={2}
                  required
                  value={claimDesc}
                  onChange={(e) => setClaimDesc(e.target.value)}
                  placeholder="Describe how the crop was damaged, current soil condition, or signs of pest rot..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Damage Photo Evidence URL</label>
                <input
                  type="text"
                  value={claimMediaUrl}
                  onChange={(e) => setClaimMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded photo link"
                  className="w-full p-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#15803d] text-white font-bold transition-all flex items-center gap-2"
                >
                  {submittingClaim ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
                  Submit Claim for FCO Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
