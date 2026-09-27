"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, CheckCircle, XCircle, RefreshCw, Radio, ArrowLeft, FileText, ShieldCheck
} from '../../../../../components/ui/icons';
import AgreementModal from '@/app/components/AgreementModal/AgreementModal';

interface Invitation {
  _id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected';
  integrationRequestId?: string;
  createdAt: string;
}

export default function InvitationsInboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);

  const [selectedAgreementRequestId, setSelectedAgreementRequestId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/farmer/pooling/invitations?userId=${userId || ''}`);
      if (!res.ok) {
        throw new Error('Failed to fetch invitations');
      }
      const data = await res.json();
      setSentInvitations(data.sent || []);
      setReceivedInvitations(data.received || []);
    } catch (err: any) {
      setError(err.message || 'Error loading invitations');
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/farmer/pooling/invitations?userId=${userId || ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action, userId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }

      setSuccess(`Successfully ${action}ed the invitation. Smart Contract Agreement ready!`);
      await fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to respond to invitation.');
    }
  };

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit"><Radio className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  const navigateBack = () => {
    router.push(`/dashboard/farmer/pooling/discover?userId=${userId || ''}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#166534]"></div>
        <p className="mt-4 text-sm text-[#6b7280]">Loading invitations inbox...</p>
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
            <h1 className="text-2xl font-bold text-[#1f3b2c] tracking-tight">Step 3: Invitations & Smart Contracts</h1>
          </div>
          <p className="text-sm text-[#6b7280]">
            Review received land integration requests, accept pooling, and sign blockchain smart contracts.
          </p>
        </div>
        <button
          onClick={fetchInvitations}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e2d4b7] bg-white px-4 py-2 text-xs font-semibold text-[#1f3b2c] hover:bg-[#f7f0de] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Inbox
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 animate-slideDown">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Received Inbox */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1f3b2c] flex items-center gap-2 pb-1.5 border-b border-slate-100">
             Received Invitations
          </h3>
          {receivedInvitations.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-xs text-gray-500">
              No pooling invitations in your inbox.
            </div>
          ) : (
            <div className="space-y-4">
              {receivedInvitations.map((inv) => (
                <div key={inv._id} className="bg-white border border-[#e2d4b7] rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1f3b2c]">From: {inv.senderName}</h4>
                    <p className="text-[11px] text-[#6b7280] mt-1">
                      Sent on {new Date(inv.createdAt).toLocaleDateString()} at {new Date(inv.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {inv.status === 'accepted' && (
                      <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Smart Contract Agreement Generated!
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                    {inv.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => respondToInvitation(inv._id, 'accept')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                          Accept Invitation
                        </button>
                        <button
                          onClick={() => respondToInvitation(inv._id, 'reject')}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        {getInvitationStatusBadge(inv.status)}
                        <div className="flex items-center gap-2">
                          {inv.status === 'accepted' && (
                            <button
                              onClick={() => respondToInvitation(inv._id, 'reject')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                            >
                              Decline Accepted
                            </button>
                          )}
                          {inv.status === 'accepted' && inv.integrationRequestId && (
                            <button
                              onClick={() => setSelectedAgreementRequestId(inv.integrationRequestId || null)}
                              className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> View & Sign Smart Contract
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sent Outbox */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1f3b2c] flex items-center gap-2 pb-1.5 border-b border-slate-100">
             Sent Invitations
          </h3>
          {sentInvitations.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-xs text-gray-500">
              No sent invitations.
            </div>
          ) : (
            <div className="space-y-4">
              {sentInvitations.map((inv) => (
                <div key={inv._id} className="bg-white border border-[#e2d4b7] rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1f3b2c]">To: {inv.receiverName}</h4>
                    <p className="text-[11px] text-[#6b7280] mt-1">
                      Sent on {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                    {inv.status === 'accepted' && (
                      <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Accepted & Ready for Signing!
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-2 flex-wrap gap-2">
                    {getInvitationStatusBadge(inv.status)}
                    <div className="flex items-center gap-2">
                      {inv.status === 'accepted' && (
                        <button
                          onClick={() => respondToInvitation(inv._id, 'reject')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                        >
                          Decline Accepted
                        </button>
                      )}
                      {inv.status === 'accepted' && inv.integrationRequestId && (
                        <button
                          onClick={() => setSelectedAgreementRequestId(inv.integrationRequestId || null)}
                          className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" /> View & Sign Smart Contract
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agreement Modal */}
      {selectedAgreementRequestId && (
        <AgreementModal
          isOpen={!!selectedAgreementRequestId}
          onClose={() => setSelectedAgreementRequestId(null)}
          requestId={selectedAgreementRequestId}
          requestStatus="accepted"
          userId={userId || undefined}
        />
      )}
    </div>
  );
}

