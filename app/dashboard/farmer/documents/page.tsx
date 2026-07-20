"use client";

import { useEffect, useState } from 'react';

export default function FarmerDocumentsPage() {
  const [rtcFile, setRtcFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!rtcFile && !aadharFile) {
      setError('Please choose at least one document');
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (rtcFile) formData.append('rtc', rtcFile);
      if (aadharFile) formData.append('aadhar', aadharFile);

      const res = await fetch('/api/farmer/kyc', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Upload failed');
      } else {
        setProfile(data.profile);
        setMessage(data.message || 'Documents uploaded and processed');
        // Show additional info about verification status
        if (data.nameVerificationStatus === 'not_verified') {
          setError('Names did not match exactly. Only Aadhaar data has been stored.');
        }
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // On initial load, try to fetch any previously processed documents/profile
  useEffect(() => {
    void handleViewExtracted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleViewExtracted() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/farmer/kyc');
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to load profile');
      } else {
        setProfile(data.profile);
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1f3b2c]">KYC Documents Verification</h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Please upload your land RTC and Aadhaar documents. Extracted details will populate your profile.
          </p>
        </div>
        <button
          onClick={handleViewExtracted}
          className="inline-flex items-center rounded-md bg-[#166534] px-4 py-2 text-xs font-medium text-white hover:bg-[#14532d]"
        >
          View Extracted Data
        </button>
      </div>

      <form onSubmit={handleUpload} className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-[#374151] mb-1">RTC Document</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setRtcFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-[#374151]"
            />
            <p className="text-[11px] text-[#9ca3af] mt-1">Upload a clear PDF of your RTC document.</p>
          </div>
          <div>
            <label className="block font-medium text-[#374151] mb-1">Aadhaar Document</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-[#374151]"
            />
            <p className="text-[11px] text-[#9ca3af] mt-1">Upload a clear PDF of your Aadhaar card.</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {message && <p className="text-xs text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center rounded-md bg-[#166534] px-4 py-2 text-xs font-medium text-white hover:bg-[#14532d] disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Upload & Verify Documents'}
        </button>
      </form>

      {profile && (
        <div className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6 text-xs space-y-3">
          <h2 className="text-sm font-semibold text-[#1f3b2c] mb-2">Extracted Data (RTC & Aadhaar)</h2>
          
          {/* Farmer Profile Section */}
          {(profile.verifiedName || profile.homeAddress || profile.idProof) && (
            <div>
              <h3 className="font-semibold mb-2 text-[#1f3b2c]">Farmer Information</h3>
              <div className="bg-[#f3e7cf] p-3 rounded border border-[#e2d4b7] space-y-1">
                {profile.verifiedName && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Name:</span> {profile.verifiedName}</p>
                )}
                {profile.kannadaName && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">RTC Name (Kannada):</span> {profile.kannadaName}</p>
                )}
                {profile.aadhaarKannadaName && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Aadhaar Name (Kannada):</span> {profile.aadhaarKannadaName}</p>
                )}
                {profile.nameVerificationStatus && (
                  <p className="text-[#1f3b2c]">
                    <span className="font-medium">Name Verification:</span>{' '}
                    <span className={`font-bold ${
                      profile.nameVerificationStatus === 'verified' ? 'text-green-700' :
                      profile.nameVerificationStatus === 'not_verified' ? 'text-red-700' :
                      'text-yellow-700'
                    }`}>
                      {profile.nameVerificationStatus === 'verified' ? '✅ Verified' :
                       profile.nameVerificationStatus === 'not_verified' ? '❌ Not Verified' :
                       '⏳ Pending'}
                    </span>
                  </p>
                )}
                {profile.homeAddress && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Address:</span> {profile.homeAddress}</p>
                )}
                {profile.idProof && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">ID Proof:</span> {profile.idProof}</p>
                )}
                {profile.contactNumber && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Mobile:</span> {profile.contactNumber}</p>
                )}
                {profile.dob && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">DOB:</span> {profile.dob}</p>
                )}
              </div>
            </div>
          )}

          {/* Land Details Section - Only show if names matched and RTC data was stored */}
          {(profile.landParcelIdentity || profile.totalCultivableArea || profile.soilProperties) && (
            <div>
              <h3 className="font-semibold mb-2 text-[#1f3b2c]">Land Information</h3>
              <div className="bg-[#f3e7cf] p-3 rounded border border-[#e2d4b7] space-y-1">
                {profile.landParcelIdentity && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Survey Number:</span> {profile.landParcelIdentity}</p>
                )}
                {profile.totalCultivableArea && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Total Area:</span> {profile.totalCultivableArea}</p>
                )}
                {profile.soilProperties && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Soil Type:</span> {profile.soilProperties}</p>
                )}
                {profile.mutationTraceability && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Mutation:</span> {profile.mutationTraceability}</p>
                )}
                {profile.rtcAddress && (
                  <p className="text-[#1f3b2c]"><span className="font-medium">Land Location:</span> {profile.rtcAddress}</p>
                )}
                {profile.ownershipVerified !== undefined && (
                  <p className="text-[#1f3b2c]">
                    <span className="font-medium">Ownership Verified:</span>{' '}
                    <span className={`font-bold ${
                      profile.ownershipVerified ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {profile.ownershipVerified ? '✅ Yes' : '❌ No'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verification Status Message */}
          {profile.nameVerificationStatus === 'not_verified' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-red-800 text-xs font-medium">
                ⚠️ Names did not match exactly. Only Aadhaar data has been stored in your profile.
              </p>
            </div>
          )}
          {profile.nameVerificationStatus === 'verified' && (
            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-green-800 text-xs font-medium">
                ✅ Names matched exactly. All data has been stored in your profile.
              </p>
            </div>
          )}

          {/* Raw Text Section */}
          {(profile.rtcOcrText || profile.aadharOcrText) && (
            <div>
              <h3 className="font-semibold mb-2 text-[#1f3b2c]">Raw Extracted Text</h3>
              {profile.rtcOcrText && (
                <div className="mb-3">
                  <p className="font-medium mb-1 text-[#1f3b2c]">RTC Document</p>
                  <pre className="whitespace-pre-wrap bg-[#f3e7cf] p-3 rounded border border-[#e2d4b7] max-h-40 overflow-auto text-[11px] text-[#1f3b2c]">
                    {profile.rtcOcrText}
                  </pre>
                </div>
              )}
              {profile.aadharOcrText && (
                <div>
                  <p className="font-medium mb-1 text-[#1f3b2c]">Aadhaar Document</p>
                  <pre className="whitespace-pre-wrap bg-[#f3e7cf] p-3 rounded border border-[#e2d4b7] max-h-40 overflow-auto text-[11px] text-[#1f3b2c]">
                    {profile.aadharOcrText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Document Status */}
          {profile.documents && (
            <div>
              <h3 className="font-semibold mb-2 text-[#1f3b2c]">Document Status</h3>
              <div className="bg-[#f3e7cf] p-3 rounded border border-[#e2d4b7] space-y-1">
                {profile.documents.rtc && (
                  <p className="text-[#1f3b2c]">
                    <span className="font-medium">RTC:</span> 
                    {profile.documents.rtc.uploaded ? ' Uploaded' : ' Not uploaded'}
                    {profile.documents.rtc.uploadedAt && ` on ${new Date(profile.documents.rtc.uploadedAt).toLocaleDateString()}`}
                  </p>
                )}
                {profile.documents.aadhaar && (
                  <p className="text-[#1f3b2c]">
                    <span className="font-medium">Aadhaar:</span> 
                    {profile.documents.aadhaar.uploaded ? ' Uploaded' : ' Not uploaded'}
                    {profile.documents.aadhaar.uploadedAt && ` on ${new Date(profile.documents.aadhaar.uploadedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
