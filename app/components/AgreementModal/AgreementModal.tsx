'use client';

import { useState, useEffect } from 'react';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestStatus: string;
}

interface SignatureStatus {
  userSigned: boolean;
  otherUserSigned: boolean;
  fullyExecuted: boolean;
  signatures: Array<{
    userName: string;
    signedAt: string;
  }>;
}

export default function AgreementModal({ isOpen, onClose, requestId, requestStatus }: AgreementModalProps) {
  const [agreementContent, setAgreementContent] = useState<string>('');
  const [agreementData, setAgreementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [signingLoading, setSigningLoading] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      loadAgreement();
      checkSignatureStatus();
    }
  }, [isOpen, requestId]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/farmer/land-integration/generate-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAgreementContent(data.agreementContent);
        setAgreementData(data.agreementData);
      } else {
        setError(data.error || 'Failed to generate agreement');
      }
    } catch (err) {
      setError('Failed to generate agreement');
    } finally {
      setLoading(false);
    }
  };

  const checkSignatureStatus = async () => {
    try {
      const response = await fetch(`/api/farmer/land-integration/sign-agreement?requestId=${requestId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSignatureStatus(data);
      }
    } catch (err) {
      console.error('Failed to check signature status:', err);
    }
  };

  const handleDownloadAgreement = async () => {
    try {
      const response = await fetch(`/api/farmer/land-integration/download-agreement?requestId=${requestId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `land-integration-agreement-${requestId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download agreement');
      }
    } catch (err) {
      setError('Failed to download agreement');
    }
  };

  const handleSignAgreement = async () => {
    if (!password.trim()) {
      setError('Please enter your password to sign');
      return;
    }

    try {
      setSigningLoading(true);
      setError(null);

      const response = await fetch('/api/farmer/land-integration/sign-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          password,
          agreementContent
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSignatureStatus({
          userSigned: true,
          otherUserSigned: data.fullyExecuted,
          fullyExecuted: data.fullyExecuted,
          signatures: data.signatures
        });
        setShowPasswordInput(false);
        setPassword('');
        
        if (data.fullyExecuted) {
          // Close modal after a delay if fully executed
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        setError(data.error || 'Failed to sign agreement');
      }
    } catch (err) {
      setError('Failed to sign agreement');
    } finally {
      setSigningLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Land Integration Agreement</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {signatureStatus && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  signatureStatus.userSigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {signatureStatus.userSigned ? '✅ You Signed' : '⏳ Not Signed'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  signatureStatus.otherUserSigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {signatureStatus.otherUserSigned ? '✅ Other Party Signed' : '⏳ Other Party Not Signed'}
                </span>
              </div>
              {signatureStatus.fullyExecuted && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📄 Agreement Fully Executed
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Generating agreement...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {agreementContent && !loading && (
            <div className="space-y-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200">
                {agreementContent}
              </pre>

              {!signatureStatus?.userSigned && requestStatus === 'accepted' && (
                <div className="border-t border-gray-200 pt-4">
                  {!showPasswordInput ? (
                    <button
                      onClick={() => setShowPasswordInput(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sign Agreement
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter your password to sign:
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSignAgreement}
                          disabled={signingLoading}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {signingLoading ? 'Signing...' : 'Confirm Signature'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordInput(false);
                            setPassword('');
                          }}
                          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {signatureStatus?.signatures && signatureStatus.signatures.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Signature History:</h3>
                  <div className="space-y-1">
                    {signatureStatus.signatures.map((signature, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{signature.userName}</span> - 
                        Signed on {new Date(signature.signedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {signatureStatus?.fullyExecuted && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={handleDownloadAgreement}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download Agreement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
