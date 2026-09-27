"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, Compass, ArrowRight, RefreshCw, XCircle, CheckCircle, ArrowLeft
} from '../../../../../components/ui/icons';

interface LandInfo {
  id: string;
  surveyNumber: string;
  area: string;
  processingStatus: string;
  location: string;
  centroidLatitude?: number;
  centroidLongitude?: number;
}

interface Neighbour {
  userId: string;
  userName: string;
  landId: string;
  sizeInAcres: number;
  surveyNumber: string;
  location: string;
  distance: number;
  compatibility: number;
  soilType: string;
  cropType: string;
}

interface Invitation {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function DiscoverNeighboursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [readyToPool, setReadyToPool] = useState(false);
  const [land, setLand] = useState<LandInfo | null>(null);
  const [neighbours, setNeighbours] = useState<Neighbour[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [loadingNeighbours, setLoadingNeighbours] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get pooling status & land info
      const statusRes = await fetch(`/api/farmer/pooling/status?userId=${userId || ''}`);
      if (!statusRes.ok) {
        throw new Error('Failed to fetch pooling status');
      }
      const statusData = await statusRes.json();
      
      if (!statusData.land) {
        setError('Please map and verify your land first before discovering neighbours.');
        setLoading(false);
        return;
      }
      
      setLand(statusData.land);
      setReadyToPool(statusData.readyToPool);

      if (!statusData.readyToPool) {
        setError('You must mark your land available for pooling (Step 1) before you can discover neighbouring farmers.');
        setLoading(false);
        return;
      }

      // 2. Fetch sent invitations
      const res = await fetch(`/api/farmer/pooling/invitations?userId=${userId || ''}`);
      if (res.ok) {
        const data = await res.json();
        setSentInvitations(data.sent || []);
      }

      // 3. Find neighbours
      if (statusData.land.centroidLatitude) {
        await findNeighbours(statusData.land);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  const findNeighbours = async (landInfo: LandInfo) => {
    try {
      setLoadingNeighbours(true);
      const res = await fetch(`/api/farmer/pooling/find-neighbours?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centroidLatitude: landInfo.centroidLatitude,
          centroidLongitude: landInfo.centroidLongitude,
          userId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNeighbours(data.neighbours || []);
      }
    } catch (err) {
      console.error('Error finding neighbours:', err);
    } finally {
      setLoadingNeighbours(false);
    }
  };

  const inviteNeighbour = async (neighbour: Neighbour) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/farmer/pooling/invitations?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: neighbour.userId,
          targetUserName: neighbour.userName,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(`Invitation successfully sent to ${neighbour.userName}!`);
      // Update list
      const resInv = await fetch(`/api/farmer/pooling/invitations?userId=${userId || ''}`);
      if (resInv.ok) {
        const dataInv = await resInv.json();
        setSentInvitations(dataInv.sent || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to invite neighbouring farmer.');
    }
  };

  const navigateBack = () => {
    router.push(`/dashboard/farmer/pooling?userId=${userId || ''}`);
  };

  const navigateToInvitations = () => {
    router.push(`/dashboard/farmer/pooling/invitations?userId=${userId || ''}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#166534]"></div>
        <p className="mt-4 text-sm text-[#6b7280]">Scanning adjacent plots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e7eb] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <button 
              onClick={navigateBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors mr-1 border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
            <h1 className="text-2xl font-bold text-[#1f3b2c] tracking-tight">Step 2: Discover Neighbouring Farmers</h1>
          </div>
          <p className="text-sm text-[#6b7280]">
            Review adjacent verified farms and select neighbor holdings to invite for collective land pooling.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInitialData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e2d4b7] bg-white px-4 py-2 text-xs font-semibold text-[#1f3b2c] hover:bg-[#f7f0de] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-scan
          </button>
          <button
            onClick={navigateToInvitations}
            className="inline-flex items-center gap-2 rounded-lg bg-[#166534] px-4 py-2 text-xs font-semibold text-white hover:bg-[#14532d] transition-all"
          >
            Go to Invitations & Inbox <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Notice</h4>
            <p className="text-xs mt-1 leading-relaxed">{error}</p>
            {!readyToPool && land && (
              <button 
                onClick={navigateBack}
                className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Mark Land Available (Step 1)
              </button>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 animate-slideDown">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {readyToPool && land && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-lg font-bold text-[#1f3b2c] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#166534]" /> Adjacent Verified Plots
            </h3>
            {loadingNeighbours && (
              <span className="text-xs text-[#166534] flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" /> Querying spatial database...
              </span>
            )}
          </div>

          {neighbours.length === 0 ? (
            <div className="bg-[#f8fafc] border border-dashed border-[#e2d4b7] rounded-2xl p-12 text-center">
              <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1f3b2c]">No adjacent pooling farmers found</p>
              <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
                No registered farmers nearby have marked their land as available for pooling. Share AgriLink with neighboring holdings!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {neighbours.map((neighbour) => {
                const isInvited = sentInvitations.some(inv => inv.receiverId === neighbour.userId);
                return (
                  <div key={neighbour.userId} className="bg-white border border-[#e2d4b7] rounded-2xl p-5 space-y-4 transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-[#1f3b2c] text-sm">{neighbour.userName}</h4>
                        <span className="text-[11px] text-[#6b7280] block mt-0.5">Location: {neighbour.location}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                        {neighbour.compatibility}% Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-50 py-3">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Land Area</span>
                        <span className="font-bold text-[#1f3b2c]">{neighbour.sizeInAcres.toFixed(2)} acres</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Proximity</span>
                        <span className="font-bold text-[#1f3b2c]">{neighbour.distance.toFixed(0)} meters away</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-400 block text-[10px]">Soil Type</span>
                        <span className="font-semibold text-[#1f3b2c]">{neighbour.soilType}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-400 block text-[10px]">Current Crop</span>
                        <span className="font-semibold text-[#1f3b2c]">{neighbour.cropType}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => inviteNeighbour(neighbour)}
                      disabled={isInvited}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isInvited 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-[#166534] hover:bg-[#14532d] text-white '
                      }`}
                    >
                      {isInvited ? 'Invitation Sent' : <>Invite Neighbour <ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
