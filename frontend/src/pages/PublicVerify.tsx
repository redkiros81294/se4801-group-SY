import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// The seed dataset ships a QR token that verifies VALID -- perfect for demos.
const DEMO_TOKEN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const EVENT_STYLE: Record<string, string> = {
  MANUFACTURED: 'bg-[var(--blue)]/15 text-[var(--blue)] border-[var(--blue)]/25',
  SHIPPED: 'bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/25',
  IN_TRANSIT: 'bg-[var(--cyan)]/15 text-[var(--cyan)] border-[var(--cyan)]/25',
  RECEIVED: 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/25',
};

export const PublicVerify = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const jsqrRef = useRef<any>(null);
  const verifyingRef = useRef(false);

  const stopScanLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const stopCamera = () => {
    stopScanLoop();
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopScanLoop();
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const requestCameraPermission = async () => {
    setCameraError('');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      setCameraStatus('denied');
      setCameraError('Camera access requires a secure connection (HTTPS). Please access this page over HTTPS, or use manual entry below to verify your QR code.');
      return;
    }
    setCameraStatus('requesting');
    try {
      if (!jsqrRef.current) {
        const { default: jsQR } = await import('jsqr');
        jsqrRef.current = jsQR;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCameraStatus('active');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraStatus('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings, or use manual entry below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please use manual entry below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is in use by another application. Please close other apps using the camera, or use manual entry below.');
      } else {
        setCameraError('Unable to access camera. Use manual entry below to verify your QR code.');
      }
    }
  };

  const scanFrame = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (jsqrRef.current) {
          const code = jsqrRef.current(imageData.data, imageData.width, imageData.height);
          if (code && !verifyingRef.current) {
            verifyToken(code.data);
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (stream) {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
    return () => stopScanLoop();
  }, [stream]);

  const verifyToken = async (value: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    try {
      const response = await api.get(`/verify/${value}`);
      setResult(response.data);
      setToken(value);
    } catch (err: any) {
      setError(err.response?.status === 404
        ? 'No product found for this token. Check the code and try again.'
        : (err.response?.data?.message || 'Verification failed. Please try again.'));
    } finally {
      verifyingRef.current = false;
    }
  };

  const searchBatches = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.get(`/batches/search?q=${encodeURIComponent(query.trim())}`);
      const batches = response.data?.content ?? [];
      if (batches.length === 0) {
        setError('No batches found matching that query.');
      } else if (batches.length === 1) {
        window.location.href = `/batches/${batches[0].id}`;
      } else {
        setError('Multiple batches found. Please refine your search or open the batch list.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <i className="ti ti-shield-check text-[var(--cyan)] text-2xl" aria-hidden="true" />
            <span className="font-bold text-lg tracking-tight">
              Chain<span className="text-[var(--cyan)]">Track</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25">
              Public Verification
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-[var(--t2)] hover:text-[var(--cyan)] transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Verify a product's journey
          </h1>
          <p className="text-[var(--t2)] max-w-2xl mx-auto">
            Scan the QR code on any ChainTrack-protected product -- or paste its token below --
            to see its full, tamper-evident provenance from manufacturing to delivery.
            No account needed.
          </p>
        </div>

        {/* Camera scanner */}
        {cameraStatus === 'idle' && (
          <div className="max-w-xl mx-auto bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border)]/20 p-6 mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-[var(--cyan)]/20">
                <i className="ti ti-scan text-[var(--cyan)] text-3xl" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--t1)] mb-2">Scan QR Code</h2>
            <p className="text-[var(--t2)] mb-6 max-w-sm mx-auto">
              Use your camera to scan a QR code and instantly verify the product's supply chain provenance.
            </p>
            <p className="text-[var(--t3)] text-xs mb-6">
              Camera access requires HTTPS or localhost. Your video stream is processed locally and never uploaded.
            </p>
            <button
              onClick={requestCameraPermission}
              className="px-6 py-3 rounded-lg bg-[var(--cyan)] text-[var(--bg0)] font-medium hover:bg-[var(--cyan)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/30"
            >
              <i className="ti ti-camera mr-2" aria-hidden="true" />
              Start Camera Scanner
            </button>
          </div>
        )}

        {cameraStatus === 'requesting' && (
          <div className="max-w-xl mx-auto bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border)]/20 p-8 mb-8 text-center">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[var(--t2)]">Requesting camera permission...</span>
              </div>
            </div>
          </div>
        )}

        {cameraStatus === 'active' && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--cyan)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--cyan)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--cyan)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--cyan)]"></div>
                <div className="absolute left-0 right-0 h-0.5 bg-[var(--cyan)]/80 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-scan-line"></div>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200 text-sm"
              >
                <i className="ti ti-x mr-1" aria-hidden="true" />
                Stop Scanner
              </button>
            </div>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="max-w-xl mx-auto bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--amber)]/20 p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--amber)]/20 text-[var(--amber)]">
                <i className="ti ti-alert-triangle" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--t1)] font-semibold mb-2">Camera Unavailable</h3>
                <p className="text-[var(--t2)] text-sm mb-4">{cameraError}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200 text-sm"
                  >
                    <i className="ti ti-undo mr-1" aria-hidden="true" />
                    Back
                  </button>
                  <button
                    onClick={requestCameraPermission}
                    className="px-4 py-2 rounded-lg bg-[var(--cyan)]/20 text-[var(--cyan)] hover:bg-[var(--cyan)]/30 transition-colors duration-200 text-sm"
                  >
                    <i className="ti ti-refresh mr-1" aria-hidden="true" />
                    Retry Camera
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Batch search */}
        <div className="max-w-xl mx-auto bg-[var(--bg1)]/60 backdrop-blur-sm rounded-2xl border border-[var(--border)]/20 p-6 mb-8">
          <label htmlFor="batch-search" className="block text-sm font-medium text-[var(--t2)] mb-2">
            Search by batch number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="batch-search"
              type="text"
              placeholder="e.g. BATCH-ABC-2024-001"
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/40"
              onKeyDown={(e) => e.key === 'Enter' && searchBatches((e.target as HTMLInputElement).value)}
            />
            <button
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                searchBatches(input.value);
              }}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 px-6 rounded-xl bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-[var(--t1)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <i className="ti ti-search" aria-hidden="true" />
                  Search
                </>
              )}
            </button>
          </div>
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
                      : "This product's chain shows signs of tampering -- treat with caution."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">Product</div>
                  <div className="font-medium mt-0.5">{result.productName ?? '--'}</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg2)]/60">
                  <div className="text-[var(--t3)] text-xs uppercase tracking-wider">SKU</div>
                  <div className="font-medium mt-0.5 font-mono text-sm">{result.sku ?? '--'}</div>
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
