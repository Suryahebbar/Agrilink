'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface FarmerData {
  farmerProfile: any;
  landDetails: any[];
  landIntegrations: {
    sent: any[];
    received: any[];
  };
}

export default function TestFarmerPage() {
  const params = useParams();
  const [data, setData] = useState<FarmerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/admin/farmers/${params.id}`);
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Farmer Data Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Farmer Profile Details</h2>
          {data.farmerProfile ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {data.farmerProfile.verifiedName}</p>
              <p><strong>Contact:</strong> {data.farmerProfile.contactNumber}</p>
              <p><strong>Land Area:</strong> {data.farmerProfile.totalCultivableArea}</p>
              <p><strong>Status:</strong> {data.farmerProfile.nameVerificationStatus}</p>
            </div>
          ) : (
            <p>No farmer profile data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Land Details</h2>
          {data.landDetails.length > 0 ? (
            <div className="space-y-4">
              {data.landDetails.map((land, index) => (
                <div key={index} className="border p-3 rounded">
                  <p><strong>Land Size:</strong> {land.landData?.landSizeInAcres} acres</p>
                  <p><strong>Survey Number:</strong> {land.rtcDetails?.surveyNumber || 'N/A'}</p>
                  <p><strong>Soil Type:</strong> {land.rtcDetails?.soilType || 'N/A'}</p>
                  <p><strong>Status:</strong> {land.processingStatus}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No land details available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Land Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Sent Requests ({data.landIntegrations.sent.length})</h3>
              {data.landIntegrations.sent.length > 0 ? (
                <div className="space-y-2">
                  {data.landIntegrations.sent.map((integration, index) => (
                    <div key={index} className="border p-2 rounded">
                      <p><strong>Status:</strong> {integration.status}</p>
                      <p><strong>To:</strong> {integration.targetUser?.name || 'N/A'}</p>
                      <p><strong>Date:</strong> {new Date(integration.requestDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No sent requests</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Received Requests ({data.landIntegrations.received.length})</h3>
              {data.landIntegrations.received.length > 0 ? (
                <div className="space-y-2">
                  {data.landIntegrations.received.map((integration, index) => (
                    <div key={index} className="border p-2 rounded">
                      <p><strong>Status:</strong> {integration.status}</p>
                      <p><strong>From:</strong> {integration.requestingUser?.name || 'N/A'}</p>
                      <p><strong>Date:</strong> {new Date(integration.requestDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No received requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
