'use client';

import { useState, useEffect } from 'react';

interface AgreementPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreementId: string;
}

export default function AgreementPreviewModal({ isOpen, onClose, agreementId }: AgreementPreviewModalProps) {
  const [agreementContent, setAgreementContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && agreementId) {
      loadAgreementPreview();
    }
  }, [isOpen, agreementId]);

  const loadAgreementPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/farmer/land-integration/download-agreement?requestId=${agreementId}`);
      
      if (response.ok) {
        const content = await response.text();
        setAgreementContent(content);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load agreement');
      }
    } catch (err) {
      setError('Failed to load agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (agreementContent) {
      const blob = new Blob([agreementContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `land-integration-agreement-${agreementId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Land Integration Agreement Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading agreement...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {agreementContent && !loading && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {agreementContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
