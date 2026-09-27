"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, MapPin, Calendar, CheckCircle2, User, Phone, Briefcase,  X, Save } from '../../../../components/ui/icons';

interface FarmerProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  bio: string;
  profilePic: string | null;
  readyToIntegrate: boolean;
  memberSince: string;
  landParcelIdentity?: string;
  totalCultivableArea?: string;
  soilProperties?: string;
}

export default function FarmerProfilePage() {
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit State variables
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editReady, setEditReady] = useState(false);
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Profile from DB
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        setError('Not authenticated');
        return;
      }
      const authData = await authRes.json();
      const userId = authData.user?.id || authData.user?._id;
      
      if (!userId) {
        setError('User session invalid');
        return;
      }

      const res = await fetch(`/api/farmer/profile?userId=${userId}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setProfile(data.profile);
        resetFormFields(data.profile);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong loading your profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const resetFormFields = (p: FarmerProfileData) => {
    setEditPhone(p.phone || '');
    setEditAddress(p.address || '');
    setEditGender(p.gender || '');
    setEditDob(p.dob || '');
    setEditBio(p.bio || '');
    setEditReady(p.readyToIntegrate || false);
    setEditProfilePic(p.profilePic);
  };

  // Convert uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Save changes to API
  const handleSaveChanges = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/farmer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          dob: editDob,
          gender: editGender,
          phone: editPhone,
          address: editAddress,
          bio: editBio,
          readyToIntegrate: editReady,
          profilePic: editProfilePic
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsEditing(false);
        loadProfile(); // reload enriched profile
      } else {
        alert(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      resetFormFields(profile);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-sm">Loading farmer profile details...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-center">
        {error || 'Profile could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#1f3b2c]">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your digital identity, account configuration, and land integrations.</p>
      </div>

      {/* Main Responsive Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Fiverr-style Premium Info Card */}
        <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 relative flex flex-col items-center">
          
          {/* Status Pill Badge */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              profile.readyToIntegrate 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${profile.readyToIntegrate ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              {profile.readyToIntegrate ? 'Ready to Integrate' : 'Not Active'}
            </span>
          </div>

          {/* Profile Picture Container */}
          <div 
            onClick={triggerFileSelect}
            className={`w-32 h-32 rounded-full border-4 border-emerald-50  relative overflow-hidden group mt-6 ${
              isEditing ? 'cursor-pointer' : ''
            }`}
          >
            {isEditing ? (
              editProfilePic ? (
                <img src={editProfilePic} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-700/5 flex items-center justify-center text-emerald-800 font-bold text-3xl">
                  {profile.name.substring(0, 2).toUpperCase()}
                </div>
              )
            ) : (
              profile.profilePic ? (
                <img src={profile.profilePic} alt="Farmer Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-700/5 flex items-center justify-center text-emerald-800 font-bold text-3xl">
                  {profile.name.substring(0, 2).toUpperCase()}
                </div>
              )
            )}
            
            {/* Hidden Input File Picker */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Hover Camera overlay when editing */}
            {isEditing && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Edit Photo</span>
              </div>
            )}
          </div>

          {/* Farmer Primary Identifiers */}
          <div className="text-center mt-4 w-full">
            <h2 className="text-xl font-extrabold text-[#1f3b2c] flex items-center justify-center gap-1.5">
              {profile.name}
              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              @{profile.phone ? profile.phone : 'farmer_' + profile.id.substring(0, 6)}
            </p>
            <p className="text-xs text-[#166534] mt-2 italic px-4 font-medium leading-relaxed">
              "{isEditing ? editBio : (profile.bio || 'Passionate about smart farming.')}"
            </p>
          </div>

          <div className="w-full border-t border-[#e2d4b7]/50 my-6" />

          {/* Key-Value Metadata Grid */}
          <div className="w-full space-y-4 text-sm text-[#1f3b2c]">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#166534]" /> From
              </span>
              <strong className="text-right max-w-[150px] truncate">
                {profile.address ? profile.address.split(',')[0] : 'Karnataka, IN'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#166534]" /> Member since
              </span>
              <strong>{profile.memberSince}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                 Integration
              </span>
              <strong className={profile.readyToIntegrate ? 'text-emerald-700 font-bold' : 'text-amber-600 font-medium'}>
                {profile.readyToIntegrate ? 'Active' : 'Inactive'}
              </strong>
            </div>
          </div>

          <div className="w-full mt-6">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 rounded-xl border border-gray-300 bg-white font-bold text-gray-700 text-xs hover:bg-gray-50 transition-all text-center"
              >
                Edit Profile
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Form Fields / Registry Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. Account Settings Fields */}
          <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1f3b2c] border-b border-gray-100 pb-3">Personal Configurations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name (Registry Verified)</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  disabled 
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-400 font-semibold focus:outline-none cursor-not-allowed" 
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile Number</label>
                <input 
                  type="text" 
                  value={isEditing ? editPhone : (profile.phone || ' - ')} 
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={!isEditing} 
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs text-[#1f3b2c] ${
                    isEditing ? 'border-[#e2d4b7] bg-white focus:ring-1 focus:ring-[#166534] focus:outline-none' : 'border-transparent bg-gray-50/50 font-semibold'
                  }`} 
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
                <input 
                  type={isEditing ? "date" : "text"}
                  value={isEditing ? editDob : (profile.dob || ' - ')} 
                  onChange={(e) => setEditDob(e.target.value)}
                  disabled={!isEditing} 
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs text-[#1f3b2c] ${
                    isEditing ? 'border-[#e2d4b7] bg-white focus:ring-1 focus:ring-[#166534] focus:outline-none' : 'border-transparent bg-gray-50/50 font-semibold'
                  }`} 
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                {isEditing ? (
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full rounded-xl border border-[#e2d4b7] bg-white px-4 py-2.5 text-xs text-[#1f3b2c] focus:ring-1 focus:ring-[#166534] focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={profile.gender || ' - '} 
                    disabled 
                    className="w-full rounded-xl border border-transparent bg-gray-50/50 px-4 py-2.5 text-xs text-[#1f3b2c] font-semibold" 
                  />
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Home Address</label>
              <textarea 
                value={isEditing ? editAddress : (profile.address || ' - ')} 
                onChange={(e) => setEditAddress(e.target.value)}
                disabled={!isEditing} 
                rows={2}
                className={`w-full rounded-xl border px-4 py-2.5 text-xs text-[#1f3b2c] resize-none ${
                  isEditing ? 'border-[#e2d4b7] bg-white focus:ring-1 focus:ring-[#166534] focus:outline-none' : 'border-transparent bg-gray-50/50 font-semibold'
                }`} 
              />
            </div>

            {/* About Me Section */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">About Me (Bio)</label>
              <textarea 
                value={isEditing ? editBio : (profile.bio || ' - ')} 
                onChange={(e) => setEditBio(e.target.value)}
                disabled={!isEditing} 
                rows={3}
                placeholder="Share a brief statement about your farm holdings, farming practices, or crop priorities."
                className={`w-full rounded-xl border px-4 py-2.5 text-xs text-[#1f3b2c] resize-none ${
                  isEditing ? 'border-[#e2d4b7] bg-white focus:ring-1 focus:ring-[#166534] focus:outline-none' : 'border-transparent bg-gray-50/50 font-semibold'
                }`} 
              />
            </div>

            {/* Integration Status Toggle */}
            {isEditing && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <div>
                  <h4 className="text-xs font-bold text-[#1f3b2c]">Mark Ready for Consortium Integration</h4>
                  <p className="text-[11px] text-gray-500">Allow other farmers to find and request cooperative land integration with your plot.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editReady} 
                    onChange={(e) => setEditReady(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            )}
          </div>

          {/* 2. Official Cadastral Farmland details (if verified) */}
          <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1f3b2c] border-b border-gray-100 pb-3">Official Land Records Registry</h3>
            {profile.landParcelIdentity ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3.5">
                  <span className="text-gray-500 block mb-1">Land Identity</span>
                  <strong className="text-[#1f3b2c] text-sm font-semibold">{profile.landParcelIdentity}</strong>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3.5">
                  <span className="text-gray-500 block mb-1">Cultivable Area</span>
                  <strong className="text-[#1f3b2c] text-sm font-semibold">{profile.totalCultivableArea} Acres</strong>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3.5">
                  <span className="text-gray-500 block mb-1">Soil Properties</span>
                  <strong className="text-[#1f3b2c] text-sm font-semibold">{profile.soilProperties || 'Dry/Sandy'}</strong>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500">No verified land parcel linked to your profile yet.</p>
                <Link
                  href="/dashboard/farmer/land/details"
                  className="text-xs font-bold text-emerald-700 hover:underline mt-1.5 inline-block"
                >
                  Verify Land Record →
                </Link>
              </div>
            )}
          </div>

          {/* 3. Fiverr-style Intro video / Consortium Readiness Prompts */}
          <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1f3b2c]">Consortium Cooperatives</h3>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Consolidate adjacent farmlands with neighboring farmers using AgriLink smart contracts on the blockchain to enable high-efficiency collective farming.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/farmer/land"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all"
              >
                Search Neighbors & Form Pool
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
