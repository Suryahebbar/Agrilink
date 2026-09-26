'use client';

import { useState, useEffect, useRef } from 'react';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestStatus: string;
  userId?: string;
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

export default function AgreementModal({ isOpen, onClose, requestId, requestStatus, userId }: AgreementModalProps) {
  const [agreementContent, setAgreementContent] = useState<string>('');
  const [agreementData, setAgreementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [signingLoading, setSigningLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigMethod, setSigMethod] = useState<'draw' | 'upload'>('draw');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let x = 0;
    let y = 0;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.nativeEvent.clientX - rect.left;
      y = e.nativeEvent.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let x = 0;
    let y = 0;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        e.preventDefault();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.nativeEvent.clientX - rect.left;
      y = e.nativeEvent.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (isOpen && requestId) {
      loadAgreement();
      checkSignatureStatus();
    }
  }, [isOpen, requestId, userId]);

  const loadAgreement = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/farmer/land-integration/generate-agreement?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId })
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
      const response = await fetch(`/api/farmer/land-integration/sign-agreement?requestId=${requestId}&userId=${userId || ''}`);
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
      const response = await fetch(`/api/farmer/land-integration/download-agreement?requestId=${requestId}&userId=${userId || ''}`);
      
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

      let signatureUrl = '';
      let signatureImage = '';

      if (sigMethod === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas) {
          setError('Signature pad not found');
          setSigningLoading(false);
          return;
        }
        signatureImage = canvas.toDataURL('image/png');
        
        // Convert to Blob and upload to Cloudinary
        const blob = await (await fetch(signatureImage)).blob();
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'signatures');
        
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            signatureUrl = uploadData.data.url;
          } else {
            signatureUrl = signatureImage; // Fallback
          }
        } catch (uErr) {
          signatureUrl = signatureImage;
        }
      } else {
        if (!uploadedFile) {
          setError('Please select a signature file to upload');
          setSigningLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('folder', 'signatures');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            signatureUrl = uploadData.data.url;
          } else {
            signatureUrl = uploadedPreview || '';
          }
        } catch (uErr) {
          signatureUrl = uploadedPreview || '';
        }
        signatureImage = signatureUrl;
      }

      const response = await fetch(`/api/farmer/land-integration/sign-agreement?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          password,
          agreementContent,
          userId,
          signatureImage,
          signatureMethod: sigMethod,
          signatureUrl
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

  const handleResign = async () => {
    try {
      setSigningLoading(true);
      setError(null);
      const response = await fetch(`/api/farmer/land-integration/sign-agreement?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          userId,
          resign: true
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSignatureStatus({
          userSigned: false,
          otherUserSigned: data.signatures.length > 0,
          fullyExecuted: false,
          signatures: data.signatures
        });
      } else {
        setError(data.error || 'Failed to reset signature');
      }
    } catch (err) {
      setError('Failed to reset signature');
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
                {signatureStatus.userSigned && (
                  <button
                    onClick={handleResign}
                    disabled={signingLoading}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 font-bold transition-all shadow-sm"
                  >
                    {signingLoading ? 'Resetting...' : 'Re-sign (Testing)'}
                  </button>
                )}
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
                      {/* Choose Signature Method */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">
                          1. Choose Signature Method:
                        </label>
                        <div className="flex gap-4 border-b border-gray-100 pb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="radio"
                              name="sigMethodModal"
                              checked={sigMethod === 'draw'}
                              onChange={() => setSigMethod('draw')}
                              className="accent-blue-600"
                            />
                            ◉ Draw Signature
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="radio"
                              name="sigMethodModal"
                              checked={sigMethod === 'upload'}
                              onChange={() => setSigMethod('upload')}
                              className="accent-blue-600"
                            />
                            ◯ Upload Signature
                          </label>
                        </div>
                      </div>

                      {sigMethod === 'draw' ? (
                        <div className="space-y-2 animate-fadeIn">
                          <label className="block text-xs font-semibold text-slate-500">
                            Draw your signature on the pad below:
                          </label>
                          <div className="relative">
                            <canvas
                              ref={canvasRef}
                              width={500}
                              height={150}
                              className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-crosshair touch-none shadow-inner w-full max-w-[500px]"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                            />
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="absolute right-2 bottom-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                            >
                              Clear Pad
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">
                            Draw using mouse pointer, laptop trackpad, or touch screen.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-fadeIn">
                          <label className="block text-xs font-semibold text-slate-500">
                            Upload your signature image (JPG/PNG):
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFile(file);
                                setUploadedPreview(URL.createObjectURL(file));
                              }
                            }}
                            className="w-full max-w-[500px] text-xs border border-slate-200 p-2 rounded-xl bg-white focus:outline-none"
                          />
                          {uploadedPreview && (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Uploaded Signature Preview:</p>
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 w-fit">
                                <img
                                  src={uploadedPreview}
                                  alt="Uploaded Signature Preview"
                                  className="h-16 object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                          2. Enter your password to authenticate:
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSignAgreement}
                          disabled={signingLoading}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                        >
                          {signingLoading ? 'Signing...' : 'Confirm & Sign Agreement'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordInput(false);
                            setPassword('');
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
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
