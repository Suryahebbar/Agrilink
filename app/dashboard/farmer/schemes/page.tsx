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

  const shouldHideField = (field: SchemeField): boolean => {
    const cleanedLabel = String(field.label || '').replace(/\s*\(auto-filled\)\s*/gi, '').trim();
    const cleanedKey = String(field.key || '').trim();
    return (
      /\bscheme\s*name\b/i.test(cleanedLabel) ||
      /\bscheme\s*link\b/i.test(cleanedLabel) ||
      /\bstate\b/i.test(cleanedLabel) ||
      /(^|_)state(_|$)/i.test(cleanedKey)
    );
  };

  // Helper function to build URLs with userId (currently unused but kept for future use)
  // const buildUrl = (path: string) => {
  //   return userId ? `${path}?userId=${userId}` : path;
  // };

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

        // Force State = Karnataka (field is hidden from UI)
        if (stateField?.key) {
          initial[stateField.key] = 'Karnataka';
        }

        setForm(initial);
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
    }
  }, [userId, loadProfiles]);

  const loadProfile = async (profileId: string) => {
    const profile = profiles.find(p => p._id === profileId);
    if (profile) {
      // Strip hidden fields (Scheme Name / Scheme Link) from saved profile data
      const cleaned: Record<string, string> = {};
      fields.forEach((f) => {
        cleaned[f.key] = profile.profileData?.[f.key] ?? '';
      });

      // Force State = Karnataka (field is hidden from UI)
      if (stateFieldKey) {
        cleaned[stateFieldKey] = 'Karnataka';
      }

      setForm(cleaned);
      setSelectedProfile(profileId);
      setResults(null);
    }
  };

  const handleChange = (key: string, v: string) => {
    setForm(prev => ({ ...prev, [key]: v }));
    
    // Handle state selection to update districts
    if (/state/i.test(key)) {
      // State field is hidden and fixed to Karnataka.
      setSelectedState('Karnataka');
      if (stateFieldKey) {
        setForm(prev => ({ ...prev, [stateFieldKey]: 'Karnataka' }));
      }
    }
  };

  const submit = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    
    // Ensure State is always Karnataka (even though field is hidden)
    const farmerInput = { ...form };
    if (stateFieldKey) {
      farmerInput[stateFieldKey] = 'Karnataka';
    }

    // Build payload for new API
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
      
      // Handle profile save success/error
      if (data.profileSaveError) {
        setError(data.profileSaveError);
      } else if (data.savedProfile) {
        setSaveProfile(false);
        setProfileName('');
        setShowSaveDialog(false);
        await loadProfiles(); // Refresh profiles list
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search schemes";
      setError(errorMessage);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(Object.fromEntries(Object.keys(form).map(k => [k, ""])));
    setResults(null);
    setError(null);
    setSelectedProfile('');
    setSaveProfile(false);
    setProfileName('');
    setSelectedState('Karnataka');

    // Force State = Karnataka (field is hidden from UI)
    if (stateFieldKey) {
      setForm(prev => ({ ...prev, [stateFieldKey]: 'Karnataka' }));
    }
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1f3b2c] mb-2">Government Schemes</h1>
        <p className="text-gray-600">
          Find applicable government schemes based on your profile. Save your information for quick access in the future.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Management Section */}
      {userId && profiles.length > 0 && (
        <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Saved Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div key={profile._id} className={`border rounded-lg p-4 ${
                selectedProfile === profile._id ? 'border-[#1f3b2c] bg-[#f0f7e6]' : 'border-[#e2d4b7]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[#1f3b2c]">{profile.profileName}</h3>
                  {profile.isDefault && (
                    <span className="bg-[#1f3b2c] text-white text-xs px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadProfile(profile._id)}
                    className="flex-1 bg-[#1f3b2c] text-white px-3 py-1 rounded text-sm hover:bg-[#2d4f3c]"
                  >
                    Load
                  </button>
                  {!profile.isDefault && (
                    <button
                      onClick={() => setDefaultProfile(profile._id)}
                      className="px-3 py-1 border border-[#e2d4b7] text-[#1f3b2c] rounded text-sm hover:bg-[#f9fafb]"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteProfile(profile._id)}
                    className="px-3 py-1 border border-red-200 text-red-600 rounded text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1f3b2c]">Farmer Information</h2>
          {userId && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="bg-[#1f3b2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4f3c]"
            >
              Save Profile
            </button>
          )}
        </div>
        
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map(f => {
              const displayLabel = f.label.replace(/\s*\(auto-filled\)\s*/gi, '').trim();
              const isNameOrLink = /name/i.test(displayLabel) || /link|url|website/i.test(displayLabel);
              const numericHint = /age|income|land|size|hectare|amount|area|year|percentage|min|max|years|no_of|number/i.test(displayLabel);
              const isSelectField = /caste|gender|state|district|type|disaster/i.test(displayLabel) && !/income.*category|category.*income/i.test(displayLabel);
              const isStateField = /\bstate\b/i.test(displayLabel) || /(^|_)state(_|$)/i.test(String(f.key || ''));

              if (isStateField) {
                return null;
              }
              
              return (
                <div key={f.key} className="space-y-2">
                  <label 
                    htmlFor={`field-${f.key}`}
                    className="block text-sm font-medium text-[#1f3b2c]"
                  >
                    {displayLabel}
                  </label>
                  
                  {isSelectField ? (
                    <select
                      id={`field-${f.key}`}
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      disabled={isNameOrLink}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700 text-gray-700"
                    >
                      <option value="">Select option</option>
                      {/caste|category/i.test(displayLabel) && (
                        <>
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC">SC</option>
                          <option value="ST">ST</option>
                          <option value="EWS">EWS</option>
                        </>
                      )}
                      {/gender/i.test(displayLabel) && (
                        <>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </>
                      )}
                      {/district/i.test(displayLabel) && (
                        <>
                          {selectedState === "Andhra Pradesh" && (
                            <>
                              <option value="Anantapur">Anantapur</option>
                              <option value="Chittoor">Chittoor</option>
                              <option value="East Godavari">East Godavari</option>
                              <option value="Guntur">Guntur</option>
                              <option value="Krishna">Krishna</option>
                              <option value="Kurnool">Kurnool</option>
                              <option value="Nellore">Nellore</option>
                              <option value="Prakasam">Prakasam</option>
                              <option value="Srikakulam">Srikakulam</option>
                              <option value="Visakhapatnam">Visakhapatnam</option>
                              <option value="Vizianagaram">Vizianagaram</option>
                              <option value="West Godavari">West Godavari</option>
                              <option value="YSR Kadapa">YSR Kadapa</option>
                            </>
                          )}
                          {selectedState === "Arunachal Pradesh" && (
                            <>
                              <option value="Anjaw">Anjaw</option>
                              <option value="Changlang">Changlang</option>
                              <option value="Dibang Valley">Dibang Valley</option>
                              <option value="East Kameng">East Kameng</option>
                              <option value="East Siang">East Siang</option>
                              <option value="Itanagar Capital Complex">Itanagar Capital Complex</option>
                              <option value="Kra Daadi">Kra Daadi</option>
                              <option value="Kurung Kumey">Kurung Kumey</option>
                              <option value="Leparada">Leparada</option>
                              <option value="Lohit">Lohit</option>
                              <option value="Longding">Longding</option>
                              <option value="Lower Dibang Valley">Lower Dibang Valley</option>
                              <option value="Lower Siang">Lower Siang</option>
                              <option value="Lower Subansiri">Lower Subansiri</option>
                              <option value="Namsai">Namsai</option>
                              <option value="Papum Pare">Papum Pare</option>
                              <option value="Shi Yomi">Shi Yomi</option>
                              <option value="Siang">Siang</option>
                              <option value="Tawang">Tawang</option>
                              <option value="Tirap">Tirap</option>
                              <option value="Upper Siang">Upper Siang</option>
                              <option value="Upper Subansiri">Upper Subansiri</option>
                              <option value="West Kameng">West Kameng</option>
                              <option value="West Siang">West Siang</option>
                            </>
                          )}
                          {selectedState === "Assam" && (
                            <>
                              <option value="Baksa">Baksa</option>
                              <option value="Barpeta">Barpeta</option>
                              <option value="Biswanath">Biswanath</option>
                              <option value="Bongaigaon">Bongaigaon</option>
                              <option value="Cachar">Cachar</option>
                              <option value="Charaideo">Charaideo</option>
                              <option value="Chirang">Chirang</option>
                              <option value="Darrang">Darrang</option>
                              <option value="Dhemaji">Dhemaji</option>
                              <option value="Dhubri">Dhubri</option>
                              <option value="Dibrugarh">Dibrugarh</option>
                              <option value="Goalpara">Goalpara</option>
                              <option value="Golaghat">Golaghat</option>
                              <option value="Hailakandi">Hailakandi</option>
                              <option value="Hojai">Hojai</option>
                              <option value="Jorhat">Jorhat</option>
                              <option value="Kamrup Metropolitan">Kamrup Metropolitan</option>
                              <option value="Kamrup Rural">Kamrup Rural</option>
                              <option value="Karbi Anglong">Karbi Anglong</option>
                              <option value="Karimganj">Karimganj</option>
                              <option value="Kokrajhar">Kokrajhar</option>
                              <option value="Lakhimpur">Lakhimpur</option>
                              <option value="Majuli">Majuli</option>
                              <option value="Morigaon">Morigaon</option>
                              <option value="Nagaon">Nagaon</option>
                              <option value="Nalbari">Nalbari</option>
                              <option value="Sivasagar">Sivasagar</option>
                              <option value="Sonitpur">Sonitpur</option>
                              <option value="South Salmara-Mankachar">South Salmara-Mankachar</option>
                              <option value="Tinsukia">Tinsukia</option>
                              <option value="Udalguri">Udalguri</option>
                              <option value="West Karbi Anglong">West Karbi Anglong</option>
                            </>
                          )}
                          {selectedState === "Bihar" && (
                            <>
                              <option value="Araria">Araria</option>
                              <option value="Arwal">Arwal</option>
                              <option value="Aurangabad">Aurangabad</option>
                              <option value="Banka">Banka</option>
                              <option value="Begusarai">Begusarai</option>
                              <option value="Bhagalpur">Bhagalpur</option>
                              <option value="Bhojpur">Bhojpur</option>
                              <option value="Buxar">Buxar</option>
                              <option value="Darbhanga">Darbhanga</option>
                              <option value="East Champaran">East Champaran</option>
                              <option value="Gaya">Gaya</option>
                              <option value="Gopalganj">Gopalganj</option>
                              <option value="Jamui">Jamui</option>
                              <option value="Jehanabad">Jehanabad</option>
                              <option value="Kaimur">Kaimur</option>
                              <option value="Katihar">Katihar</option>
                              <option value="Khagaria">Khagaria</option>
                              <option value="Kishanganj">Kishanganj</option>
                              <option value="Lakhisarai">Lakhisarai</option>
                              <option value="Madhepura">Madhepura</option>
                              <option value="Madhubani">Madhubani</option>
                              <option value="Munger">Munger</option>
                              <option value="Muzaffarpur">Muzaffarpur</option>
                              <option value="Nalanda">Nalanda</option>
                              <option value="Nawada">Nawada</option>
                              <option value="Patna">Patna</option>
                              <option value="Purnia">Purnia</option>
                              <option value="Rohtas">Rohtas</option>
                              <option value="Saharsa">Saharsa</option>
                              <option value="Samastipur">Samastipur</option>
                              <option value="Saran">Saran</option>
                              <option value="Sheikhpura">Sheikhpura</option>
                              <option value="Sheohar">Sheohar</option>
                              <option value="Sitamarhi">Sitamarhi</option>
                              <option value="Siwan">Siwan</option>
                              <option value="Supaul">Supaul</option>
                              <option value="Vaishali">Vaishali</option>
                              <option value="West Champaran">West Champaran</option>
                            </>
                          )}
                          {selectedState === "Chhattisgarh" && (
                            <>
                              <option value="Balod">Balod</option>
                              <option value="Baloda Bazar">Baloda Bazar</option>
                              <option value="Bastar">Bastar</option>
                              <option value="Bemetara">Bemetara</option>
                              <option value="Bilaspur">Bilaspur</option>
                              <option value="Dantewada">Dantewada</option>
                              <option value="Dhamtari">Dhamtari</option>
                              <option value="Durg">Durg</option>
                              <option value="Gariaband">Gariaband</option>
                              <option value="Janjgir-Champa">Janjgir-Champa</option>
                              <option value="Jashpur">Jashpur</option>
                              <option value="Kabeerdham">Kabeerdham</option>
                              <option value="Kanker">Kanker</option>
                              <option value="Kondagaon">Kondagaon</option>
                              <option value="Korba">Korba</option>
                              <option value="Koriya">Koriya</option>
                              <option value="Mahasamund">Mahasamund</option>
                              <option value="Mungeli">Mungeli</option>
                              <option value="Narayanpur">Narayanpur</option>
                              <option value="Raigarh">Raigarh</option>
                              <option value="Raipur">Raipur</option>
                              <option value="Rajnandgaon">Rajnandgaon</option>
                              <option value="Sukma">Sukma</option>
                              <option value="Surajpur">Surajpur</option>
                              <option value="Surguja">Surguja</option>
                            </>
                          )}
                          {selectedState === "Goa" && (
                            <>
                              <option value="North Goa">North Goa</option>
                              <option value="South Goa">South Goa</option>
                            </>
                          )}
                          {selectedState === "Gujarat" && (
                            <>
                              <option value="Ahmedabad">Ahmedabad</option>
                              <option value="Amreli">Amreli</option>
                              <option value="Anand">Anand</option>
                              <option value="Aravalli">Aravalli</option>
                              <option value="Banaskantha">Banaskantha</option>
                              <option value="Bharuch">Bharuch</option>
                              <option value="Bhavnagar">Bhavnagar</option>
                              <option value="Botad">Botad</option>
                              <option value="Chhota Udepur">Chhota Udepur</option>
                              <option value="Dahod">Dahod</option>
                              <option value="Devbhumi Dwarka">Devbhumi Dwarka</option>
                              <option value="Gandhinagar">Gandhinagar</option>
                              <option value="Gir Somnath">Gir Somnath</option>
                              <option value="Jamnagar">Jamnagar</option>
                              <option value="Junagadh">Junagadh</option>
                              <option value="Kachchh">Kachchh</option>
                              <option value="Kheda">Kheda</option>
                              <option value="Mahisagar">Mahisagar</option>
                              <option value="Mehsana">Mehsana</option>
                              <option value="Morbi">Morbi</option>
                              <option value="Narmada">Narmada</option>
                              <option value="Navsari">Navsari</option>
                              <option value="Panchmahal">Panchmahal</option>
                              <option value="Patan">Patan</option>
                              <option value="Porbandar">Porbandar</option>
                              <option value="Rajkot">Rajkot</option>
                              <option value="Sabarkantha">Sabarkantha</option>
                              <option value="Surat">Surat</option>
                              <option value="Surendranagar">Surendranagar</option>
                              <option value="Tapi">Tapi</option>
                              <option value="Vadodara">Vadodara</option>
                              <option value="Valsad">Valsad</option>
                            </>
                          )}
                          {selectedState === "Haryana" && (
                            <>
                              <option value="Ambala">Ambala</option>
                              <option value="Bhiwani">Bhiwani</option>
                              <option value="Charkhi Dadri">Charkhi Dadri</option>
                              <option value="Faridabad">Faridabad</option>
                              <option value="Fatehabad">Fatehabad</option>
                              <option value="Gurugram">Gurugram</option>
                              <option value="Hisar">Hisar</option>
                              <option value="Jhajjar">Jhajjar</option>
                              <option value="Jind">Jind</option>
                              <option value="Kaithal">Kaithal</option>
                              <option value="Karnal">Karnal</option>
                              <option value="Kurukshetra">Kurukshetra</option>
                              <option value="Mahendragarh">Mahendragarh</option>
                              <option value="Nuh">Nuh</option>
                              <option value="Palwal">Palwal</option>
                              <option value="Panchkula">Panchkula</option>
                              <option value="Panipat">Panipat</option>
                              <option value="Rewari">Rewari</option>
                              <option value="Rohtak">Rohtak</option>
                              <option value="Sirsa">Sirsa</option>
                              <option value="Sonipat">Sonipat</option>
                              <option value="Yamunanagar">Yamunanagar</option>
                            </>
                          )}
                          {selectedState === "Himachal Pradesh" && (
                            <>
                              <option value="Bilaspur">Bilaspur</option>
                              <option value="Chamba">Chamba</option>
                              <option value="Hamirpur">Hamirpur</option>
                              <option value="Kangra">Kangra</option>
                              <option value="Kinnaur">Kinnaur</option>
                              <option value="Kullu">Kullu</option>
                              <option value="Lahaul and Spiti">Lahaul and Spiti</option>
                              <option value="Mandi">Mandi</option>
                              <option value="Shimla">Shimla</option>
                              <option value="Sirmaur">Sirmaur</option>
                              <option value="Solan">Solan</option>
                              <option value="Una">Una</option>
                            </>
                          )}
                          {selectedState === "Jharkhand" && (
                            <>
                              <option value="Bokaro">Bokaro</option>
                              <option value="Chatra">Chatra</option>
                              <option value="Deoghar">Deoghar</option>
                              <option value="Dhanbad">Dhanbad</option>
                              <option value="Dumka">Dumka</option>
                              <option value="East Singhbhum">East Singhbhum</option>
                              <option value="Garhwa">Garhwa</option>
                              <option value="Giridih">Giridih</option>
                              <option value="Godda">Godda</option>
                              <option value="Gumla">Gumla</option>
                              <option value="Hazaribagh">Hazaribagh</option>
                              <option value="Jamtara">Jamtara</option>
                              <option value="Khunti">Khunti</option>
                              <option value="Koderma">Koderma</option>
                              <option value="Latehar">Latehar</option>
                              <option value="Lohardaga">Lohardaga</option>
                              <option value="Pakur">Pakur</option>
                              <option value="Palamu">Palamu</option>
                              <option value="Ramgarh">Ramgarh</option>
                              <option value="Ranchi">Ranchi</option>
                              <option value="Sahibganj">Sahibganj</option>
                              <option value="Saraikela Kharsawan">Saraikela Kharsawan</option>
                              <option value="Simdega">Simdega</option>
                              <option value="West Singhbhum">West Singhbhum</option>
                            </>
                          )}
                          {selectedState === "Karnataka" && (
                            <>
                              <option value="Bagalkot">Bagalkot</option>
                              <option value="Ballari">Ballari</option>
                              <option value="Belagavi">Belagavi</option>
                              <option value="Bengaluru Rural">Bengaluru Rural</option>
                              <option value="Bengaluru Urban">Bengaluru Urban</option>
                              <option value="Bidar">Bidar</option>
                              <option value="Chamarajanagara">Chamarajanagara</option>
                              <option value="Chikballapur">Chikballapur</option>
                              <option value="Chikkamagaluru">Chikkamagaluru</option>
                              <option value="Chitradurga">Chitradurga</option>
                              <option value="Dakshina Kannada">Dakshina Kannada</option>
                              <option value="Davangere">Davangere</option>
                              <option value="Dharwad">Dharwad</option>
                              <option value="Gadag">Gadag</option>
                              <option value="Hassan">Hassan</option>
                              <option value="Haveri">Haveri</option>
                              <option value="Kalaburagi">Kalaburagi</option>
                              <option value="Kodagu">Kodagu</option>
                              <option value="Kolar">Kolar</option>
                              <option value="Koppal">Koppal</option>
                              <option value="Mandya">Mandya</option>
                              <option value="Mysuru">Mysuru</option>
                              <option value="Raichur">Raichur</option>
                              <option value="Ramanagara">Ramanagara</option>
                              <option value="Shivamogga">Shivamogga</option>
                              <option value="Tumakuru">Tumakuru</option>
                              <option value="Udupi">Udupi</option>
                              <option value="Uttara Kannada">Uttara Kannada</option>
                              <option value="Vijayapura">Vijayapura</option>
                              <option value="Yadgir">Yadgir</option>
                            </>
                          )}
                          {selectedState === "Kerala" && (
                            <>
                              <option value="Alappuzha">Alappuzha</option>
                              <option value="Ernakulam">Ernakulam</option>
                              <option value="Idukki">Idukki</option>
                              <option value="Kannur">Kannur</option>
                              <option value="Kasaragod">Kasaragod</option>
                              <option value="Kollam">Kollam</option>
                              <option value="Kottayam">Kottayam</option>
                              <option value="Kozhikode">Kozhikode</option>
                              <option value="Malappuram">Malappuram</option>
                              <option value="Palakkad">Palakkad</option>
                              <option value="Pathanamthitta">Pathanamthitta</option>
                              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                              <option value="Thrissur">Thrissur</option>
                              <option value="Wayanad">Wayanad</option>
                            </>
                          )}
                          {selectedState === "Madhya Pradesh" && (
                            <>
                              <option value="Agar Malwa">Agar Malwa</option>
                              <option value="Alirajpur">Alirajpur</option>
                              <option value="Anuppur">Anuppur</option>
                              <option value="Ashoknagar">Ashoknagar</option>
                              <option value="Balaghat">Balaghat</option>
                              <option value="Barwani">Barwani</option>
                              <option value="Betul">Betul</option>
                              <option value="Bhind">Bhind</option>
                              <option value="Bhopal">Bhopal</option>
                              <option value="Burhanpur">Burhanpur</option>
                              <option value="Chhatarpur">Chhatarpur</option>
                              <option value="Chhindwara">Chhindwara</option>
                              <option value="Damoh">Damoh</option>
                              <option value="Datia">Datia</option>
                              <option value="Dewas">Dewas</option>
                              <option value="Dhar">Dhar</option>
                              <option value="Dindori">Dindori</option>
                              <option value="Guna">Guna</option>
                              <option value="Gwalior">Gwalior</option>
                              <option value="Harda">Harda</option>
                              <option value="Hoshangabad">Hoshangabad</option>
                              <option value="Indore">Indore</option>
                              <option value="Jabalpur">Jabalpur</option>
                              <option value="Jhabua">Jhabua</option>
                              <option value="Katni">Katni</option>
                              <option value="Khandwa">Khandwa</option>
                              <option value="Khargone">Khargone</option>
                              <option value="Mandla">Mandla</option>
                              <option value="Mandsaur">Mandsaur</option>
                              <option value="Morena">Morena</option>
                              <option value="Narsinghpur">Narsinghpur</option>
                              <option value="Neemuch">Neemuch</option>
                              <option value="Panna">Panna</option>
                              <option value="Raisen">Raisen</option>
                              <option value="Rajgarh">Rajgarh</option>
                              <option value="Ratlam">Ratlam</option>
                              <option value="Rewa">Rewa</option>
                              <option value="Sagar">Sagar</option>
                              <option value="Satna">Satna</option>
                              <option value="Sehore">Sehore</option>
                              <option value="Seoni">Seoni</option>
                              <option value="Shahdol">Shahdol</option>
                              <option value="Shajapur">Shajapur</option>
                              <option value="Sheopur">Sheopur</option>
                              <option value="Shivpuri">Shivpuri</option>
                              <option value="Sidhi">Sidhi</option>
                              <option value="Singrauli">Singrauli</option>
                              <option value="Tikamgarh">Tikamgarh</option>
                              <option value="Ujjain">Ujjain</option>
                              <option value="Umaria">Umaria</option>
                              <option value="Vidisha">Vidisha</option>
                            </>
                          )}
                          {selectedState === "Maharashtra" && (
                            <>
                              <option value="Ahmednagar">Ahmednagar</option>
                              <option value="Akola">Akola</option>
                              <option value="Amravati">Amravati</option>
                              <option value="Aurangabad">Aurangabad</option>
                              <option value="Beed">Beed</option>
                              <option value="Bhandara">Bhandara</option>
                              <option value="Buldhana">Buldhana</option>
                              <option value="Chandrapur">Chandrapur</option>
                              <option value="Dhule">Dhule</option>
                              <option value="Gadchiroli">Gadchiroli</option>
                              <option value="Gondia">Gondia</option>
                              <option value="Hingoli">Hingoli</option>
                              <option value="Jalgaon">Jalgaon</option>
                              <option value="Jalna">Jalna</option>
                              <option value="Kolhapur">Kolhapur</option>
                              <option value="Latur">Latur</option>
                              <option value="Mumbai City">Mumbai City</option>
                              <option value="Mumbai Suburban">Mumbai Suburban</option>
                              <option value="Nagpur">Nagpur</option>
                              <option value="Nanded">Nanded</option>
                              <option value="Nandurbar">Nandurbar</option>
                              <option value="Nashik">Nashik</option>
                              <option value="Osmanabad">Osmanabad</option>
                              <option value="Palghar">Palghar</option>
                              <option value="Parbhani">Parbhani</option>
                              <option value="Pune">Pune</option>
                              <option value="Raigad">Raigad</option>
                              <option value="Ratnagiri">Ratnagiri</option>
                              <option value="Sangli">Sangli</option>
                              <option value="Satara">Satara</option>
                              <option value="Solapur">Solapur</option>
                              <option value="Thane">Thane</option>
                              <option value="Wardha">Wardha</option>
                              <option value="Washim">Washim</option>
                              <option value="Yavatmal">Yavatmal</option>
                            </>
                          )}
                          {selectedState === "Manipur" && (
                            <>
                              <option value="Bishnupur">Bishnupur</option>
                              <option value="Chandel">Chandel</option>
                              <option value="Churachandpur">Churachandpur</option>
                              <option value="Imphal East">Imphal East</option>
                              <option value="Imphal West">Imphal West</option>
                              <option value="Jiribam">Jiribam</option>
                              <option value="Kakching">Kakching</option>
                              <option value="Kangpokpi">Kangpokpi</option>
                              <option value="Kamjong">Kamjong</option>
                              <option value="None">None</option>
                              <option value="Pherzawl">Pherzawl</option>
                              <option value="Senapati">Senapati</option>
                              <option value="Tamenglong">Tamenglong</option>
                              <option value="Tengnoupal">Tengnoupal</option>
                              <option value="Thoubal">Thoubal</option>
                              <option value="Ukhrul">Ukhrul</option>
                            </>
                          )}
                          {selectedState === "Meghalaya" && (
                            <>
                              <option value="East Garo Hills">East Garo Hills</option>
                              <option value="East Jaintia Hills">East Jaintia Hills</option>
                              <option value="East Khasi Hills">East Khasi Hills</option>
                              <option value="North Garo Hills">North Garo Hills</option>
                              <option value="Ri Bhoi">Ri Bhoi</option>
                              <option value="South Garo Hills">South Garo Hills</option>
                              <option value="South West Garo Hills">South West Garo Hills</option>
                              <option value="South West Khasi Hills">South West Khasi Hills</option>
                              <option value="West Garo Hills">West Garo Hills</option>
                              <option value="West Jaintia Hills">West Jaintia Hills</option>
                              <option value="West Khasi Hills">West Khasi Hills</option>
                            </>
                          )}
                          {selectedState === "Mizoram" && (
                            <>
                              <option value="Aizawl">Aizawl</option>
                              <option value="Champhai">Champhai</option>
                              <option value="Kolasib">Kolasib</option>
                              <option value="Lawngtlai">Lawngtlai</option>
                              <option value="Lunglei">Lunglei</option>
                              <option value="Mamit">Mamit</option>
                              <option value="Saiha">Saiha</option>
                              <option value="Serchhip">Serchhip</option>
                            </>
                          )}
                          {selectedState === "Nagaland" && (
                            <>
                              <option value="Dimapur">Dimapur</option>
                              <option value="Kiphire">Kiphire</option>
                              <option value="Kohima">Kohima</option>
                              <option value="Longleng">Longleng</option>
                              <option value="Mokokchung">Mokokchung</option>
                              <option value="Mon">Mon</option>
                              <option value="Peren">Peren</option>
                              <option value="Phek">Phek</option>
                              <option value="Tuensang">Tuensang</option>
                              <option value="Wokha">Wokha</option>
                              <option value="Zunheboto">Zunheboto</option>
                            </>
                          )}
                          {selectedState === "Odisha" && (
                            <>
                              <option value="Angul">Angul</option>
                              <option value="Balangir">Balangir</option>
                              <option value="Balasore">Balasore</option>
                              <option value="Bargarh">Bargarh</option>
                              <option value="Bhadrak">Bhadrak</option>
                              <option value="Boudh">Boudh</option>
                              <option value="Cuttack">Cuttack</option>
                              <option value="Deogarh">Deogarh</option>
                              <option value="Dhenkanal">Dhenkanal</option>
                              <option value="Gajapati">Gajapati</option>
                              <option value="Ganjam">Ganjam</option>
                              <option value="Jagatsinghpur">Jagatsinghpur</option>
                              <option value="Jajpur">Jajpur</option>
                              <option value="Jharsuguda">Jharsuguda</option>
                              <option value="Kalahandi">Kalahandi</option>
                              <option value="Kandhamal">Kandhamal</option>
                              <option value="Kendrapara">Kendrapara</option>
                              <option value="Kendujhar">Kendujhar</option>
                              <option value="Khordha">Khordha</option>
                              <option value="Koraput">Koraput</option>
                              <option value="Malkangiri">Malkangiri</option>
                              <option value="Mayurbhanj">Mayurbhanj</option>
                              <option value="Nabarangpur">Nabarangpur</option>
                              <option value="Nayagarh">Nayagarh</option>
                              <option value="Nuapada">Nuapada</option>
                              <option value="Puri">Puri</option>
                              <option value="Rayagada">Rayagada</option>
                              <option value="Sambalpur">Sambalpur</option>
                              <option value="Sonepur">Sonepur</option>
                              <option value="Sundargarh">Sundargarh</option>
                            </>
                          )}
                          {selectedState === "Punjab" && (
                            <>
                              <option value="Amritsar">Amritsar</option>
                              <option value="Barnala">Barnala</option>
                              <option value="Bathinda">Bathinda</option>
                              <option value="Faridkot">Faridkot</option>
                              <option value="Fatehgarh Sahib">Fatehgarh Sahib</option>
                              <option value="Fazilka">Fazilka</option>
                              <option value="Ferozepur">Ferozepur</option>
                              <option value="Gurdaspur">Gurdaspur</option>
                              <option value="Hoshiarpur">Hoshiarpur</option>
                              <option value="Jalandhar">Jalandhar</option>
                              <option value="Kapurthala">Kapurthala</option>
                              <option value="Ludhiana">Ludhiana</option>
                              <option value="Mansa">Mansa</option>
                              <option value="Moga">Moga</option>
                              <option value="Muktsar">Muktsar</option>
                              <option value="Nawanshahr">Nawanshahr</option>
                              <option value="Pathankot">Pathankot</option>
                              <option value="Patiala">Patiala</option>
                              <option value="Rupnagar">Rupnagar</option>
                              <option value="Sahibzada Ajit Singh Nagar">Sahibzada Ajit Singh Nagar</option>
                              <option value="Sangrur">Sangrur</option>
                              <option value="Shahid Bhagat Singh Nagar">Shahid Bhagat Singh Nagar</option>
                              <option value="Sri Muktsar Sahib">Sri Muktsar Sahib</option>
                              <option value="Tarn Taran">Tarn Taran</option>
                            </>
                          )}
                          {selectedState === "Rajasthan" && (
                            <>
                              <option value="Ajmer">Ajmer</option>
                              <option value="Alwar">Alwar</option>
                              <option value="Banswara">Banswara</option>
                              <option value="Baran">Baran</option>
                              <option value="Barmer">Barmer</option>
                              <option value="Bharatpur">Bharatpur</option>
                              <option value="Bhilwara">Bhilwara</option>
                              <option value="Bikaner">Bikaner</option>
                              <option value="Bundi">Bundi</option>
                              <option value="Chittorgarh">Chittorgarh</option>
                              <option value="Churu">Churu</option>
                              <option value="Dausa">Dausa</option>
                              <option value="Dholpur">Dholpur</option>
                              <option value="Dungarpur">Dungarpur</option>
                              <option value="Hanumangarh">Hanumangarh</option>
                              <option value="Jaipur">Jaipur</option>
                              <option value="Jaisalmer">Jaisalmer</option>
                              <option value="Jalore">Jalore</option>
                              <option value="Jhalawar">Jhalawar</option>
                              <option value="Jhunjhunu">Jhunjhunu</option>
                              <option value="Jodhpur">Jodhpur</option>
                              <option value="Karauli">Karauli</option>
                              <option value="Kota">Kota</option>
                              <option value="Nagaur">Nagaur</option>
                              <option value="Pali">Pali</option>
                              <option value="Pratapgarh">Pratapgarh</option>
                              <option value="Rajsamand">Rajsamand</option>
                              <option value="Sawai Madhopur">Sawai Madhopur</option>
                              <option value="Sikar">Sikar</option>
                              <option value="Sirohi">Sirohi</option>
                              <option value="Sriganganagar">Sriganganagar</option>
                              <option value="Tonk">Tonk</option>
                              <option value="Udaipur">Udaipur</option>
                            </>
                          )}
                          {selectedState === "Sikkim" && (
                            <>
                              <option value="East Sikkim">East Sikkim</option>
                              <option value="North Sikkim">North Sikkim</option>
                              <option value="South Sikkim">South Sikkim</option>
                              <option value="West Sikkim">West Sikkim</option>
                            </>
                          )}
                          {selectedState === "Tamil Nadu" && (
                            <>
                              <option value="Ariyalur">Ariyalur</option>
                              <option value="Chengalpattu">Chengalpattu</option>
                              <option value="Chennai">Chennai</option>
                              <option value="Coimbatore">Coimbatore</option>
                              <option value="Cuddalore">Cuddalore</option>
                              <option value="Dharmapuri">Dharmapuri</option>
                              <option value="Dindigul">Dindigul</option>
                              <option value="Erode">Erode</option>
                              <option value="Kallakurichi">Kallakurichi</option>
                              <option value="Kanchipuram">Kanchipuram</option>
                              <option value="Kanyakumari">Kanyakumari</option>
                              <option value="Karur">Karur</option>
                              <option value="Krishnagiri">Krishnagiri</option>
                              <option value="Madurai">Madurai</option>
                              <option value="Nagapattinam">Nagapattinam</option>
                              <option value="Namakkal">Namakkal</option>
                              <option value="Nilgiris">Nilgiris</option>
                              <option value="Perambalur">Perambalur</option>
                              <option value="Pudukkottai">Pudukkottai</option>
                              <option value="Ramanathapuram">Ramanathapuram</option>
                              <option value="Ranipet">Ranipet</option>
                              <option value="Salem">Salem</option>
                              <option value="Sivaganga">Sivaganga</option>
                              <option value="Tenkasi">Tenkasi</option>
                              <option value="Thanjavur">Thanjavur</option>
                              <option value="Theni">Theni</option>
                              <option value="Thoothukudi">Thoothukudi</option>
                              <option value="Tiruchirappalli">Tiruchirappalli</option>
                              <option value="Tirunelveli">Tirunelveli</option>
                              <option value="Tirupathur">Tirupathur</option>
                              <option value="Tiruppur">Tiruppur</option>
                              <option value="Tiruvallur">Tiruvallur</option>
                              <option value="Tiruvannamalai">Tiruvannamalai</option>
                              <option value="Tiruvarur">Tiruvarur</option>
                              <option value="Vellore">Vellore</option>
                              <option value="Viluppuram">Viluppuram</option>
                              <option value="Virudhunagar">Virudhunagar</option>
                            </>
                          )}
                          {selectedState === "Telangana" && (
                            <>
                              <option value="Adilabad">Adilabad</option>
                              <option value="Bhadradri Kothagudem">Bhadradri Kothagudem</option>
                              <option value="Hyderabad">Hyderabad</option>
                              <option value="Jagtial">Jagtial</option>
                              <option value="Jangaon">Jangaon</option>
                              <option value="Jayashankar Bhupalpally">Jayashankar Bhupalpally</option>
                              <option value="Jogulamba Gadwal">Jogulamba Gadwal</option>
                              <option value="Kamareddy">Kamareddy</option>
                              <option value="Karimnagar">Karimnagar</option>
                              <option value="Khammam">Khammam</option>
                              <option value="Kumuram Bheem">Kumuram Bheem</option>
                              <option value="Mahabubabad">Mahabubabad</option>
                              <option value="Mahabubnagar">Mahabubnagar</option>
                              <option value="Mancherial">Mancherial</option>
                              <option value="Medak">Medak</option>
                              <option value="Medchal Malkajgiri">Medchal Malkajgiri</option>
                              <option value="Mulugu">Mulugu</option>
                              <option value="Nagarkurnool">Nagarkurnool</option>
                              <option value="Nalgonda">Nalgonda</option>
                              <option value="Narayanpet">Narayanpet</option>
                              <option value="Nirmal">Nirmal</option>
                              <option value="Nizamabad">Nizamabad</option>
                              <option value="Peddapalli">Peddapalli</option>
                              <option value="Rajanna Sircilla">Rajanna Sircilla</option>
                              <option value="Rangareddy">Rangareddy</option>
                              <option value="Sangareddy">Sangareddy</option>
                              <option value="Siddipet">Siddipet</option>
                              <option value="Suryapet">Suryapet</option>
                              <option value="Vikarabad">Vikarabad</option>
                              <option value="Wanaparthy">Wanaparthy</option>
                              <option value="Warangal Rural">Warangal Rural</option>
                              <option value="Warangal Urban">Warangal Urban</option>
                              <option value="Yadadri Bhongir">Yadadri Bhongir</option>
                            </>
                          )}
                          {selectedState === "Tripura" && (
                            <>
                              <option value="Dhalai">Dhalai</option>
                              <option value="Gomati">Gomati</option>
                              <option value="Khowai">Khowai</option>
                              <option value="North Tripura">North Tripura</option>
                              <option value="Sepahijala">Sepahijala</option>
                              <option value="South Tripura">South Tripura</option>
                              <option value="Unakoti">Unakoti</option>
                              <option value="West Tripura">West Tripura</option>
                            </>
                          )}
                          {selectedState === "Uttar Pradesh" && (
                            <>
                              <option value="Agra">Agra</option>
                              <option value="Aligarh">Aligarh</option>
                              <option value="Allahabad">Allahabad</option>
                              <option value="Ambedkar Nagar">Ambedkar Nagar</option>
                              <option value="Amethi">Amethi</option>
                              <option value="Amroha">Amroha</option>
                              <option value="Auraiya">Auraiya</option>
                              <option value="Ayodhya">Ayodhya</option>
                              <option value="Azamgarh">Azamgarh</option>
                              <option value="Baghpat">Baghpat</option>
                              <option value="Bahraich">Bahraich</option>
                              <option value="Ballia">Ballia</option>
                              <option value="Balrampur">Balrampur</option>
                              <option value="Banda">Banda</option>
                              <option value="Barabanki">Barabanki</option>
                              <option value="Bareilly">Bareilly</option>
                              <option value="Basti">Basti</option>
                              <option value="Bhadohi">Bhadohi</option>
                              <option value="Bijnor">Bijnor</option>
                              <option value="Budaun">Budaun</option>
                              <option value="Bulandshahr">Bulandshahr</option>
                              <option value="Chandauli">Chandauli</option>
                              <option value="Chitrakoot">Chitrakoot</option>
                              <option value="Deoria">Deoria</option>
                              <option value="Etah">Etah</option>
                              <option value="Etawah">Etawah</option>
                              <option value="Farrukhabad">Farrukhabad</option>
                              <option value="Fatehpur">Fatehpur</option>
                              <option value="Firozabad">Firozabad</option>
                              <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                              <option value="Ghaziabad">Ghaziabad</option>
                              <option value="Ghazipur">Ghazipur</option>
                              <option value="Gonda">Gonda</option>
                              <option value="Gorakhpur">Gorakhpur</option>
                              <option value="Hamirpur">Hamirpur</option>
                              <option value="Hapur">Hapur</option>
                              <option value="Hardoi">Hardoi</option>
                              <option value="Hathras">Hathras</option>
                              <option value="Jalaun">Jalaun</option>
                              <option value="Jaunpur">Jaunpur</option>
                              <option value="Jhansi">Jhansi</option>
                              <option value="Kannauj">Kannauj</option>
                              <option value="Kanpur Dehat">Kanpur Dehat</option>
                              <option value="Kanpur Nagar">Kanpur Nagar</option>
                              <option value="Kasganj">Kasganj</option>
                              <option value="Kaushambi">Kaushambi</option>
                              <option value="Kheri">Kheri</option>
                              <option value="Kushinagar">Kushinagar</option>
                              <option value="Lakhimpur Kheri">Lakhimpur Kheri</option>
                              <option value="Lalitpur">Lalitpur</option>
                              <option value="Lucknow">Lucknow</option>
                              <option value="Mau">Mau</option>
                              <option value="Meerut">Meerut</option>
                              <option value="Mirzapur">Mirzapur</option>
                              <option value="Moradabad">Moradabad</option>
                              <option value="Muzaffarnagar">Muzaffarnagar</option>
                              <option value="Pilibhit">Pilibhit</option>
                              <option value="Pratapgarh">Pratapgarh</option>
                              <option value="Prayagraj">Prayagraj</option>
                              <option value="Rae Bareli">Rae Bareli</option>
                              <option value="Rampur">Rampur</option>
                              <option value="Saharanpur">Saharanpur</option>
                              <option value="Sambhal">Sambhal</option>
                              <option value="Shahjahanpur">Shahjahanpur</option>
                              <option value="Shravasti">Shravasti</option>
                              <option value="Siddharthnagar">Siddharthnagar</option>
                              <option value="Sitapur">Sitapur</option>
                              <option value="Sonbhadra">Sonbhadra</option>
                              <option value="Sultanpur">Sultanpur</option>
                              <option value="Unnao">Unnao</option>
                              <option value="Varanasi">Varanasi</option>
                            </>
                          )}
                          {selectedState === "Uttarakhand" && (
                            <>
                              <option value="Almora">Almora</option>
                              <option value="Bageshwar">Bageshwar</option>
                              <option value="Chamoli">Chamoli</option>
                              <option value="Champawat">Champawat</option>
                              <option value="Dehradun">Dehradun</option>
                              <option value="Haridwar">Haridwar</option>
                              <option value="Nainital">Nainital</option>
                              <option value="Pauri Garhwal">Pauri Garhwal</option>
                              <option value="Pithoragarh">Pithoragarh</option>
                              <option value="Rudraprayag">Rudraprayag</option>
                              <option value="Tehri Garhwal">Tehri Garhwal</option>
                              <option value="Udham Singh Nagar">Udham Singh Nagar</option>
                              <option value="Uttarkashi">Uttarkashi</option>
                            </>
                          )}
                          {selectedState === "West Bengal" && (
                            <>
                              <option value="Alipurduar">Alipurduar</option>
                              <option value="Bankura">Bankura</option>
                              <option value="Birbhum">Birbhum</option>
                              <option value="Cooch Behar">Cooch Behar</option>
                              <option value="Dakshin Dinajpur">Dakshin Dinajpur</option>
                              <option value="Darjeeling">Darjeeling</option>
                              <option value="Hooghly">Hooghly</option>
                              <option value="Howrah">Howrah</option>
                              <option value="Jalpaiguri">Jalpaiguri</option>
                              <option value="Jhargram">Jhargram</option>
                              <option value="Kalimpong">Kalimpong</option>
                              <option value="Kolkata">Kolkata</option>
                              <option value="Malda">Malda</option>
                              <option value="Murshidabad">Murshidabad</option>
                              <option value="Nadia">Nadia</option>
                              <option value="North 24 Parganas">North 24 Parganas</option>
                              <option value="Paschim Bardhaman">Paschim Bardhaman</option>
                              <option value="Paschim Medinipur">Paschim Medinipur</option>
                              <option value="Purba Bardhaman">Purba Bardhaman</option>
                              <option value="Purba Medinipur">Purba Medinipur</option>
                              <option value="Purulia">Purulia</option>
                              <option value="South 24 Parganas">South 24 Parganas</option>
                              <option value="Uttar Dinajpur">Uttar Dinajpur</option>
                            </>
                          )}
                          {!selectedState && (
                            <option value="" disabled>Select a state first</option>
                          )}
                          {selectedState && !["Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra", "Uttar Pradesh"].includes(selectedState) && (
                            <option value="Other">Other District</option>
                          )}
                        </>
                      )}
                      {/crop/i.test(displayLabel) && (
                        <>
                          <option value="Commercial">Commercial</option>
                          <option value="Fruits">Fruits</option>
                          <option value="Plantation">Plantation</option>
                          <option value="Pulses">Pulses</option>
                          <option value="Spices">Spices</option>
                          <option value="Vegetables">Vegetables</option>
                        </>
                      )}
                      {/disaster/i.test(displayLabel) && (
                        <>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </>
                      )}
                      {/type/i.test(displayLabel) && (
                        <>
                          <option value="">Select type</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <input
                      id={`field-${f.key}`}
                      type={/income|salary|earning|revenue|category/i.test(displayLabel) ? "number" : (numericHint ? "number" : "text")}
                      placeholder={isNameOrLink ? "" : (/income|salary|earning|revenue|category/i.test(displayLabel) ? "Enter income amount" : (numericHint ? "Enter number" : "e.g. OBC, Rainfed, Paddy"))}
                      value={form[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      disabled={isNameOrLink}
                      className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700 text-gray-700"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1f3b2c] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d4f3c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Find Schemes"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-[#e2d4b7] text-[#1f3b2c] px-6 py-3 rounded-lg font-medium hover:bg-[#f9fafb]"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
        <h2 className="text-xl font-semibold text-[#1f3b2c] mb-6">
          Eligible Schemes {results && `(${results.count} found)`}
        </h2>
        
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
        
        {results && results.count === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-600 mb-4">No Results</div>
            <p className="text-gray-600 mb-4">No schemes found matching your criteria</p>
            <p className="text-sm text-gray-600">Try adjusting your information or leaving some fields blank</p>
          </div>
        )}
        
        {results && results.eligible && results.eligible.length > 0 && (
          <div className="space-y-6">
            {results.eligible.map((scheme, i) => (
              <div key={i} className="border border-[#e2d4b7] rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1f3b2c] flex-1">{scheme.name}</h3>
                  {scheme.link && (
                    <a
                      href={scheme.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#1f3b2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d4f3c] transition-colors ml-4"
                    >
                      Apply Now →
                    </a>
                  )}
                </div>
                
                {!scheme.link && (
                  <div className="text-sm text-gray-600 mb-4">
                    Contact your local agricultural office for application details
                  </div>
                )}

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
            ))}
          </div>
        )}
      </div>

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
