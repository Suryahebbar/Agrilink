'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiUploadCloud, 
  FiCheck, 
  FiX, 
  FiRefreshCw, 
  FiChevronLeft, 
  FiChevronRight,
  FiFileText,
  FiEye,
  FiSend,
  FiUsers,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { adminFetch } from '@/lib/admin-client-auth';

interface Scheme {
  _id: string;
  name: string;
  link?: string;
  category: string;
  isActive: boolean;
  raw: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SchemeRecommendation {
  _id: string;
  schemeId: {
    _id: string;
    name: string;
    category: string;
  };
  fcoId: string;
  targetFilters: {
    state?: string;
    crop?: string;
    landSize?: string;
  };
  farmerResponses: Array<{
    userId: string;
    fullName: string;
    status: 'pending' | 'interested' | 'not_interested';
    updatedAt: string;
  }>;
  bulkApplied: boolean;
  bulkAppliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SchemeManagement() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tabs: 'schemes' | 'recommendations'
  const [activeTab, setActiveTab] = useState<'schemes' | 'recommendations'>('schemes');
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    newSchemes: any[];
    updatedSchemes: any[];
    removedSchemes: any[];
  } | null>(null);

  // Manual Add/Edit Scheme Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [formName, setFormName] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formRawText, setFormRawText] = useState('{}');
  const [formIsActive, setFormIsActive] = useState(true);

  // View Details Modal State
  const [viewingScheme, setViewingScheme] = useState<Scheme | null>(null);

  // Recommendation Modal State
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendingScheme, setRecommendingScheme] = useState<Scheme | null>(null);
  const [recState, setRecState] = useState('All');
  const [recCrop, setRecCrop] = useState('All');
  const [recLandSize, setRecLandSize] = useState('All');
  const [sendingRecommendation, setSendingRecommendation] = useState(false);

  // User Identification
  const [fcoId, setFcoId] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch('/api/auth/admin/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setFcoId(data.user._id || data.user.id || '');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  // Fetch list of schemes
  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category,
        status
      });

      const res = await adminFetch(`/api/admin/schemes?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch schemes');
      }

      setSchemes(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalItems(result.pagination?.total || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load schemes list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent recommendations
  const fetchRecommendations = async () => {
    if (!fcoId) return;
    setLoadingRecommendations(true);
    try {
      const res = await adminFetch(`/api/admin/schemes/recommend?fcoId=${fcoId}`);
      const result = await res.json();
      if (res.ok) {
        setRecommendations(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'schemes') {
      fetchSchemes();
    } else {
      fetchRecommendations();
    }
  }, [page, category, status, activeTab, fcoId]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSchemes();
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (scheme: Scheme) => {
    setError('');
    setSuccess('');
    try {
      const res = await adminFetch('/api/admin/schemes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scheme._id,
          isActive: !scheme.isActive
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccess(`Scheme status updated successfully`);
      fetchSchemes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save manual scheme (Add or Edit)
  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let parsedRaw = {};
    try {
      parsedRaw = JSON.parse(formRawText);
    } catch (err) {
      setError('Invalid JSON format in Criteria Fields');
      return;
    }

    try {
      const method = editingScheme ? 'PUT' : 'POST';
      const bodyPayload = editingScheme ? {
        id: editingScheme._id,
        name: formName,
        link: formLink,
        category: formCategory,
        isActive: formIsActive,
        raw: parsedRaw
      } : {
        name: formName,
        link: formLink,
        category: formCategory,
        raw: parsedRaw
      };

      const res = await adminFetch('/api/admin/schemes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save scheme');
      }

      setSuccess(`Scheme ${editingScheme ? 'updated' : 'created'} successfully`);
      setShowFormModal(false);
      setEditingScheme(null);
      fetchSchemes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete scheme
  const handleDeleteScheme = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheme?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await adminFetch(`/api/admin/schemes?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete scheme');
      }

      setSuccess('Scheme deleted successfully');
      fetchSchemes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Upload spreadsheet to preview diff
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await adminFetch('/api/admin/schemes/upload-preview', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setPreviewData(data);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Error processing sheet upload');
    } fillAll: {
      setUploading(false);
    }
  };

  // Apply preview diff to live DB
  const handleConfirmUpload = async () => {
    if (!previewData) return;
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const res = await adminFetch('/api/admin/schemes/upload-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply changes');
      }

      setSuccess('Spreadsheet data loaded and applied successfully');
      setPreviewData(null);
      fetchSchemes();
    } catch (err: any) {
      setError(err.message || 'Error applying changes');
    } finally {
      setUploading(false);
    }
  };

  // Submit Scheme Recommendation
  const handleSendRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendingScheme || !fcoId) return;

    setError('');
    setSuccess('');
    setSendingRecommendation(true);

    try {
      const res = await adminFetch('/api/admin/schemes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: recommendingScheme._id,
          fcoId,
          state: recState,
          crop: recCrop,
          landSize: recLandSize
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to recommend scheme');
      }

      setSuccess(`Scheme recommendation campaign sent to ${data.count} matching farmers!`);
      setShowRecommendModal(false);
      fetchRecommendations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingRecommendation(false);
    }
  };

  // Bulk Apply Recommendation
  const handleBulkApply = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await adminFetch(`/api/admin/schemes/recommend?bulkApplyId=${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bulk application failed');
      }
      setSuccess(data.message || 'Bulk application completed successfully!');
      fetchRecommendations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openAddModal = () => {
    setEditingScheme(null);
    setFormName('');
    setFormLink('');
    setFormCategory('General');
    setFormRawText('{}');
    setFormIsActive(true);
    setError('');
    setShowFormModal(true);
  };

  const openEditModal = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setFormName(scheme.name);
    setFormLink(scheme.link || '');
    setFormCategory(scheme.category);
    setFormRawText(JSON.stringify(scheme.raw, null, 2));
    setFormIsActive(scheme.isActive);
    setError('');
    setShowFormModal(true);
  };

  const openRecommendModal = (scheme: Scheme) => {
    setRecommendingScheme(scheme);
    setRecState('All');
    setRecCrop('All');
    setRecLandSize('All');
    setError('');
    setShowRecommendModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1f3b2c]">Scheme Management</h1>
          <p className="text-sm text-gray-500">Configure eligibility criteria, upload fresh sheets, recommend schemes, and batch-apply.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* File Upload Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-[#1A9B9A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#158080] transition-colors disabled:opacity-50 shadow-sm"
          >
            <FiUploadCloud className="w-4 h-4" />
            {uploading ? 'Processing...' : 'Upload Fresh Sheet'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#1f3b2c] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2d4f3c] transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Scheme Manually
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'schemes'
              ? 'border-[#1f3b2c] text-[#1f3b2c]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FiGrid className="w-4 h-4" />
          All Schemes List
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'recommendations'
              ? 'border-[#1f3b2c] text-[#1f3b2c]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FiSend className="w-4 h-4" />
          Sent Recommendations Campaigns
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <FiX className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
          <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Spreadsheet Upload Preview Diff Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1f3b2c]">Preview Spreadsheet Changes</h2>
              <button onClick={() => setPreviewData(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-150 text-center">
                  <span className="text-2xl font-black text-green-700">{previewData.newSchemes.length}</span>
                  <span className="block text-xs font-semibold text-green-800 uppercase tracking-wider mt-1">New Schemes</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-150 text-center">
                  <span className="text-2xl font-black text-blue-700">{previewData.updatedSchemes.length}</span>
                  <span className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mt-1">Updated Schemes</span>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-150 text-center">
                  <span className="text-2xl font-black text-red-700">{previewData.removedSchemes.length}</span>
                  <span className="block text-xs font-semibold text-red-800 uppercase tracking-wider mt-1">Removed/Deactivated</span>
                </div>
              </div>

              {/* New Schemes list */}
              {previewData.newSchemes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider">New Schemes to Add (+)</h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-green-50 text-green-950 font-bold border-b border-gray-100">
                          <th className="p-3">Scheme Name</th>
                          <th className="p-3">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.newSchemes.map((s, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="p-3 font-medium">{s.name}</td>
                            <td className="p-3 text-gray-500">{s.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Updated Schemes list */}
              {previewData.updatedSchemes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Updated Schemes to Modify (✎)</h3>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-blue-50 text-blue-950 font-bold border-b border-gray-100">
                          <th className="p-3">Scheme Name</th>
                          <th className="p-3">Category (Old → New)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.updatedSchemes.map((s, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="p-3 font-medium">{s.new.name}</td>
                            <td className="p-3 text-gray-500">
                              {s.old.category !== s.new.category ? `${s.old.category} → ${s.new.category}` : s.new.category}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Removed Schemes list */}
              {previewData.removedSchemes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">Absent Schemes to Deactivate (-)</h3>
                  <p className="text-xs text-gray-500 italic">These schemes are absent from the uploaded spreadsheet and will be flagged as inactive to prevent them from silently disappearing.</p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-red-50 text-red-950 font-bold border-b border-gray-100">
                          <th className="p-3">Scheme Name</th>
                          <th className="p-3">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.removedSchemes.map((s, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="p-3 font-medium text-red-800">{s.name}</td>
                            <td className="p-3 text-gray-500">{s.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setPreviewData(null)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="px-5 py-2.5 bg-[#1f3b2c] text-white rounded-xl text-sm font-semibold hover:bg-[#2d4f3c] transition-colors disabled:opacity-50"
              >
                {uploading ? 'Applying...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheme Recommend Modal */}
      {showRecommendModal && recommendingScheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1f3b2c]">Recommend Scheme</h2>
              <button onClick={() => setShowRecommendModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendRecommendation} className="py-4 space-y-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Selected Scheme</span>
                <p className="font-bold text-[#1f3b2c]">{recommendingScheme.name}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target State Location</label>
                <select
                  value={recState}
                  onChange={(e) => setRecState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="All">All States</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Crop Type</label>
                <select
                  value={recCrop}
                  onChange={(e) => setRecCrop(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="All">All Crops</option>
                  <option value="Paddy">Paddy</option>
                  <option value="Ragi">Ragi</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Maize">Maize</option>
                  <option value="Vegetables">Vegetables</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Land Size</label>
                <select
                  value={recLandSize}
                  onChange={(e) => setRecLandSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="All">All Sizes</option>
                  <option value="< 1 acre">&lt; 1 acre</option>
                  <option value="1-2 acres">1-2 acres</option>
                  <option value="2-5 acres">2-5 acres</option>
                  <option value="5-10 acres">5-10 acres</option>
                  <option value="> 10 acres">&gt; 10 acres</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRecommendation}
                  className="px-5 py-2 bg-[#1A9B9A] hover:bg-[#158080] text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <FiSend className="w-4 h-4" />
                  {sendingRecommendation ? 'Sending...' : 'Send Recommendation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schemes List Tab */}
      {activeTab === 'schemes' && (
        <>
          <div className="bg-white p-5 rounded-2xl border border-[#e2d4b7] flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schemes by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-gray-700"
                />
              </div>
              <button
                type="submit"
                className="bg-[#1f3b2c] hover:bg-[#2d4f3c] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500 uppercase">Category</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="General">General</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Horticulture">Horticulture</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Sericulture">Sericulture</option>
                  <option value="Fisheries">Fisheries</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-gray-500 uppercase">Status</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2d4b7] overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FiRefreshCw className="w-8 h-8 text-[#1A9B9A] animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium">Fetching schemes dataset...</p>
              </div>
            ) : schemes.length === 0 ? (
              <div className="text-center py-16">
                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#1f3b2c] mb-1">No Schemes Found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or upload a spreadsheet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f0f7e6] text-[#1f3b2c] font-semibold border-b border-[#e2d4b7]">
                      <th className="p-4">Scheme Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Official Link</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((scheme) => (
                      <tr key={scheme._id} className="border-b border-gray-50 hover:bg-[#fcfbf9]/40 transition-colors">
                        <td className="p-4 font-bold text-gray-900 truncate max-w-xs text-xs" title={scheme.name}>
                          {scheme.name}
                        </td>
                        <td className="p-4 text-xs">
                          <span className="bg-gray-100 text-gray-800 text-[10px] px-2.5 py-1 rounded-full font-medium">
                            {scheme.category}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          {scheme.link ? (
                            <a
                              href={scheme.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1A9B9A] hover:underline truncate max-w-xs block"
                            >
                              {scheme.link}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No link</span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          <button
                            onClick={() => handleToggleStatus(scheme)}
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                              scheme.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {scheme.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openRecommendModal(scheme)}
                              className="px-3 py-2 bg-[#1A9B9A]/10 text-[#1A9B9A] hover:bg-[#1A9B9A]/20 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                              title="Recommend to target farmers"
                            >
                              <FiSend className="w-3.5 h-3.5" />
                              Recommend
                            </button>
                            <button
                              onClick={() => setViewingScheme(scheme)}
                              className="p-2 border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-50"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(scheme)}
                              className="p-2 border border-gray-100 text-[#1A9B9A] rounded-xl hover:bg-gray-50"
                              title="Edit Criteria"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteScheme(scheme._id)}
                              className="p-2 border border-red-100 text-red-600 rounded-xl hover:bg-red-50"
                              title="Delete Scheme"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Section */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Showing Page {page} of {totalPages} ({totalItems} schemes total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Recommendations Campaign Tracker Tab */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-2xl border border-[#e2d4b7] overflow-hidden shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#1f3b2c]">Sent Recommendations Campaigns</h2>
            <button
              onClick={fetchRecommendations}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-xs font-semibold text-gray-700"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loadingRecommendations ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingRecommendations ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-[#1A9B9A] animate-spin mb-3" />
              <p className="text-xs text-gray-500">Loading campaigns...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <FiSend className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#1f3b2c] mb-1">No Sent Campaigns</h3>
              <p className="text-xs text-gray-500">Recommend schemes to farmers to track responses here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const total = rec.farmerResponses.length;
                const interested = rec.farmerResponses.filter(r => r.status === 'interested').length;
                const pending = rec.farmerResponses.filter(r => r.status === 'pending').length;
                const notInterested = rec.farmerResponses.filter(r => r.status === 'not_interested').length;

                return (
                  <div key={rec._id} className="border border-gray-150 rounded-2xl p-5 hover:border-gray-300 transition-all flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {rec.schemeId?.category || 'General'}
                        </span>
                        <h3 className="text-base font-bold text-[#1f3b2c] mt-1">{rec.schemeId?.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase">Targeted</span>
                          <span className="text-lg font-black text-gray-800">{total}</span>
                        </div>
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
                          <span className="block text-[10px] font-bold text-amber-700 uppercase">Pending</span>
                          <span className="text-lg font-black text-amber-800">{pending}</span>
                        </div>
                        <div className="bg-green-50 p-2.5 rounded-xl border border-green-100 text-center">
                          <span className="block text-[10px] font-bold text-green-700 uppercase">Interested</span>
                          <span className="text-lg font-black text-green-800">{interested}</span>
                        </div>
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
                          <span className="block text-[10px] font-bold text-red-700 uppercase">Not Int.</span>
                          <span className="text-lg font-black text-red-800">{notInterested}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-400 space-y-0.5">
                        <p>Filters Applied: State={rec.targetFilters.state || 'All'}, Crop={rec.targetFilters.crop || 'All'}, Size={rec.targetFilters.landSize || 'All'}</p>
                        <p>Sent At: {new Date(rec.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                      {rec.bulkApplied ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center w-full">
                          <FiCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <span className="text-xs font-bold text-green-800">Bulk Applied</span>
                          <span className="block text-[9px] text-gray-400 mt-0.5">
                            {rec.bulkAppliedAt ? new Date(rec.bulkAppliedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full space-y-2 text-center">
                          <button
                            onClick={() => handleBulkApply(rec._id)}
                            disabled={interested === 0}
                            className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-2.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                          >
                            <FiUsers className="w-4 h-4" />
                            Bulk Apply ({interested} Farmers)
                          </button>
                          <p className="text-[10px] text-gray-400">Applies for all farmers who responded "Interested"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Details View Modal */}
      {viewingScheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1f3b2c]">Scheme Details</h2>
              <button onClick={() => setViewingScheme(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Scheme Name</span>
                <p className="text-sm font-semibold text-gray-900">{viewingScheme.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Category</span>
                  <p className="text-sm font-medium text-gray-800">{viewingScheme.category}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                  <p className="text-sm font-medium text-gray-800">{viewingScheme.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              {viewingScheme.link && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Official URL</span>
                  <a
                    href={viewingScheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1A9B9A] hover:underline block truncate"
                  >
                    {viewingScheme.link}
                  </a>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Eligibility Constraints (Raw Fields)</span>
                <div className="mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl overflow-x-auto text-[11px] font-mono text-gray-700 max-h-[220px]">
                  <pre>{JSON.stringify(viewingScheme.raw, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setViewingScheme(null)}
                className="px-5 py-2 bg-[#1f3b2c] text-white rounded-xl text-xs font-semibold hover:bg-[#2d4f3c] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create/Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1f3b2c]">
                {editingScheme ? 'Edit Government Scheme' : 'Add Manual Government Scheme'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-[#1f3b2c] uppercase mb-1">
                  Scheme Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter scheme name..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1f3b2c] uppercase mb-1">
                  Official Link (URL)
                </label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://example.gov.in"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f3b2c] uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Horticulture">Horticulture</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Sericulture">Sericulture</option>
                    <option value="Fisheries">Fisheries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f3b2c] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formIsActive ? 'Active' : 'Inactive'}
                    onChange={(e) => setFormIsActive(e.target.value === 'Active')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#1f3b2c] uppercase">
                    Eligibility Criteria (JSON constraints)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Format: {"{\"land_size\": \"<= 2\"}"}</span>
                </div>
                <textarea
                  rows={6}
                  value={formRawText}
                  onChange={(e) => setFormRawText(e.target.value)}
                  placeholder='{ "land_size": ">= 2", "state": "Karnataka", "gender": "Female" }'
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1f3b2c] text-gray-700 bg-gray-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1f3b2c] text-white rounded-xl text-xs font-semibold hover:bg-[#2d4f3c] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
