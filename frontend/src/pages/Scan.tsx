import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import api from '../lib/api';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      setScanning(false);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError('Camera access denied. Use manual entry below.');
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
      <h1 className="text-2xl font-bold mb-4">QR Verification</h1>
      
      {cameraError && (
        <div className="bg-yellow-100 p-3 rounded mb-4">{cameraError}</div>
      )}

      <div className="relative mb-4 overflow-hidden rounded-xl">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scan frame overlay */}
        {scanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            {/* Top-left */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[var(--cyan)]"></div>
            {/* Top-right */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[var(--cyan)]"></div>
            {/* Bottom-left */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[var(--cyan)]"></div>
            {/* Bottom-right */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[var(--cyan)]"></div>
            
            {/* Scan line */}
            <div className="absolute left-0 right-0 h-0.5 bg-[var(--cyan)]/80 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-scan-line"></div>
          </div>
        )}
      </div>

      <form onSubmit={handleManualSubmit} className="mb-4">
        <label className="block text-sm font-medium mb-2">Manual Token Entry</label>
        <input
          type="text"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Enter QR token"
          className="w-full px-3 py-2 border rounded"
        />
        <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
          Verify
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded ${result.valid ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="text-lg font-bold">{result.valid ? 'VALID' : 'COMPROMISED'}</h2>
          <p>Product: {result.productName}</p>
          <p>SKU: {result.sku}</p>
          <p>Batch: {result.batchNumber}</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
};