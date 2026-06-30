import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Toast } from '../components/Toast';
import { QRDisplay } from '../components/QRDisplay';

interface Product {
  id: string
  sku: string
  name: string
  category: string
}

export const CreateBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'qr'>('select');
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/products?size=100');
        setProducts(data.content ?? []);
      } catch {
        setError('Failed to load products');
      }
    };
    load();
  }, []);

  const createBatch = async () => {
    if (!productId) return;
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/batches', {
        productId,
        manufacturerId: user!.orgId,
      });
      setBatchId(data.id);
      setSuccess('Batch created');

      const { data: detail } = await api.get(`/batches/${data.id}`);
      setBatchNumber(detail.batchNumber ?? '');

      const qr = await api.post(`/batches/${data.id}/qr`);
      setQrImage(qr.data.qrImage ?? '');
      setStep('qr');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrImage}`;
    link.download = `batch-${batchNumber || batchId}-qrcode.png`;
    link.click();
  };

  const onSubmitSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBatch();
  };

  const onPrint = () => {
    if (!qrImage) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>QR - ${batchNumber}</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh"><img src="data:image/png;base64,${qrImage}" style="max-width:80%;height:auto"></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
      <div className="max-w-3xl mx-auto">
        {(error || success) && (
          <Toast type={error ? 'error' : 'success'} message={error || success} onClose={() => { setError(''); setSuccess(''); }} />
        )}

        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${step === 'select' ? 'text-[var(--cyan)]' : 'text-[var(--t3)]'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step === 'select' ? 'border-[var(--cyan)] bg-[var(--cyan)]/20' : 'border-[var(--t3)]'}`}><span className="text-sm font-medium">1</span></div>
            <span className="text-sm font-medium">Batch Details</span>
          </div>
          <div className={`h-0.5 w-12 ${step === 'qr' ? 'bg-[var(--cyan)]' : 'bg-[var(--t3)]'}`} />
          <div className={`flex items-center space-x-2 ${step === 'qr' ? 'text-[var(--cyan)]' : 'text-[var(--t3)]'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step === 'qr' ? 'border-[var(--cyan)] bg-[var(--cyan)]/20' : 'border-[var(--t3)]'}`}><span className="text-sm font-medium">2</span></div>
            <span className="text-sm font-medium">QR Code</span>
          </div>
        </div>

        {step === 'select' && (
          <form onSubmit={onSubmitSelect} className="space-y-6">
            <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
              <h2 className="text-xl font-bold text-[var(--t1)] mb-6">Step 1: Select Product</h2>

              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">Product <span className="text-[var(--red)]">*</span></label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full mb-6 px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50"
                required
              >
                <option value="">Choose a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                ))}
              </select>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => navigate('/products')} className="px-6 py-3 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading || !productId} className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'qr' && (
          <div className="space-y-6">
            <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 text-center">
              <h2 className="text-xl font-bold text-[var(--t1)] mb-2">Step 2: QR Code Ready</h2>
              <p className="text-[var(--t2)] mb-6">Batch <span className="font-mono">{batchNumber}</span> created successfully.</p>

              {qrImage ? (
                <QRDisplay base64={qrImage} batchNumber={batchNumber || batchId} className="mx-auto" />
              ) : (
                <div className="flex items-center justify-center py-12"><div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" /></div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('select')} className="px-6 py-3 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors">Back</button>
              <div className="flex space-x-4">
                <button onClick={handleDownload} disabled={!qrImage} className="px-6 py-3 rounded-lg bg-[var(--blue)]/20 text-[var(--blue)] hover:bg-[var(--blue)]/30 transition-colors disabled:opacity-50">Download</button>
                <button onClick={onPrint} disabled={!qrImage} className="px-6 py-3 rounded-lg bg-[var(--green)]/20 text-[var(--green)] hover:bg-[var(--green)]/30 transition-colors disabled:opacity-50">Print</button>
                <button onClick={() => navigate('/products')} className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors">Finish</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};
