import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface VerifyResult {
  valid: boolean;
  productName: string;
  sku: string;
  batchNumber: string;
  status: string;
  chain: Array<{
    eventType: string;
    timestamp: string;
    fromOrg?: string;
    toOrg?: string;
  }>;
}

export const Scan = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Don't auto-start camera — wait for user permission
    return () => {
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
      setCameraError('Camera access requires a secure connection (HTTPS). Please access this page over HTTPS, or use the manual token entry below to verify your QR code.');
      return;
    }
    setCameraStatus('requesting');
    try {
      // Note: Camera API requires HTTPS or localhost
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
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
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          verifyToken(code.data);
        }
      }
    }
    requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (stream) {
      requestAnimationFrame(scanFrame);
    }
  }, [stream]);

  const verifyToken = async (token: string) => {
    try {
      const response = await api.get(`/verify/${token}`);
      setResult(response.data);
    } catch (err: any) {
      setCameraError('Invalid token or batch not found');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) verifyToken(manualToken);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-[var(--t1)]">QR Verification</h1>
      
      {/* Camera permission prompt — shown when idle */}
      {cameraStatus === 'idle' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-8 text-center">
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
          
          <div className="mt-6 pt-6 border-t border-[var(--border)]/20">
            <p className="text-[var(--t3)] text-sm mb-3">Or enter the token manually:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste QR token here"
                className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
              >
                Verify
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Requesting permission — loading state */}
      {cameraStatus === 'requesting' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-8 text-center">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--t2)]">Requesting camera permission...</span>
            </div>
          </div>
        </div>
      )}

      {/* Active scanner — camera granted */}
      {cameraStatus === 'active' && (
        <>
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--cyan)]"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--cyan)]"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--cyan)]"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--cyan)]"></div>
              <div className="absolute left-0 right-0 h-0.5 bg-[var(--cyan)]/80 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-scan-line"></div>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <button
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach(t => t.stop());
                  setStream(null);
                }
                setCameraStatus('idle');
                setResult(null);
              }}
              className="px-4 py-2 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200 text-sm"
            >
              <i className="ti ti-x mr-1" aria-hidden="true" />
              Stop Scanner
            </button>
          </div>
        </>
      )}

      {/* Permission denied — graceful fallback */}
      {cameraStatus === 'denied' && (
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--amber)]/20 p-6 mb-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--amber)]/20 text-[var(--amber)]">
              <i className="ti ti-alert-triangle" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-[var(--t1)] font-semibold mb-2">Camera Unavailable</h3>
              <p className="text-[var(--t2)] text-sm mb-4">{cameraError}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCameraStatus('idle')}
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

      {/* Manual token entry — always visible, more prominent fallback */}
      <div className={`bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 ${cameraStatus === 'active' ? 'mt-4' : ''}`}>
        <h3 className="text-[var(--t1)] font-semibold mb-4">
          <i className="ti ti-keyboard mr-2 text-[var(--t2)]" aria-hidden="true" />
          Manual Token Verification
        </h3>
        <p className="text-[var(--t3)] text-xs mb-4">Paste the token value from the QR code below if you cannot use the camera.</p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Enter QR token"
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
          >
            Verify Token
          </button>
        </form>
      </div>

      {result && (
        <div className={`p-4 rounded-xl mt-4 ${result.valid ? 'bg-[var(--green)]/10 border border-[var(--green)]/20' : 'bg-[var(--red)]/10 border border-[var(--red)]/20'}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--bg2)]/50">
              <i className={`ti ${result.valid ? 'ti-check-circle text-[var(--green)]' : 'ti-alert-octagon text-[var(--red)]'}`} aria-hidden="true" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${result.valid ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {result.valid ? 'VERIFIED' : 'COMPROMISED'}
              </h2>
              <div className="mt-2 space-y-1 text-sm text-[var(--t2)]">
                <p>Product: <span className="text-[var(--t1)]">{result.productName}</span></p>
                <p>SKU: <span className="font-mono text-[var(--t1)]">{result.sku}</span></p>
                <p>Batch: <span className="font-mono text-[var(--t1)]">{result.batchNumber}</span></p>
                <p>Status: <StatusBadge status={result.status as any} /></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};