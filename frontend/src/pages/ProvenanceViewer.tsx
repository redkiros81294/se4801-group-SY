import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { ChainStatusBanner } from '../components/ChainStatusBanner';
import { HashDisplay } from '../components/HashDisplay';
import { StatusBadge } from '../components/StatusBadge';
import { getEventTypeMeta } from '../lib/eventTypes';

interface Movement {
  id: string;
  eventType: string;
  timestamp: string;
  fromOrgId?: string;
  toOrgId?: string;
  signatureHash: string;
  previousHash: string;
}

interface VerifyResult {
  valid: boolean;
  productName: string;
  sku: string;
  batchNumber: string;
  status: string;
  chain: Movement[];
}

export const ProvenanceViewer = () => {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/verify/${token}`);
        setResult(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('QR code not found or has expired');
        } else {
          setError('Unable to verify this product. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const handleShare = async () => {
    if (!token) return;
    const url = `${window.location.origin}/verify/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg0)] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--t2)]">Verifying provenance...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[var(--bg0)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--red)]/20 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[var(--red)]/20">
              <i className="ti ti-alert-octagon text-[var(--red)] text-2xl" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-[var(--t1)] mb-2">Verification Failed</h1>
          <p className="text-[var(--t2)] mb-6">{error || 'The requested batch could not be verified.'}</p>
          <button onClick={() => window.location.assign(`${import.meta.env.BASE_URL}`)} className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200">Go to Homepage</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg0)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--t1)] mb-2">Supply Chain Provenance</h1>
          <p className="text-[var(--t2)]">Verified product journey from manufacturer to consumer</p>
        </div>

        <div className="mb-8">
          <ChainStatusBanner chainValid={result.valid} />
        </div>

        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--t1)] mb-1">{result.productName || 'Unknown Product'}</h2>
              <p className="text-[var(--t2)] text-sm font-mono">SKU: {result.sku || 'N/A'}</p>
            </div>
            <div className="mt-3 sm:mt-0">
              <StatusBadge status={result.status as any} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[var(--t2)] text-sm mb-1">Batch Number</p>
              <HashDisplay hash={result.batchNumber} />
            </div>
            <div>
              <p className="text-[var(--t2)] text-sm mb-2">Chain Status</p>
              <p className={`text-lg font-bold ${result.valid ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {result.valid ? 'VERIFIED' : 'COMPROMISED'}
              </p>
              <p className="text-[var(--t3)] text-xs mt-1">
                {result.valid ? 'All hashes valid. Chain integrity confirmed.' : 'Hash mismatch detected. Chain has been tampered with.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border)]/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[var(--t2)] text-sm">QR Token</p>
                <p className="text-[var(--t1)] font-mono text-xs break-all">{token}</p>
              </div>
              <button onClick={handleShare} className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200">
                <i className={`ti ${copied ? 'ti-check' : 'ti-share'} text-[var(--cyan)]`} aria-hidden="true" />
                <span className="text-sm">{copied ? 'Copied!' : 'Share Verification'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h3 className="text-xl font-bold text-[var(--t1)] mb-6">Provenance Timeline</h3>

          {result.chain.length === 0 ? (
            <div className="text-center py-8">
              <i className="ti ti-history text-[var(--t3)] text-4xl mb-4" aria-hidden="true" />
              <p className="text-[var(--t2)]">No movement events recorded for this batch</p>
            </div>
          ) : (
            <div className="space-y-0">
              {result.chain.map((tx, index) => {
                const meta = getEventTypeMeta(tx.eventType);
                return (
                <div key={tx.id} className="relative pl-10 pb-8 last:pb-0" style={{ animation: `toast-in 400ms ease-out ${index * 120}ms both` }}>
                  {index < result.chain.length - 1 && (
                    <div className="absolute left-3 top-5 bottom-0 w-px bg-[var(--border)]/30" />
                  )}
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--cyan)] bg-[var(--bg0)]">
                    <div className="h-2 w-2 rounded-full bg-[var(--cyan)]" />
                  </div>
                  <div className="bg-[var(--bg2)]/30 rounded-xl border border-[var(--border)]/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--${meta.colorVar})]/20 text-[var(--${meta.colorVar})]`}>
                          <i className={`ti ${meta.icon}`} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-[var(--t1)] font-semibold">{meta.label}</p>
                          <p className="text-[var(--t2)] text-xs">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      {result.valid ? (
                        <i className="ti ti-check-circle text-[var(--green)]" aria-hidden="true" />
                      ) : (
                        <i className="ti ti-alert-triangle text-[var(--red)]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--t2)]">
                      <div>
                        <p className="text-xs mb-1">From</p>
                        <p className="text-[var(--t1)] font-mono text-xs truncate">{tx.fromOrgId || 'Genesis'}</p>
                      </div>
                      <div>
                        <p className="text-xs mb-1">To</p>
                        <p className="text-[var(--t1)] font-mono text-xs truncate">{tx.toOrgId || 'Pending'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--border)]/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--t3)] text-xs">Previous Hash</span>
                        <HashDisplay hash={tx.previousHash} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--t3)] text-xs">Signature Hash</span>
                        <HashDisplay hash={tx.signatureHash} />
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[var(--t3)] text-xs">
            This verification was performed on-chain using SHA-256 hash signatures.
            {result.chain.length > 0 && ` ${result.chain.length} movement event(s) verified.`}
          </p>
        </div>
      </div>
    </div>
  );
};
