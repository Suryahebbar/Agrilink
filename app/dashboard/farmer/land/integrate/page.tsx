"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgreementModal from '../../../../components/AgreementModal/AgreementModal';

interface LandDetails {
  _id: string;
  landData: {
    centroidLatitude: number;
    centroidLongitude: number;
    landSizeInAcres?: number;
  };
  processingStatus: string;
}

interface NeighbouringLand {
  userId: string;
  userName: string;
  landId: string;
  sizeInAcres: number;
  centroidLatitude: number;
  centroidLongitude: number;
  distance: number; // in meters
}

interface IntegrationRequest {
  _id: string;
  requestingUser: string;
  targetUser: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requestDate: Date;
  responseDate?: Date;
  isRequestingUser: boolean;
  otherUserName: string;
  otherUserContact?: string;
  landDetails: {
    requestingUser: {
      sizeInAcres: number;
      contributionRatio: number;
    };
    targetUser: {
      sizeInAcres: number;
      contributionRatio: number;
    };
    totalIntegratedSize: number;
  };
  financialAgreement: any;
  integrationPeriod: any;
  agreementDocument?: string;
}

export default function LandIntegrationPage() {
  const router = useRouter();
  const [userLand, setUserLand] = useState<LandDetails | null>(null);
  const [neighbouringLands, setNeighbouringLands] = useState<NeighbouringLand[]>([]);
  const [integrationRequests, setIntegrationRequests] = useState<IntegrationRequest[]>([]);
  const [readyToIntegrate, setReadyToIntegrate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAgreementRequest, setSelectedAgreementRequest] = useState<string | null>(null);

  // Load user's land details and integration status
  useEffect(() => {
    loadUserLandDetails();
    loadReadyStatus();
    loadIntegrationRequests();
  }, []);

  const loadReadyStatus = async () => {
    try {
      console.log('Loading ready status from database...');
      const response = await fetch('/api/farmer/land-integration/ready-status');
      if (response.ok) {
        const data = await response.json();
        console.log('Ready status response:', data);
        setReadyToIntegrate(data.readyToIntegrate || false);
        console.log('Set ready status to:', data.readyToIntegrate);
      } else {
        const errorData = await response.json();
        console.error('Failed to load ready status:', errorData);
      }
    } catch (err) {
      console.error('Failed to load ready status:', err);
    }
  };

  const loadUserLandDetails = async () => {
    try {
      setLoading(true);
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        setError('Please log in to continue');
        return;
      }

      const userData = await authResponse.json();
      const userId = userData.user?.id || userData.user?._id;

      const landResponse = await fetch(`/api/farmer/land-details?userId=${userId}`);
      const landData = await landResponse.json();

      if (landResponse.ok && landData.data && landData.data.length > 0) {
        setUserLand(landData.data[0]);
      } else {
        setError('Please map your land first before applying for integration');
      }
    } catch (err) {
      setError('Failed to load land details');
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrationRequests = async () => {
    try {
      const response = await fetch('/api/farmer/land-integration/requests');
      if (response.ok) {
        const data = await response.json();
        setIntegrationRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load integration requests:', err);
    }
  };

  const toggleReadyToIntegrate = async () => {
    if (!userLand) return;

    try {
      setLoading(true);
      const newReadyState = !readyToIntegrate;
      console.log('Toggling ready status from', readyToIntegrate, 'to', newReadyState);
      
      const response = await fetch('/api/farmer/land-integration/ready-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ready: newReadyState })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Toggle response:', data);
        // Use the actual response from the database
        setReadyToIntegrate(data.readyToIntegrate);
        setSuccessMessage(data.readyToIntegrate ? 
          'You are now marked as ready to integrate. Finding neighbours...' : 
          'You are no longer marked as ready to integrate'
        );
        
        if (data.readyToIntegrate) {
          findNeighbouringLands();
        } else {
          setNeighbouringLands([]);
        }
      } else {
        const errorData = await response.json();
        console.error('Toggle error response:', errorData);
        setError(errorData.error || 'Failed to update integration status');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      setError('Failed to update integration status');
    } finally {
      setLoading(false);
    }
  };

  const findNeighbouringLands = async () => {
    if (!userLand) return;

    try {
      setLoading(true);
      const response = await fetch('/api/farmer/land-integration/find-neighbours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centroidLatitude: userLand.landData.centroidLatitude,
          centroidLongitude: userLand.landData.centroidLongitude
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNeighbouringLands(data.neighbours || []);
        
        if (data.neighbours.length === 0) {
          setSuccessMessage('No neighbouring lands are currently ready to integrate');
        }
      }
    } catch (err) {
      setError('Failed to find neighbouring lands');
    } finally {
      setLoading(false);
    }
  };

  const requestIntegration = async (neighbour: NeighbouringLand) => {
    if (!userLand) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      console.log('Sending integration request to:', neighbour);
      
      const response = await fetch('/api/farmer/land-integration/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: neighbour.userId,
          targetLandId: neighbour.landId,
          integrationPeriod: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
          }
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccessMessage(`Integration request sent to ${neighbour.userName}`);
        setNeighbouringLands(neighbouringLands.filter(n => n.userId !== neighbour.userId));
        loadIntegrationRequests();
      } else {
        setError(data.error || 'Failed to send integration request');
      }
    } catch (err) {
      console.error('Error sending integration request:', err);
      setError('Failed to send integration request');
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      console.log(`Responding to request ${requestId} with action: ${action}`);
      
      const response = await fetch(`/api/farmer/land-integration/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccessMessage(`Integration request ${action}ed successfully`);
        loadIntegrationRequests();
      } else {
        setError(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
      setError(`Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1f3b2c]">Land Integration</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Find neighbouring farmers and integrate your lands for better productivity.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/farmer/land')}
          className="inline-flex items-center justify-center rounded-md border border-[#e2d4b7] px-4 py-2 text-xs font-medium text-[#1f3b2c] hover:bg-[#f7f0de]"
        >
          ← Back to Land
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6 text-center">
          <p className="text-[#6b7280]">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {userLand && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Your Land Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-[#1f3b2c]">Land Size: </span>
              {userLand.landData.landSizeInAcres ? 
                `${userLand.landData.landSizeInAcres.toFixed(2)} acres` : 
                '—'
              }
            </div>
            <div>
              <span className="font-semibold text-[#1f3b2c]">Status: </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userLand.processingStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {userLand.processingStatus === 'completed' ? '✅ Mapped' : '⏳ Processing'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-[#1f3b2c]">Coordinates: </span>
              {userLand.landData.centroidLatitude?.toFixed(7)}, {userLand.landData.centroidLongitude?.toFixed(7)}
            </div>
            <div>
              <span className="font-semibold text-[#1f3b2c]">Ready to Integrate: </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                readyToIntegrate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {readyToIntegrate ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={toggleReadyToIntegrate}
              disabled={loading || userLand.processingStatus !== 'completed'}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                readyToIntegrate 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-[#166534] text-white hover:bg-[#14532d]'
              } ${loading || userLand.processingStatus !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {readyToIntegrate ? 'Remove from Integration List' : 'Mark as Ready to Integrate'}
            </button>
          </div>
        </div>
      )}

      {/* Integration Requests */}
      {integrationRequests.length > 0 && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Integration Requests</h2>
          <div className="space-y-4">
            {integrationRequests.map((request) => (
              <div key={request._id} className="border border-[#e2d4b7] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[#1f3b2c]">
                        {request.isRequestingUser ? 'Request sent to' : 'Request received from'} {request.otherUserName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status === 'pending' ? '⏳ Pending' :
                         request.status === 'accepted' ? '✅ Accepted' :
                         request.status === 'rejected' ? '❌ Rejected' :
                         request.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-[#6b7280]">
                        Total Integrated Size: {request.landDetails.totalIntegratedSize.toFixed(2)} acres
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        Your Land: {request.isRequestingUser ? 
                          request.landDetails.requestingUser.sizeInAcres.toFixed(2) : 
                          request.landDetails.targetUser.sizeInAcres.toFixed(2)} acres 
                        ({request.isRequestingUser ? 
                          request.landDetails.requestingUser.contributionRatio.toFixed(1) : 
                          request.landDetails.targetUser.contributionRatio.toFixed(1)}%)
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        {request.otherUserName}'s Land: {request.isRequestingUser ? 
                          request.landDetails.targetUser.sizeInAcres.toFixed(2) : 
                          request.landDetails.requestingUser.sizeInAcres.toFixed(2)} acres 
                        ({request.isRequestingUser ? 
                          request.landDetails.targetUser.contributionRatio.toFixed(1) : 
                          request.landDetails.requestingUser.contributionRatio.toFixed(1)}%)
                      </p>
                      {request.otherUserContact && (
                        <p className="text-xs text-[#6b7280]">
                          Contact: {request.otherUserContact}
                        </p>
                      )}
                      <p className="text-xs text-[#6b7280]">
                        Request Date: {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                      {request.responseDate && (
                        <p className="text-xs text-[#6b7280]">
                          Response Date: {new Date(request.responseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {request.status === 'pending' && !request.isRequestingUser && (
                      <>
                        <button
                          onClick={() => respondToRequest(request._id, 'accept')}
                          className="inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToRequest(request._id, 'reject')}
                          className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'accepted' && request.agreementDocument && (
                      <button
                        onClick={() => setSelectedAgreementRequest(request._id)}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        View Agreement
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neighbouring Lands */}
      {neighbouringLands.length > 0 && (
        <div className="bg-white border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1f3b2c] mb-4">Available Neighbours for Integration</h2>
          <div className="space-y-4">
            {neighbouringLands.map((neighbour) => (
              <div key={neighbour.userId} className="border border-[#e2d4b7] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[#1f3b2c]">
                      Farmer {neighbour.userName || neighbour.userId.slice(-6)}
                    </h3>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Land Size: {neighbour.sizeInAcres.toFixed(2)} acres
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      Distance: {neighbour.distance.toFixed(0)} meters
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        console.log('Request Integration button clicked!');
                        requestIntegration(neighbour);
                      }}
                      className="inline-flex items-center rounded-md bg-[#166534] px-3 py-1 text-xs font-medium text-white hover:bg-[#14532d]"
                    >
                      Request Integration
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!readyToIntegrate && userLand && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            Mark yourself as "Ready to Integrate" to find neighbouring farmers who want to integrate their lands.
          </p>
        </div>
      )}

      {/* Agreement Modal */}
      {selectedAgreementRequest && (
        <AgreementModal
          isOpen={!!selectedAgreementRequest}
          onClose={() => setSelectedAgreementRequest(null)}
          requestId={selectedAgreementRequest}
          requestStatus={integrationRequests.find(r => r._id === selectedAgreementRequest)?.status || ''}
        />
      )}
    </div>
  );
}
