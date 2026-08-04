import { useState } from 'react';
import { clsx } from 'clsx';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface ChainEvent {
  eventType: string;
  timestamp: string;
  fromOrgId?: string;
  toOrgId?: string;
  signatureHash?: string;
  previousHash?: string;
}

type BatchStatus = 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPROMISED';

interface VerifyResult {
  valid: boolean;
  productName: string;
  sku: string;
  batchNumber: string;
  status: BatchStatus;
  chain: ChainEvent[];
}

// The seed dataset ships a QR token that verifies VALID — perfect for demos.
const DEMO_TOKEN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const EVENT_STYLE: Record<string, string> = {
  MANUFACTURED: 'bg-[var(--blue)]/15 text-[var(--blue)] border-[var(--blue)]/25',
  SHIPPED: 'bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/25',
  IN_TRANSIT: 'bg-[var(--cyan)]/15 text-[var(--cyan)] border-[var(--cyan)]/25',
  RECEIVED: 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/25',
};

export const PublicVerify = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const verify = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter a QR token to verify');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.get(`/verify/${trimmed}`);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.status === 404
        ? 'No product found for this token. Check the code and try again.'
        : (err.response?.data?.message || 'Verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const useDemoToken = () => {
    setToken(DEMO_TOKEN);
    verify(DEMO_TOKEN);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg0)] text-[var(--t1)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]/20 bg-[var(--bg1)]/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ti ti-shield-check text-[var(--cyan)] text-2xl" aria-hidden="true" />
            <span className="font-bold text-lg tracking-tight">
              Chain<span className="text-[var(--cyan)]">Track</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25">
              Public Verification
            </span>
          </div>
          <a
            href="#/"
            className="text-sm text-[var(--t2)] hover:text-[var(--cyan)] transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Verify a product's journey
          </h1>
          <p className="text-[var(--t2)] max-w-2xl mx-auto">
            Scan the QR code on any ChainTrack-protected product — or paste its token below —
            to see its full, tamper-evident provenance from manufacturing to delivery.
            No account needed.
          </p>
        </div>

        {/* Verify box */}
        <div className="max-w-xl mx-auto bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border)]/20 p-6 mb-8">
          <label htmlFor="verify-token" className="block text-sm font-medium text-[var(--t2)] mb-2">
            Product QR token
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="verify-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify(token)}
              placeholder="e.g. aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] font-mono placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/40"
            />
            <button
              onClick={() => verify(token)}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 px-6 rounded-xl bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-[var(--t1)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <i className="ti ti-scan" aria-hidden="true" />
                  Verify
                </>
              )}
            </button>
          </div>
          <button
            onClick={useDemoToken}
            className="mt-4 text-sm text-[var(--cyan)] hover:text-[var(--cyan)]/80 transition-colors inline-flex items-center gap-1.5"
          >
            <i className="ti ti-sparkles" aria-hidden="true" />
            Try a demo product token
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/25 flex items-start gap-3">
            <i className="ti ti-alert-triangle text-[var(--red)] mt-0.5" aria-hidden="true" />
            <p className="text-[var(--red)] text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className={clsx(
              'rounded-2xl border p-6',
              result.valid
                ? 'bg-[var(--green)]/10 border-[var(--green)]/30'
                : 'bg-[var(--red)]/10 border-[var(--red)]/30'
            )}>
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0',
                  result.valid ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--red)]/20 text-[var(--red)]'
                )}>
                  <i className={clsx('ti', result.valid ? 'ti-shield-check' : 'ti-shield-x')} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">
                    {result.valid ? 'Authentic product' : 'Verification failed'}
                  </h2>
                  <p className="text-[var(--t2)] text-sm">
                    {result.valid
                      ? "This product's provenance chain is intact and untampered."
                      : "This product's chain shows signs of tampering — treat with caution."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">Product</div>
                  <div className="font-medium mt-0.5">{result.productName ?? '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">SKU</div>
                  <div className="font-medium mt-0.5 font-mono text-sm">{result.sku ?? '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">Batch</div>
                  <div className="font-medium mt-0.5 font-mono text-sm">{result.batchNumber}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">Status</div>
                  <div className="mt-1"><StatusBadge status={result.status} /></div>
                </div>
              </div>
            </div>

            {/* Provenance chain */}
            <div className="bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border)]/20 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <i className="ti ti-route text-[var(--cyan)]" aria-hidden="true" />
                Verified journey ({result.chain?.length ?? 0} event{(result.chain?.length ?? 0) === 1 ? '' : 's'})
              </h3>
              <ol className="space-y-0">
                {(result.chain ?? []).map((event, index) => (
                  <li key={index} className="relative pl-8 pb-6 last:pb-0">
                    {index < (result.chain?.length ?? 0) - 1 && (
                      <span className="absolute left-[11px] top-6 bottom-0 w-px bg-[var(--border)]/40" />
                    )}
                    <span className="absolute left-0 top-1 h-6 w-6 rounded-full bg-[var(--bg2)] border border-[var(--border)]/40 flex items-center justify-center">
                      <i className="ti ti-check text-[var(--cyan)] text-xs" aria-hidden="true" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={clsx('px-2 py-0.5 rounded-md text-xs font-semibold border', EVENT_STYLE[event.eventType] ?? 'bg-[var(--bg2)] text-[var(--t2)]')}>
                        {event.eventType}
                      </span>
                      <span className="text-[var(--t2)] text-xs">{formatTime(event.timestamp)}</span>
                    </div>
                    {event.signatureHash && (
                      <div className="mt-1 text-[10px] text-[var(--t3)] font-mono truncate max-w-[420px]">
                        SHA-256 {event.signatureHash.slice(0, 24)}…
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
