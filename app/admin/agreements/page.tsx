'use client';

import { useState, useEffect } from 'react';
import { FiFileText, FiSearch, FiLayers, FiCheckCircle, FiClock, FiEye, FiX } from 'react-icons/fi';
import SmartContractDocument from '@/app/components/SmartContractDocument/SmartContractDocument';

export default function AgreementManagement() {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPool, setSelectedPool] = useState<any | null>(null);

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/farm-pools');
      const data = await res.json();
      if (data.success) {
        // Filter pools that are either in signing, blockchain_storage, active, or counseling (if plans exist)
        const activeAgreements = data.pools.filter((p: any) => 
          p.status === 'signing' || p.status === 'active' || p.status === 'blockchain_storage' || (p.status === 'planning' && p.rejectionReason)
        );
        setPools(activeAgreements);
      }
    } catch (e) {
      console.error('Error fetching pools for agreements:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPools = pools.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold leading-tight text-[#1f3b2c]">Agreement Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review legal documents, smart contract logs, stamp certificates, and blockchain ledgers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agreements List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FiSearch className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#166534] text-xs"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading contracts...</div>
            ) : filteredPools.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No active smart contract agreements found.</div>
            ) : (
              filteredPools.map((pool) => (
                <button
                  key={pool._id}
                  onClick={() => setSelectedPool(pool)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2 ${
                    selectedPool?._id === pool._id ? 'bg-slate-50/80 border-r-4 border-[#166534]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <span className="text-xs font-bold text-gray-800 line-clamp-2 flex-1">{pool.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-0.5 flex-shrink-0 ${
                      pool.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : (pool.status === 'planning' && pool.rejectionReason)
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {pool.status === 'active' ? (
                        <><FiCheckCircle /> Active</>
                      ) : (pool.status === 'planning' && pool.rejectionReason) ? (
                        <><FiX /> Reverted</>
                      ) : (
                        <><FiClock /> Signing</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                    <span>ID: ...{pool._id.slice(-6).toUpperCase()}</span>
                    <span>{pool.participants?.length || 0} Farmers</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Agreement Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPool ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <h2 className="text-base font-black text-[#1f3b2c]">{selectedPool.name}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Agreement ID</p>
                      <p className="text-[11px] font-mono font-bold text-slate-700 break-all">{selectedPool._id}</p>
                    </div>
                    <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedPool._id)}
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all flex items-center gap-1"
                      >
                        📋 Copy ID
                      </button>
                      <a
                        href={`/verify?poolId=${selectedPool._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-[10px] font-bold bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-lg transition-all flex items-center gap-1 whitespace-nowrap"
                      >
                        🔍 Verify Authenticity ↗
                      </a>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPool(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all flex-shrink-0"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <SmartContractDocument pool={selectedPool} />
              </div>

              {/* Live Agreement Audit Trail Section */}
              <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-[#1f3b2c] tracking-tight uppercase flex items-center gap-1.5">
                    ⏳ Agreement Lifecycle Audit Trail Logs
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg">
                    Real-time Audit
                  </span>
                </div>
                <AgreementAuditTrail poolId={selectedPool._id} />
              </div>

              {/* Signature Audit Evidence Panel */}
              <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
                <h3 className="text-xs font-black text-[#1f3b2c] tracking-tight uppercase flex items-center gap-1.5">
                  🛡️ Cryptographic Signature Evidence Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPool.participants && selectedPool.participants
                    .filter((p: any) => p.signatureHash)
                    .map((p: any, idx: number) => {
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                          <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                            <div>
                              <h4 className="font-extrabold text-gray-800 text-xs">{p.fullName}</h4>
                              <p className="text-[10px] text-gray-400 font-mono">Farmer ID: {p.userId}</p>
                            </div>
                            <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              ✓ Verified: Yes
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[10px] text-gray-500 font-sans">
                            <div>
                              <p className="font-bold text-gray-400 uppercase text-[9px]">Agreement ID</p>
                              <p className="font-semibold text-gray-700 font-mono truncate">{selectedPool._id}</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-400 uppercase text-[9px]">Signature Method</p>
                              <p className="font-bold text-slate-800">{p.signatureMethod === 'upload' ? 'Uploaded Signature' : 'Drawn Signature'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="font-bold text-gray-400 uppercase text-[9px]">Signed On</p>
                              <p className="font-semibold text-gray-700">{p.signedAt ? new Date(p.signedAt).toLocaleString('en-IN') : 'N/A'}</p>
                            </div>
                          </div>

                          {(p.signatureUrl || p.signatureImage) ? (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                              <p className="font-bold text-gray-400 uppercase text-[9px]">Signature Image Preview</p>
                              <div className="bg-white border border-slate-200 rounded-xl p-2.5 w-fit flex items-center justify-center shadow-inner">
                                <img
                                  src={p.signatureUrl || p.signatureImage}
                                  alt={`${p.fullName}'s Cryptographic Signature`}
                                  className="h-12 object-contain"
                                />
                              </div>
                              <a
                                href={p.signatureUrl || p.signatureImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-[10px] text-blue-600 hover:text-blue-800 font-bold underline font-mono truncate max-w-full mt-1"
                              >
                                Cloudinary URL
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-slate-400 italic text-[10px]">
                              No signature image recorded. Click Re-sign to draw/upload again.
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500 h-full flex flex-col justify-center items-center min-h-[400px]">
              <div className="mx-auto w-12 h-12 bg-[#e2d4b7]/20 text-[#166534] rounded-xl flex items-center justify-center mb-4">
                <FiFileText className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[#1f3b2c] mb-1">Select an Agreement</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Click on any smart contract in the left sidebar list to view its official e-Stamp certificate and signatures.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Component for Agreement Lifecycle Logs ──────────────────────────────────
function AgreementAuditTrail({ poolId }: { poolId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/admin/audit-logs?resourceId=${poolId}&limit=10`, { headers: headers as Record<string, string> });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Error fetching agreement audit trail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrail();
  }, [poolId]);

  if (loading) return <div className="text-[10px] text-slate-400">Loading trail logs...</div>;
  if (logs.length === 0) return <div className="text-[10px] text-slate-400 italic">No logs recorded for this agreement yet.</div>;

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 font-mono text-[10px] text-slate-600 max-h-[250px] overflow-y-auto">
      {logs.map((log: any, idx: number) => (
        <div key={idx} className="flex items-start gap-2 border-b border-slate-200/40 pb-2 last:border-0 last:pb-0">
          <span className="text-slate-400 font-bold shrink-0">{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
          <span className="text-[#1A9B9A] font-extrabold uppercase shrink-0">[{log.userRole || 'System'}]</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-800 break-all">{log.remarks || `${log.action} performed`}</span>
            {log.ipAddress && <span className="text-[9px] text-slate-400 block mt-0.5">IP: {log.ipAddress} · Device: {log.deviceType || 'Unknown'} · {log.browser || 'Unknown'}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
