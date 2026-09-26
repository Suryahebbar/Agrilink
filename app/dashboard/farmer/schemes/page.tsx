"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface SchemeField {
  label: string;
  key: string;
}

interface SchemeResult {
  name: string;
  link?: string;
  category?: string;
  raw: Record<string, unknown>;
}

interface SearchResponse {
  eligible: SchemeResult[];
  count: number;
  searchResults?: {
    eligibleSchemes: SchemeResult[];
    count: number;
    searchedAt: Date;
  };
  savedProfile?: {
    _id: string;
    profileName: string;
    isDefault: boolean;
    updatedAt: Date;
  };
  profileSaveError?: string;
}

interface FarmerProfile {
  _id: string;
  userId: string;
  profileName: string;
  profileData: Record<string, string>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function GovernmentSchemesPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [fields, setFields] = useState<SchemeField[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<FarmerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [saveProfile, setSaveProfile] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('Karnataka');
  const [stateFieldKey, setStateFieldKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [displayLimit, setDisplayLimit] = useState<number>(15);

  // Recommendations state
  const [activeTab, setActiveTab] = useState<'find' | 'recommended' | 'group_proposals' | 'applied'>('find');
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  // Pool state for group consensus
  const [activePool, setActivePool] = useState<any | null>(null);

  const checkPoolStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/farmer/pooling/pool?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.pool) {
        setActivePool(data.pool);
      }
    } catch (err) {
      console.error("Error checking pool status:", err);
    }
  }, [userId]);

  const handleProposeSchemeToPool = async (schemeId: string) => {
    if (!activePool || !userId) return;
    try {
      const res = await fetch('/api/farmer/pooling/propose-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          schemeId,
          userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActivePool(data.data);
        alert('Scheme proposed successfully to your shared land pool group for voting consensus! You can track and vote on it in the Group Proposals tab.');
      } else {
        alert(data.error || 'Failed to propose scheme');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoteScheme = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!activePool || !userId) return;
    try {
      const res = await fetch('/api/farmer/pooling/propose-scheme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          proposalId,
          userId,
          vote
        })
      });
      const data = await res.json();
      if (data.success) {
        setActivePool(data.data);
      } else {
        alert(data.error || 'Failed to record vote');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommended = async () => {
    if (!userId) return;
    setLoadingRecommended(true);
    try {
      const res = await fetch(`/api/farmer/schemes/recommended?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setRecommended(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const handleUpdateResponse = async (recId: string, status: 'interested' | 'not_interested') => {
    try {
      const res = await fetch('/api/farmer/schemes/recommended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recId,
          userId,
          status
        })
      });
      if (res.ok) {
        fetchRecommended();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if ((activeTab === 'recommended' || activeTab === 'applied' || activeTab === 'group_proposals') && userId) {
      fetchRecommended();
    }
  }, [activeTab, userId]);

  const shouldHideField = (field: SchemeField): boolean => {
    const cleanedLabel = String(field.label || '').replace(/\s*\(auto-filled\)\s*/gi, '').trim();
    const key = String(field.key || '').toLowerCase();
    return (
      /\bscheme\s*name\b/i.test(cleanedLabel) ||
      /\bscheme\s*link\b/i.test(cleanedLabel) ||
      /\bfarmer\s*category\b/i.test(cleanedLabel) || key === "farmer_category" ||
      /\bseason\b/i.test(cleanedLabel) || key === "season" ||
      /\birrigation\b/i.test(cleanedLabel) || key === "irrigation_type" ||
      /\bage\b/i.test(cleanedLabel) || key === "farmer_age" ||
      /\bsoil\b/i.test(cleanedLabel) || key === "soil_type"
    );
  };

  const loadFields = async () => {
    try {
      const res = await fetch("/api/schemes/headers");
      const data = await res.json();

      if (data.headers) {
        const headerFields = data.headers as SchemeField[];
        const stateField = headerFields.find((h) => {
          const cleanedLabel = String(h.label || '').replace(/\s*\(auto-filled\)\s*/gi, '').trim();
          return /\bstate\b/i.test(cleanedLabel) || /(^|_)state(_|$)/i.test(String(h.key || ''));
        });

        setStateFieldKey(stateField?.key || null);

        const visibleFields = headerFields.filter((h) => !shouldHideField(h));
        setFields(visibleFields);
        const initial: Record<string, string> = {};
        visibleFields.forEach((h: SchemeField) => {
          initial[h.key] = "";
        });

        if (stateField?.key) {
          initial[stateField.key] = 'Karnataka';
          setSelectedState('Karnataka');
        }

        if (userId) {
          try {
            const [profileRes, landRes] = await Promise.all([
              fetch(`/api/farmer/profile?userId=${userId}`),
              fetch(`/api/farmer/land-details?userId=${userId}`)
            ]);
            const profileData = await profileRes.json();
            const landData = await landRes.json();

            if (profileData.success && profileData.profile) {
              const prof = profileData.profile;

              if (prof.gender) {
                const matchedGender = visibleFields.find(f => f.key === "gender");
                if (matchedGender) {
                  const g = String(prof.gender).trim().toLowerCase();
                  if (g.startsWith("m")) initial[matchedGender.key] = "Male";
                  else if (g.startsWith("f")) initial[matchedGender.key] = "Female";
                }
              }

              if (prof.soilProperties) {
                const matchedSoil = visibleFields.find(f => f.key === "soil_type");
                if (matchedSoil) {
                  const validSoils = ["Black soil", "Red soil", "Alluvial soil", "Laterite soil", "Sandy loam"];
                  const normalizedSoil = validSoils.find(s => s.toLowerCase() === String(prof.soilProperties).trim().toLowerCase());
                  if (normalizedSoil) {
                    initial[matchedSoil.key] = normalizedSoil;
                  }
                }
              }
            }

            if (landData.success && landData.data && landData.data.length > 0) {
              const land = landData.data[0];
              const rtc = land.rtcDetails || {};

              const area = parseFloat(land.landData?.totalArea || rtc.extent || land.totalArea || "0");
              if (area > 0) {
                const matchedLand = visibleFields.find(f => f.key === "land_size");
                if (matchedLand) {
                  if (area < 1) initial[matchedLand.key] = "< 1 acre";
                  else if (area <= 2) initial[matchedLand.key] = "1-2 acres";
                  else if (area <= 5) initial[matchedLand.key] = "2-5 acres";
                  else if (area <= 10) initial[matchedLand.key] = "5-10 acres";
                  else initial[matchedLand.key] = "> 10 acres";
                }

                const matchedCat = visibleFields.find(f => f.key === "farmer_category");
                if (matchedCat) {
                  if (area <= 5) initial[matchedCat.key] = "Small and marginal";
                  else initial[matchedCat.key] = "General";
                }
              }

              const crops = rtc.allCrops || [];
              if (crops.length > 0) {
                const matchedCrop = visibleFields.find(f => f.key === "crop_type");
                if (matchedCrop) {
                  const firstCrop = crops[0];
                  const cropName = typeof firstCrop === 'object' && firstCrop !== null ? (firstCrop.name || '') : String(firstCrop);
                  const validCrops = ["Commercial", "Fruits", "Plantation", "Pulses", "Spices", "Vegetables", "Oilseeds", "Grains", "Millets", "Cotton", "Sugarcane", "Paddy", "Wheat", "Maize", "Ragi", "Sunflower", "Groundnut"];
                  const normalizedCrop = validCrops.find(c => c.toLowerCase() === cropName.trim().toLowerCase());
                  if (normalizedCrop) {
                    initial[matchedCrop.key] = normalizedCrop;
                  }
                }
              }

              if (rtc.irrigationSource) {
                const matchedIrr = visibleFields.find(f => f.key === "irrigation_type");
                if (matchedIrr) {
                  const validIrr = ["Drip", "Sprinkler", "Borewell", "Rainfed", "Canal", "Tank-fed"];
                  const normalizedIrr = validIrr.find(i => i.toLowerCase() === String(rtc.irrigationSource).trim().toLowerCase());
                  if (normalizedIrr) {
                    initial[matchedIrr.key] = normalizedIrr;
                  }
                }
              }
            }
          } catch (fetchErr) {
            console.error("Failed to fetch auto-fill profile data:", fetchErr);
          }
        }

        setForm(initial);

        try {
          const searchRes = await fetch("/api/schemes/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initial)
          });
          const searchData = await searchRes.json();
          setResults(searchData);
        } catch (searchErr) {
          console.error("Initial search failed:", searchErr);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load form fields");
    } finally {
      setLoadingFields(false);
    }
  };

  const loadProfiles = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/schemes/profile?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setProfiles(data.data);
      }
    } catch (err: unknown) {
      console.error('Error loading profiles:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadFields();
    if (userId) {
      loadProfiles();
      checkPoolStatus();
    }
  }, [userId, loadProfiles, checkPoolStatus]);

  useEffect(() => {
    setDisplayLimit(15);
  }, [activeCategory, results]);

  const loadProfile = async (profileId: string) => {
    const profile = profiles.find(p => p._id === profileId);
    if (profile) {
      const cleaned: Record<string, string> = {};
      fields.forEach((f) => {
        cleaned[f.key] = profile.profileData?.[f.key] ?? '';
      });

      if (stateFieldKey && profile.profileData?.[stateFieldKey]) {
        setSelectedState(profile.profileData[stateFieldKey]);
      }

      setForm(cleaned);
      setSelectedProfile(profileId);
      setResults(null);

      submitWithForm(cleaned);
    }
  };

  const handleChange = (key: string, v: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: v };
      if (/state/i.test(key)) {
        setSelectedState(v);
      }
      setTimeout(() => {
        submitWithForm(updated);
      }, 50);
      return updated;
    });
  };

  const submit = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    const farmerInput = { ...form };
    const payload = {
      farmerInput,
      saveProfile: saveProfile && profileName.trim() !== '',
      profileName: profileName.trim(),
      userId: userId
    };

    try {
      const res = await fetch("/api/schemes/search-with-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data);

      if (data.profileSaveError) {
        setError(data.profileSaveError);
      } else if (data.savedProfile) {
        setSaveProfile(false);
        setProfileName('');
        setShowSaveDialog(false);
        await loadProfiles();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search schemes";
      setError(errorMessage);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const submitWithForm = async (currentForm: Record<string, string>) => {
    setLoading(true);
    setError(null);
    const farmerInput = { ...currentForm };
    const payload = {
      farmerInput,
      saveProfile: false,
      profileName: '',
      userId: userId
    };
    try {
      const res = await fetch("/api/schemes/search-with-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search schemes";
      setError(errorMessage);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    const cleared = Object.fromEntries(Object.keys(form).map(k => [k, ""]));
    setForm(cleared);
    setResults(null);
    setError(null);
    setSelectedProfile('');
    setSaveProfile(false);
    setProfileName('');
    setSelectedState('Karnataka');
    setActiveCategory('All');

    if (stateFieldKey) {
      cleared[stateFieldKey] = 'Karnataka';
      setForm(cleared);
      setSelectedState('Karnataka');
    }

    submitWithForm(cleared);
  };

  const saveAsNewProfile = () => {
    if (!profileName.trim()) {
      setError('Please enter a profile name');
      return;
    }
    setSaveProfile(true);
    submit();
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const res = await fetch(`/api/schemes/profile?profileId=${profileId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadProfiles();
        if (selectedProfile === profileId) {
          setSelectedProfile('');
        }
      }
    } catch (err: unknown) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
    }
  };

  const setDefaultProfile = async (profileId: string) => {
    try {
      const res = await fetch('/api/schemes/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, isDefault: true })
      });

      if (res.ok) {
        await loadProfiles();
      }
    } catch (err: unknown) {
      console.error('Error setting default profile:', err);
      setError('Failed to set default profile');
    }
  };

  const handleRemoveFilter = (key: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: "" };
      if (key === stateFieldKey) {
        updated[key] = "Karnataka";
        setSelectedState("Karnataka");
      }
      setTimeout(() => {
        submitWithForm(updated);
      }, 50);
      return updated;
    });
  };

  const parseNumeric = (v: any): number | null => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[,₹\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const parseOperatorAndValue = (str: string) => {
    const match = str.replace(/[,₹\s]/g, "").match(/^(<=|>=|<|>)?\s*([0-9.]+)/);
    return {
      op: match?.[1] || null,
      val: match ? Number(match[2]) : null
    };
  };

  const checkFieldMatch = (fieldKey: string, cellVal: any, inputVal: any): boolean | null => {
    if (cellVal === null || cellVal === undefined || String(cellVal).trim() === "") return null;
    const cell = String(cellVal).trim();
    const cellLower = cell.toLowerCase();
    if (cellLower === "any" || cellLower === "-" || cellLower === "na") return null;

    if (inputVal === undefined || inputVal === null || String(inputVal).trim() === "") return null;
    const input = String(inputVal).trim();
    const inputLower = input.toLowerCase();

    // 1. Exact match
    if (cellLower === inputLower) return true;

    // 2. Ranges
    const rangeRegex = /^\s*([0-9.]+)\s*([-–—]|to)\s*([0-9.]+)/i;
    const cellRange = cell.replace(/acres|acre/gi, "").match(rangeRegex);
    const inputRange = input.replace(/acres|acre/gi, "").match(rangeRegex);

    const cellParsed = parseOperatorAndValue(cell);
    const inputParsed = parseOperatorAndValue(input);

    if (cellRange) {
      const cMin = Number(cellRange[1]);
      const cMax = Number(cellRange[3]);

      if (inputRange) {
        const iMin = Number(inputRange[1]);
        const iMax = Number(inputRange[3]);
        return iMin >= cMin && iMax <= cMax;
      }
      if (inputParsed.op && inputParsed.val !== null) {
        if (inputParsed.op === ">=") return inputParsed.val >= cMin;
        if (inputParsed.op === "<=") return inputParsed.val <= cMax;
      }
      if (inputParsed.val !== null && !inputParsed.op) {
        return inputParsed.val >= cMin && inputParsed.val <= cMax;
      }
      return false;
    }

    // 3. Operators
    if (cellParsed.op && cellParsed.val !== null) {
      const cOp = cellParsed.op;
      const cVal = cellParsed.val;

      if (inputParsed.op && inputParsed.val !== null) {
        const iOp = inputParsed.op;
        const iVal = inputParsed.val;

        if (cOp === "<" || cOp === "<=") {
          if (iOp === "<" || iOp === "<=") {
            return iVal <= cVal;
          }
        }
        if (cOp === ">" || cOp === ">=") {
          if (iOp === ">" || iOp === ">=") {
            return iVal >= cVal;
          }
        }
        return false;
      }

      if (inputRange) {
        const iMin = Number(inputRange[1]);
        const iMax = Number(inputRange[3]);
        if (cOp === ">" || cOp === ">=") return iMin >= cVal;
        if (cOp === "<" || cOp === "<=") return iMax <= cVal;
        return false;
      }

      if (inputParsed.val !== null) {
        const iVal = inputParsed.val;
        if (cOp === "<=") return iVal <= cVal;
        if (cOp === ">=") return iVal >= cVal;
        if (cOp === "<") return iVal < cVal;
        if (cOp === ">") return iVal > cVal;
      }
      return false;
    }

    // 4. Lists
    if (cell.includes(",") || cell.includes("/")) {
      const options = cell.split(/[,/]/).map(x => x.trim().toLowerCase());
      return options.includes(inputLower) || options.some(opt => opt === "both" || opt === "any" || opt === "all");
    }

    // Boolean-like values
    if (/^(yes|no|true|false)$/i.test(cell) && /^(yes|no|true|false)$/i.test(input)) {
      return cellLower === inputLower;
    }

    // Partial match fallback
    if (inputLower.includes(cellLower) || cellLower.includes(inputLower)) {
      return true;
    }

    return false;
  };

  const getSchemeConstraintsList = (scheme: SchemeResult) => {
    const constraintsList: { label: string; constraint: string; matched: boolean | null; input: string }[] = [];
    fields.forEach((f) => {
      const displayLabel = f.label.replace(/\s*\(auto-filled\)\s*/gi, '').trim();
      let rawVal = "";

      for (const rawKey of Object.keys(scheme.raw || {})) {
        const normKey = rawKey.trim().toLowerCase().replace(/\s+/g, "_");
        const match = (normKey === f.key) ||
          (f.key === "land_size" && (normKey === "land_size_condition" || normKey === "land_size")) ||
          (f.key === "state" && (normKey === "applicable_states" || normKey === "location(state)")) ||
          (f.key === "crop_type" && normKey === "crop_type") ||
          (f.key === "gender" && normKey === "gender") ||
          (f.key === "income_category" && (normKey === "income_category_condition" || normKey === "income_catogory" || normKey === "category")) ||
          (f.key === "pm_kisan" && normKey === "pm-kisan_registration") ||
          (f.key === "fpo_membership" && normKey === "fpo_membership") ||
          (f.key === "disaster_affected" && (normKey === "disaster_region_applicable" || normKey === "disaster-affected_region")) ||
          (f.key === "soil_type" && normKey === "soil_type") ||
          (f.key === "farmer_category" && normKey === "farmer_category") ||
          (f.key === "irrigation_type" && (normKey === "irrigation_type" || normKey === "irrigation")) ||
          (f.key === "organic_certification" && normKey === "organic_certification") ||
          (f.key === "farmer_age" && (normKey === "farmer_age" || normKey === "age" || normKey === "age_"));

        if (match) {
          rawVal = String(scheme.raw[rawKey]);
          break;
        }
      }

      if (rawVal && rawVal.trim() !== "" && rawVal.trim().toLowerCase() !== "na" && rawVal.trim().toLowerCase() !== "any") {
        const userVal = form[f.key] || "";
        const matched = checkFieldMatch(f.key, rawVal, userVal);
        constraintsList.push({
          label: displayLabel,
          constraint: rawVal,
          matched: matched,
          input: userVal
        });
      }
    });

    return constraintsList;
  };

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b2c]"></div>
      </div>
    );
  }

  if (error && fields.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-[#1f3b2c] mb-4">Error Loading Schemes</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#1f3b2c] text-white px-6 py-3 rounded-lg hover:bg-[#2d4f3c]"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeFilters = Object.entries(form).filter(([key, val]) => {
    return val !== "" && val !== null && val !== undefined && val !== "NA";
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1f3b2c] mb-2">Government Schemes</h1>
          <p className="text-gray-600 text-sm">
            Find applicable government schemes based on your profile. Save your information for quick access in the future.
          </p>
        </div>
        {userId && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-[#1f3b2c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2d4f3c] transition-colors"
          >
            Save Profile
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Management Section */}
      {userId && profiles.length > 0 && (
        <div className="bg-white rounded-lg border border-[#e2d4b7] p-5 mb-6">
          <h2 className="text-sm font-bold text-[#1f3b2c] mb-3 uppercase tracking-wider">Saved Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {profiles.map((profile) => (
              <div key={profile._id} className={`border rounded-lg p-3 ${selectedProfile === profile._id ? 'border-[#1f3b2c] bg-[#f0f7e6]' : 'border-[#e2d4b7]'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-[#1f3b2c] truncate">{profile.profileName}</h3>
                  {profile.isDefault && (
                    <span className="bg-[#1f3b2c] text-white text-[10px] px-1.5 py-0.5 rounded">Default</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mb-2">
                  Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => loadProfile(profile._id)}
                    className="flex-1 bg-[#1f3b2c] text-white px-2 py-1 rounded text-xs hover:bg-[#2d4f3c]"
                  >
                    Load
                  </button>
                  {!profile.isDefault && (
                    <button
                      onClick={() => setDefaultProfile(profile._id)}
                      className="px-2 py-1 border border-[#e2d4b7] text-[#1f3b2c] rounded text-xs hover:bg-gray-50 bg-white"
                    >
                      Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteProfile(profile._id)}
                    className="px-2 py-1 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 bg-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-[#e2d4b7] mb-6">
        <button
          onClick={() => setActiveTab('find')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'find'
              ? 'border-[#166534] text-[#166534]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          🔍 Find Schemes
        </button>
        <button
          onClick={() => {
            setActiveTab('recommended');
            fetchRecommended();
          }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'recommended'
              ? 'border-[#166534] text-[#166534]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          📋 Recommended by FCO {recommended.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {recommended.filter(r => r.status === 'pending' && !r.bulkApplied).length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('group_proposals');
            checkPoolStatus();
          }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'group_proposals'
              ? 'border-[#166534] text-[#166534]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          🗳️ Group Proposals {activePool && activePool.proposedSchemes && activePool.proposedSchemes.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {activePool.proposedSchemes.filter((p: any) => p.status === 'voting').length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('applied');
            fetchRecommended();
          }}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === 'applied'
              ? 'border-[#166534] text-[#166534]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          🛡️ Applied Schemes {recommended.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {recommended.filter(r => r.bulkApplied && r.status === 'interested').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'group_proposals' && (
        <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1f3b2c]">Shared Group Scheme Proposals</h2>
            <button
              onClick={checkPoolStatus}
              className="px-3 py-1.5 border border-[#e2d4b7] rounded-lg text-xs font-semibold text-[#1f3b2c] hover:bg-gray-50 bg-white"
            >
              Refresh
            </button>
          </div>

          {!activePool ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <p>You are not in a digitally collaborated farm pool group.</p>
              <p className="text-xs text-gray-400 mt-1">This tab is only available for farmers working in collaborated land pools.</p>
            </div>
          ) : !activePool.proposedSchemes || activePool.proposedSchemes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <p>No scheme proposals have been registered yet for this shared land pool group.</p>
              <p className="text-xs text-gray-400 mt-1">You can propose any scheme from the "Find Schemes" tab by clicking "Propose to Pool Group".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activePool.proposedSchemes.map((prop: any) => {
                const yesVotes = prop.votes.filter((v: any) => v.vote === 'yes').length;
                const totalMembers = activePool.participants.length;
                const hasUserVoted = prop.votes.some((v: any) => String(v.userId) === userId);
                const myVote = prop.votes.find((v: any) => String(v.userId) === userId)?.vote;

                return (
                  <div key={prop._id} className="border border-[#e2d4b7] rounded-lg p-6 bg-[#fcfbf9]/40 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${prop.status === 'approved'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : prop.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            }`}>
                            {prop.status === 'approved' ? '✓ Approved' : prop.status === 'rejected' ? '✗ Rejected' : 'Voting Active'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1f3b2c] mt-2">{prop.schemeName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Proposed by: {prop.proposerName}</p>
                      </div>

                      {/* Vote breakdown bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-500 font-semibold">
                          <span>Group Consensus: {yesVotes} of {totalMembers} voted YES</span>
                          <span>{Math.round((yesVotes / totalMembers) * 100)}% Consensus</span>
                        </div>
                        <div className="w-full h-2 bg-gray-150 rounded-full overflow-hidden border border-gray-250">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${(yesVotes / totalMembers) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-center md:items-end gap-3 min-w-[220px] border-t md:border-t-0 md:border-l border-[#e2d4b7] pt-4 md:pt-0 md:pl-6">
                      {prop.status === 'voting' ? (
                        <div className="w-full text-center space-y-2">
                          <span className="text-xs font-semibold text-gray-400 block uppercase">Cast Your Vote</span>
                          {hasUserVoted ? (
                            <div className="space-y-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${myVote === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {myVote === 'yes' ? 'Voted YES 👍' : 'Voted NO 👎'}
                              </span>
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleVoteScheme(prop._id, 'yes')}
                                  className="text-[11px] text-[#166534] hover:underline"
                                >
                                  Change to Yes
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleVoteScheme(prop._id, 'no')}
                                  className="text-[11px] text-red-600 hover:underline"
                                >
                                  Change to No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVoteScheme(prop._id, 'yes')}
                                className="flex-1 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
                              >
                                Agree 👍
                              </button>
                              <button
                                onClick={() => handleVoteScheme(prop._id, 'no')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm"
                              >
                                Disagree 👎
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full text-center p-3 rounded-xl bg-gray-50 border border-gray-150">
                          <span className="text-xs font-semibold text-gray-400 block uppercase">Consensus Status</span>
                          <span className={`text-xs font-bold block mt-1 ${prop.status === 'approved' ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {prop.status === 'approved' ? 'Unanimous Agreement Met' : 'Consensus Rejected'}
                          </span>
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

      {activeTab === 'recommended' && (
        <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1f3b2c]">Schemes Recommended for You</h2>
            <button
              onClick={fetchRecommended}
              className="px-3 py-1.5 border border-[#e2d4b7] rounded-lg text-xs font-semibold text-[#1f3b2c] hover:bg-gray-50 bg-white"
            >
              Refresh
            </button>
          </div>

          {loadingRecommended ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#166534] mb-3"></div>
              <p className="text-sm text-gray-500">Checking for FCO recommendations...</p>
            </div>
          ) : recommended.filter(r => !r.bulkApplied).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No pending schemes have been recommended to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recommended.filter(r => !r.bulkApplied).map((rec) => {
                const constraints = rec.scheme ? getSchemeConstraintsList(rec.scheme) : [];
                return (
                  <div key={rec._id} className="border border-[#e2d4b7] rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col md:flex-row justify-between gap-6 bg-[#fcfbf9]/40">
                    <div className="flex-1 space-y-4">
                      <div>
                        <span className="bg-[#f0f7e6] text-[#1f3b2c] text-[10px] font-bold px-2 py-0.5 rounded border border-[#e2d4b7] uppercase">
                          {rec.scheme?.category || 'General'}
                        </span>
                        <h3 className="text-lg font-bold text-[#1f3b2c] mt-1">{rec.scheme?.name}</h3>
                      </div>

                      {/* Display Constraints Breakdown */}
                      <div className="border-t border-dashed border-[#e2d4b7] pt-4">
                        <h4 className="text-xs font-semibold text-[#1f3b2c] uppercase tracking-wider mb-2">
                          Your Eligibility Checklist:
                        </h4>
                        {constraints.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No specific eligibility restrictions.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {constraints.map((c: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-1.5 text-xs p-2 rounded border ${c.matched === true
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : c.matched === false
                                      ? "bg-red-50 border-red-200 text-red-800"
                                      : "bg-gray-50 border-gray-200 text-gray-700"
                                  }`}
                              >
                                <span className="font-bold leading-none mt-0.5">
                                  {c.matched === true ? "✓" : c.matched === false ? "✗" : "○"}
                                </span>
                                <div>
                                  <span className="font-semibold text-gray-900">{c.label}</span>
                                  <span className="block text-[10px]">Required: {c.constraint}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-center md:items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-[#e2d4b7] pt-4 md:pt-0 md:pl-6">
                      {rec.bulkApplied ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center w-full">
                          <span className="text-xs font-bold text-green-800 block">✓ Bulk Applied</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Applied on your behalf by FCO</span>
                        </div>
                      ) : (
                        <div className="w-full space-y-2 text-center">
                          <span className="text-xs font-semibold text-gray-400 block uppercase">Your Response</span>
                          {rec.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateResponse(rec._id, 'interested')}
                                className="flex-1 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold py-2 rounded-lg transition-colors"
                              >
                                Interested 👍
                              </button>
                              <button
                                onClick={() => handleUpdateResponse(rec._id, 'not_interested')}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                              >
                                Decline 👎
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${rec.status === 'interested'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                {rec.status === 'interested' ? 'Interested 👍' : 'Declined 👎'}
                              </span>
                              <button
                                onClick={() => handleUpdateResponse(rec._id, rec.status === 'interested' ? 'not_interested' : 'interested')}
                                className="block text-[11px] text-[#166534] hover:underline mx-auto"
                              >
                                Change Response
                              </button>
                            </div>
                          )}
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

      {activeTab === 'applied' && (
        <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1f3b2c]">Your Applied Schemes</h2>
            <button
              onClick={fetchRecommended}
              className="px-3 py-1.5 border border-[#e2d4b7] rounded-lg text-xs font-semibold text-[#1f3b2c] hover:bg-gray-50 bg-white"
            >
              Refresh
            </button>
          </div>

          {loadingRecommended ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#166534] mb-3"></div>
              <p className="text-sm text-gray-500">Loading applied schemes...</p>
            </div>
          ) : recommended.filter(r => r.bulkApplied && r.status === 'interested').length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <p>No schemes have been officially applied on your behalf yet.</p>
              <p className="text-xs text-gray-400 mt-1">Once FCO completes bulk-application for schemes you marked "Interested", they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recommended.filter(r => r.bulkApplied && r.status === 'interested').map((rec) => (
                <div key={rec._id} className="border border-[#e2d4b7] rounded-lg p-6 bg-green-50/20 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase">
                      {rec.scheme?.category || 'General'}
                    </span>
                    <h3 className="text-lg font-bold text-[#1f3b2c]">{rec.scheme?.name}</h3>
                    <p className="text-xs text-gray-500">
                      Applied via Field Counseling Officer (FCO) bulk campaign on {new Date(rec.updatedAt || rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center md:items-end justify-center min-w-[180px] bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <span className="text-sm font-bold text-green-800 flex items-center gap-1">🛡️ Applied</span>
                    <span className="text-[10px] text-gray-500 mt-1">Managed securely on AgriLink ledger</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-Column Sidebar Layout */}
      {activeTab === 'find' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Sidebar: Farmer Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-[#e2d4b7] p-5 sticky top-6">
              <h2 className="text-lg font-bold text-[#1f3b2c] mb-4 pb-2 border-b border-[#e2d4b7]">Farmer Filters</h2>

              <form onSubmit={submit} className="space-y-4">
                {fields.map(f => {
                  const displayLabel = f.label.replace(/\s*\(auto-filled\)\s*/gi, '').trim();
                  const isNameOrLink = /name/i.test(displayLabel) || /link|url|website/i.test(displayLabel);
                  const isAgeField = /age/i.test(displayLabel) || f.key === "farmer_age";

                  // Specific fields check
                  const isLand = f.key === "land_size";
                  const isState = f.key === "state";
                  const isCrop = f.key === "crop_type";
                  const isSeason = f.key === "season";
                  const isIrrigation = f.key === "irrigation_type";
                  const isOrganic = f.key === "organic_certification";
                  const isGender = f.key === "gender";
                  const isIncome = f.key === "income_category";
                  const isPmKisan = f.key === "pm_kisan";
                  const isFpo = f.key === "fpo_membership";
                  const isDisaster = f.key === "disaster_affected";
                  const isSoil = f.key === "soil_type";
                  const isFarmerCategory = f.key === "farmer_category";

                  return (
                    <div key={f.key} className="space-y-1">
                      <label
                        htmlFor={`field-${f.key}`}
                        className="block text-xs font-semibold text-[#1f3b2c]"
                      >
                        {displayLabel}
                      </label>

                      {!isAgeField ? (
                        <select
                          id={`field-${f.key}`}
                          value={form[f.key] || ""}
                          onChange={(e) => handleChange(f.key, e.target.value)}
                          disabled={isNameOrLink}
                          className="w-full px-2.5 py-1.5 text-xs border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700 text-gray-700 bg-white"
                        >
                          <option value="">Select option</option>

                          {isLand && (
                            <>
                              <option value="< 1 acre">&lt; 1 acre</option>
                              <option value="1-2 acres">1-2 acres</option>
                              <option value="2-5 acres">2-5 acres</option>
                              <option value="5-10 acres">5-10 acres</option>
                              <option value="> 10 acres">&gt; 10 acres</option>
                              <option value="&gt;= 2 acres">&gt;= 2 acres</option>
                              <option value="&gt;= 5 acres">&gt;= 5 acres</option>
                              <option value="&gt;= 10 acres">&gt;= 10 acres</option>
                              <option value="No limit">No limit</option>
                            </>
                          )}

                          {isState && (
                            <>
                              <option value="Karnataka">Karnataka</option>
                              <option value="Andhra Pradesh">Andhra Pradesh</option>
                              <option value="Kerala">Kerala</option>
                              <option value="Tamil Nadu">Tamil Nadu</option>
                              <option value="Maharashtra">Maharashtra</option>
                              <option value="Uttar Pradesh">Uttar Pradesh</option>
                              <option value="Rajasthan">Rajasthan</option>
                              <option value="Goa">Goa</option>
                              <option value="Gujarat">Gujarat</option>
                            </>
                          )}

                          {isCrop && (
                            <>
                              <option value="Commercial">Commercial</option>
                              <option value="Fruits">Fruits</option>
                              <option value="Plantation">Plantation</option>
                              <option value="Pulses">Pulses</option>
                              <option value="Spices">Spices</option>
                              <option value="Vegetables">Vegetables</option>
                              <option value="Oilseeds">Oilseeds</option>
                              <option value="Grains">Grains</option>
                              <option value="Millets">Millets</option>
                              <option value="Cotton">Cotton</option>
                              <option value="Sugarcane">Sugarcane</option>
                              <option value="Paddy">Paddy</option>
                              <option value="Wheat">Wheat</option>
                              <option value="Maize">Maize</option>
                              <option value="Ragi">Ragi</option>
                              <option value="Sunflower">Sunflower</option>
                              <option value="Groundnut">Groundnut</option>
                            </>
                          )}

                          {isSeason && (
                            <>
                              <option value="Kharif">Kharif</option>
                              <option value="Rabi">Rabi</option>
                              <option value="Summer">Summer</option>
                              <option value="Annual">Annual</option>
                              <option value="Whole Year">Whole Year</option>
                            </>
                          )}

                          {isIrrigation && (
                            <>
                              <option value="Drip">Drip</option>
                              <option value="Sprinkler">Sprinkler</option>
                              <option value="Borewell">Borewell</option>
                              <option value="Rainfed">Rainfed</option>
                              <option value="Canal">Canal</option>
                              <option value="Tank-fed">Tank-fed</option>
                            </>
                          )}

                          {isOrganic && (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}

                          {isGender && (
                            <>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Both">Both</option>
                              <option value="Women">Women</option>
                            </>
                          )}

                          {isIncome && (
                            <>
                              <option value="&lt; 1,50,000">&lt; 1,50,000</option>
                              <option value="&lt; 2,00,000">&lt; 2,00,000</option>
                              <option value="&gt;= 2,00,000">&gt;= 2,00,000</option>
                              <option value="&gt;= 5,00,000">&gt;= 5,00,000</option>
                              <option value="BPL">BPL</option>
                              <option value="General">General</option>
                            </>
                          )}

                          {isPmKisan && (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}

                          {isFpo && (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}

                          {isDisaster && (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}

                          {isSoil && (
                            <>
                              <option value="Black soil">Black soil</option>
                              <option value="Red soil">Red soil</option>
                              <option value="Alluvial soil">Alluvial soil</option>
                              <option value="Laterite soil">Laterite soil</option>
                              <option value="Sandy loam">Sandy loam</option>
                            </>
                          )}

                          {isFarmerCategory && (
                            <>
                              <option value="Small and marginal">Small and marginal</option>
                              <option value="Marginal">Marginal</option>
                              <option value="Small">Small</option>
                              <option value="General">General</option>
                              <option value="SC/ST">SC/ST</option>
                              <option value="BPL">BPL</option>
                              <option value="Women">Women</option>
                            </>
                          )}

                          {/* Fallback option if none of the above matches */}
                          {!isLand && !isState && !isCrop && !isSeason && !isIrrigation && !isOrganic && !isGender && !isIncome && !isPmKisan && !isFpo && !isDisaster && !isSoil && !isFarmerCategory && (
                            <>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <input
                          id={`field-${f.key}`}
                          type="number"
                          placeholder="Enter age"
                          value={form[f.key] || ""}
                          onChange={(e) => handleChange(f.key, e.target.value)}
                          disabled={isNameOrLink}
                          className="w-full px-2.5 py-1.5 text-xs border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700 text-gray-700 bg-white"
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full border border-[#e2d4b7] text-[#1f3b2c] py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors bg-white"
                  >
                    Reset Filters
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Schemes Results List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
              <h2 className="text-xl font-semibold text-[#1f3b2c] mb-6">
                Eligible Schemes {results && `(${results.count} found)`}
              </h2>

              {results && results.eligible && (
                <div className="flex flex-wrap gap-2 mb-6 border-b border-[#e2d4b7] pb-4">
                  {["All", "General", "Agriculture", "Horticulture", "Livestock", "Sericulture", "Fisheries"].map((cat) => {
                    const count = cat === "All"
                      ? results.eligible.length
                      : results.eligible.filter(s => s.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat
                          ? "bg-[#1f3b2c] text-white shadow-sm"
                          : "bg-gray-100 text-[#1f3b2c] hover:bg-gray-200"
                          }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {!results && !loading && (
                <div className="text-center py-12">
                  <div className="text-6xl text-gray-600 mb-4">Search</div>
                  <p className="text-gray-600">Fill in your details above to find eligible government schemes</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b2c] mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching for eligible schemes...</p>
                </div>
              )}

              {results && results.eligible && (
                (() => {
                  const filtered = results.eligible.filter(s => activeCategory === "All" || s.category === activeCategory);
                  const displayed = filtered.slice(0, displayLimit);

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl text-gray-600 mb-4">No Results</div>
                        <p className="text-gray-600 mb-4">No schemes found matching your criteria in this category</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="space-y-6">
                        {displayed.map((scheme, i) => {
                          const constraints = getSchemeConstraintsList(scheme);
                          return (
                            <div key={i} className="border border-[#e2d4b7] rounded-lg p-6 hover:shadow-lg transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-[#1f3b2c] flex-1">{scheme.name}</h3>
                                  <span className="inline-block mt-1 text-xs bg-[#f0f7e6] text-[#1f3b2c] px-2 py-0.5 rounded font-medium border border-[#e2d4b7]">
                                    Category: {scheme.category}
                                  </span>
                                </div>
                                {scheme.link && (
                                  activePool ? (
                                    <button
                                      onClick={() => handleProposeSchemeToPool(String((scheme.raw as any)?._id || (scheme as any)._id || ''))}
                                      className="bg-[#1A9B9A] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#147878] transition-colors ml-4 shadow-sm"
                                    >
                                      Propose to Pool Group 🗳️
                                    </button>
                                  ) : (
                                    <a
                                      href={scheme.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-[#1f3b2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4f3c] transition-colors ml-4"
                                    >
                                      Apply Now →
                                    </a>
                                  )
                                )}
                              </div>

                              {!scheme.link && (
                                <div className="text-sm text-gray-600 mb-4">
                                  Contact your local agricultural office for application details
                                </div>
                              )}

                              {/* Visual Eligibility Gates */}
                              <div className="mt-4 border-t border-dashed border-[#e2d4b7] pt-4 mb-4">
                                <h4 className="text-xs font-semibold text-[#1f3b2c] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1f3b2c]"></span>
                                  Eligibility Requirements
                                </h4>
                                {constraints.length === 0 ? (
                                  <span className="text-xs text-gray-500 italic">No specific constraints (Open to all)</span>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {constraints.map((c: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${c.matched === true
                                          ? "bg-green-50 border-green-200 text-green-800"
                                          : c.matched === false
                                            ? "bg-red-50 border-red-200 text-red-800"
                                            : "bg-gray-50 border-gray-200 text-gray-700"
                                          }`}
                                      >
                                        <span className="font-bold text-sm leading-none mt-0.5">
                                          {c.matched === true ? "✓" : c.matched === false ? "✗" : "○"}
                                        </span>
                                        <div>
                                          <span className="font-medium block text-gray-900">{c.label}</span>
                                          <span className="block text-[11px] mt-0.5">Required: <strong className="font-semibold">{c.constraint}</strong></span>
                                          {c.input ? (
                                            <span className="block text-[10px] opacity-75 mt-0.5 font-mono">
                                              Your Input: {c.input}
                                            </span>
                                          ) : (
                                            <span className="block text-[10px] italic text-gray-400 mt-0.5">
                                              No input provided
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <details className="mt-4">
                                <summary className="cursor-pointer text-[#1f3b2c] font-medium hover:text-[#2d4f3c]">
                                  View Scheme Details
                                </summary>
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(
                                      Object.fromEntries(
                                        Object.entries(scheme.raw || {}).filter(([key]) => !/applicable\s*states/i.test(key))
                                      ),
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>

                      {filtered.length > displayLimit && (
                        <div className="text-center pt-4">
                          <button
                            type="button"
                            onClick={() => setDisplayLimit(prev => prev + 15)}
                            className="px-6 py-2.5 bg-[#1f3b2c] text-white rounded-lg font-semibold hover:bg-[#2d4f3c] transition-colors text-sm shadow-sm"
                          >
                            Load More Schemes ({filtered.length - displayLimit} remaining)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Profile Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Save Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., My Farm Profile, Kharif Season 2024"
                  className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent text-gray-700"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveAsNewProfile}
                  className="flex-1 bg-[#1f3b2c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2d4f3c]"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setProfileName('');
                  }}
                  className="flex-1 border border-[#e2d4b7] text-[#1f3b2c] px-4 py-2 rounded-lg font-medium hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
