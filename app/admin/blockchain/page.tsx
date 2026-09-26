'use client';

import { useState, useEffect } from 'react';
import { 
  FiDatabase, FiSearch, FiRefreshCw, FiCheckCircle, 
  FiShield, FiCpu, FiExternalLink, FiLoader, FiDollarSign, 
  FiActivity, FiShoppingCart, FiTrendingUp, FiFileText, FiLayers
} from 'react-icons/fi';

type ScopeTab = 'agreements' | 'contributions' | 'settlements' | 'crop_sales' | 'investments';

export default function BlockchainRecords() {
  const [activeTab, setActiveTab] = useState<ScopeTab>('agreements');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Datasets
  const [pools, setPools] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [cropSales, setCropSales] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  const fetchAllBlockchainData = async () => {
    try {
      setLoading(true);
      const [poolsRes, salesRes, invRes] = await Promise.all([
        fetch('/api/admin/farm-pools').then(r => r.json()).catch(() => ({ pools: [] })),
        fetch('/api/blockchain/crop-sales').then(r => r.json()).catch(() => ({ sales: [] })),
        fetch('/api/blockchain/investments').then(r => r.json()).catch(() => ({ investments: [] }))
      ]);

      if (poolsRes.success && Array.isArray(poolsRes.pools)) {
        setPools(poolsRes.pools.filter((p: any) => p.blockchain?.contractHash));
        
        // Fetch settlements & contributions for all pools
        const poolIds = poolsRes.pools.map((p: any) => p._id);
        if (poolIds.length > 0) {
          const contribPromises = poolIds.map((pid: string) => 
            fetch(`/api/farmer/pooling/contributions?poolId=${pid}`)
              .then(r => r.json())
              .catch(() => ({ contributions: [] }))
          );
          const settlePromises = poolIds.map((pid: string) => 
            fetch(`/api/farmer/pooling/settlement?poolId=${pid}`)
              .then(r => r.json())
              .catch(() => ({ settlements: [] }))
          );

          const contribResults = await Promise.all(contribPromises);
          const settleResults = await Promise.all(settlePromises);

          const allContribs = contribResults.flatMap((r: any) => r.contributions || []);
          const allSettles = settleResults.flatMap((r: any) => r.settlements || []);

          setContributions(allContribs.filter((c: any) => c.blockchain?.isAnchored));
          setSettlements(allSettles.filter((s: any) => s.blockchain?.isAnchored || s.blockchainTxHash));
        }
      }

      if (salesRes.success && Array.isArray(salesRes.sales)) {
        setCropSales(salesRes.sales);
      }

      if (invRes.success && Array.isArray(invRes.investments)) {
        setInvestments(invRes.investments);
      }

    } catch (e) {
      console.error('Error fetching blockchain records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBlockchainData();
  }, []);

  const filterList = (items: any[], fields: string[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      return fields.some(f => {
        const val = f.split('.').reduce((obj, key) => obj?.[key], item);
        return String(val || '').toLowerCase().includes(q);
      });
    });
  };

  const tabs = [
    { id: 'agreements', label: 'Farm Agreements', count: pools.length, icon: FiFileText },
    { id: 'contributions', label: 'Contribution Ledger', count: contributions.length, icon: FiActivity },
    { id: 'settlements', label: 'Profit Distributions', count: settlements.length, icon: FiDollarSign },
    { id: 'crop_sales', label: 'Crop Sales (Escrow)', count: cropSales.length, icon: FiShoppingCart },
    { id: 'investments', label: 'Capital Investments', count: investments.length, icon: FiTrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-[#232F3E]">Blockchain Ledger Records</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enterprise immutable smart contract states across Agreements, Contribution Ledgers, Settlements, Produce Sales, and Capital Investments.
          </p>
        </div>
        <button 
          onClick={fetchAllBlockchainData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors bg-white shadow-sm"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Sync Ledger Nodes
        </button>
      </div>

      {/* Scope Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/60">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ScopeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active 
                  ? 'bg-white text-[#1A9B9A] shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon className={active ? 'text-[#1A9B9A]' : 'text-gray-400'} />
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${active ? 'bg-teal-50 text-[#1A9B9A]' : 'bg-gray-200 text-gray-600'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FiSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by block ID, hash, name, party, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] text-xs font-mono"
            />
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Smart Contract Engine: <strong className="text-gray-700">AgriLedgerCore (EVM)</strong>
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <FiLoader className="h-8 w-8 text-[#1A9B9A] animate-spin mb-3" />
            <p className="text-sm text-gray-500">Querying on-chain blocks and hashes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. AGREEMENTS TABLE */}
            {activeTab === 'agreements' && (
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Pool Name / Block ID</th>
                    <th className="px-6 py-4 text-left">Contract Hash</th>
                    <th className="px-6 py-4 text-left">Transaction Hash</th>
                    <th className="px-6 py-4 text-left">Signatures</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filterList(pools, ['name', 'blockchain.contractHash', 'blockchain.transactionHash']).map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <div className="flex items-center gap-2">
                          <FiShield className="text-[#1A9B9A]" />
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">Block #{p.blockchain?.blockNumber || '12450000'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]" title={p.blockchain?.contractHash}>
                        {p.blockchain?.contractHash}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px]" title={p.blockchain?.transactionHash}>
                        {p.blockchain?.transactionHash}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span className="px-2 py-1 bg-teal-50 border border-teal-100 text-teal-800 rounded-lg text-[10px] font-bold">
                          {p.participants?.filter((pt: any) => pt.signatureHash).length || 0} / {p.participants?.length || 0} Signed
                        </span>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <a
                          href={`/verify?type=agreement&id=${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A9B9A] hover:underline"
                        >
                          <FiExternalLink /> Verify Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. CONTRIBUTIONS TABLE */}
            {activeTab === 'contributions' && (
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Contributor & Type</th>
                    <th className="px-6 py-4 text-left">Activity / Quant</th>
                    <th className="px-6 py-4 text-left">Value (INR)</th>
                    <th className="px-6 py-4 text-left">Proof Hash</th>
                    <th className="px-6 py-4 text-left">Tx Hash / Block</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filterList(contributions, ['farmerName', 'activityName', 'blockchain.proofHash']).map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-gray-900">{c.farmerName}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.type === 'labour' ? 'bg-amber-50 text-amber-800' :
                          c.type === 'machinery' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-medium text-gray-800">{c.activityName}</p>
                        <p className="text-gray-400 font-mono">{c.quantity} {c.unit}</p>
                      </td>
                      <td className="px-6 py-4 font-sans font-bold text-gray-900">
                        ₹{c.totalValue?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]" title={c.blockchain?.proofHash}>
                        {c.blockchain?.proofHash}
                      </td>
                      <td className="px-6 py-4">
                        <p className="truncate max-w-[160px]" title={c.blockchain?.transactionHash}>{c.blockchain?.transactionHash}</p>
                        <p className="text-[10px] text-gray-400">Block #{c.blockchain?.blockNumber}</p>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <a
                          href={`/verify?type=contribution&id=${c._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A9B9A] hover:underline"
                        >
                          <FiExternalLink /> Verify Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. SETTLEMENTS TABLE */}
            {activeTab === 'settlements' && (
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Pool / Season</th>
                    <th className="px-6 py-4 text-left">Gross Revenue</th>
                    <th className="px-6 py-4 text-left">Net Margin Distributed</th>
                    <th className="px-6 py-4 text-left">Distribution Hash</th>
                    <th className="px-6 py-4 text-left">Transaction Hash</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filterList(settlements, ['poolName', 'season', 'blockchain.distributionHash', 'blockchainTxHash']).map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-gray-900">{s.poolName}</p>
                        <p className="text-gray-400 text-[10px]">{s.season} · Model {s.collaborationModel}</p>
                      </td>
                      <td className="px-6 py-4 font-sans font-medium text-gray-700">
                        ₹{s.grossHarvestRevenue?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-sans font-bold text-emerald-800">
                        ₹{s.netDistributableMargin?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]" title={s.blockchain?.distributionHash}>
                        {s.blockchain?.distributionHash || '0x...'}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]" title={s.blockchain?.transactionHash || s.blockchainTxHash}>
                        {s.blockchain?.transactionHash || s.blockchainTxHash}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <a
                          href={`/verify?type=settlement&id=${s._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A9B9A] hover:underline"
                        >
                          <FiExternalLink /> Verify Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. CROP SALES TABLE */}
            {activeTab === 'crop_sales' && (
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Produce & Pool</th>
                    <th className="px-6 py-4 text-left">Buyer / Party</th>
                    <th className="px-6 py-4 text-left">Quantity & Total</th>
                    <th className="px-6 py-4 text-left">Escrow Status</th>
                    <th className="px-6 py-4 text-left">Receipt Hash</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filterList(cropSales, ['cropName', 'buyerName', 'poolName', 'blockchain.receiptHash']).map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-gray-900">{sale.cropName}</p>
                        <p className="text-gray-400 text-[10px]">{sale.poolName}</p>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-semibold text-gray-800">{sale.buyerName}</p>
                        <p className="text-gray-400 text-[10px] capitalize">{sale.buyerType?.replace('_', ' ')}</p>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-gray-900">₹{sale.totalAmount?.toLocaleString('en-IN')}</p>
                        <p className="text-gray-400 text-[10px] font-mono">{sale.quantity} {sale.unit} @ ₹{sale.pricePerUnit}</p>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sale.paymentStatus === 'in_escrow' ? 'bg-indigo-50 text-indigo-800' :
                          sale.paymentStatus === 'released' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]" title={sale.blockchain?.receiptHash}>
                        {sale.blockchain?.receiptHash}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <a
                          href={`/verify?type=crop_sale&id=${sale._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A9B9A] hover:underline"
                        >
                          <FiExternalLink /> Verify Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. INVESTMENTS TABLE */}
            {activeTab === 'investments' && (
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4 text-left">Investor & Pool</th>
                    <th className="px-6 py-4 text-left">Capital Amount</th>
                    <th className="px-6 py-4 text-left">Terms / Return</th>
                    <th className="px-6 py-4 text-left">Disbursement</th>
                    <th className="px-6 py-4 text-left">Investment Hash</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filterList(investments, ['investorName', 'poolName', 'terms', 'blockchain.investmentHash']).map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <p className="font-bold text-gray-900">{inv.investorName}</p>
                        <p className="text-gray-400 text-[10px]">{inv.poolName} · <span className="capitalize">{inv.investorType?.replace('_', ' ')}</span></p>
                      </td>
                      <td className="px-6 py-4 font-sans font-bold text-emerald-800">
                        ₹{inv.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 font-sans max-w-[200px]">
                        <p className="truncate text-gray-700 font-medium" title={inv.terms}>{inv.terms}</p>
                        <p className="text-gray-400 text-[10px]">{inv.expectedReturnRate}% return · {inv.tenureMonths} mo</p>
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 capitalize">
                          {inv.disbursementMode?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[180px]" title={inv.blockchain?.investmentHash}>
                        {inv.blockchain?.investmentHash}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <a
                          href={`/verify?type=investment&id=${inv._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A9B9A] hover:underline"
                        >
                          <FiExternalLink /> Verify Proof
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
