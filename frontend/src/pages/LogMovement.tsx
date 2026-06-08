import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Toast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';

const ROLE_EVENT_TYPES: Record<string, string[]> = {
  MANUFACTURER: ['MANUFACTURED', 'SHIPPED'],
  SHIPPER: ['SHIPPED', 'IN_TRANSIT', 'RECEIVED'],
  RETAILER: ['RECEIVED'],
};

interface Batch {
  id: string;
  batchNumber: string;
  productName: string;
  status: string;
  fromOrgName?: string;
  toOrgName?: string;
}

export const LogMovement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [batchId, setBatchId] = useState('');
  const [eventType, setEventType] = useState('');
  const [fromOrgId, setFromOrgId] = useState('');
  const [toOrgId, setToOrgId] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [tokenValue, setTokenValue] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allowedEventTypes = user?.roles
    ? ROLE_EVENT_TYPES[user.roles[0]] || []
    : [];

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true);
        const { data } = await api.get('/batches?size=100');
        const batchList = (data.content ?? data).map((b: any) => ({
          id: b.id,
          batchNumber: b.batchNumber ?? b.id,
          productName: b.productName ?? 'Unknown',
          status: b.status ?? 'UNKNOWN',
          fromOrgName: b.fromOrgName,
          toOrgName: b.toOrgName,
        }));
        setBatches(batchList);
      } catch {
        setError('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, []);

  const selectedBatch = batches.find((b) => b.id === batchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!batchId || !eventType) {
      setError('Batch and event type are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, string> = {
        eventType,
        batchId,
        fromOrgId: fromOrgId || user?.orgId || '',
        toOrgId,
      };

      if (fromLocation) payload.fromLocation = fromLocation;
      if (toLocation) payload.toLocation = toLocation;
      if (tokenValue) payload.tokenValue = tokenValue;

      const { data } = await api.post('/transactions', payload);
      setSuccess('Movement logged successfully!');
      setBatchId('');
      setEventType('');
      setFromOrgId('');
      setToOrgId('');
      setFromLocation('');
      setToLocation('');
      setTokenValue('');

      setTimeout(() => {
        navigate(`/batches/${data.batchId ?? batchId}`);
      }, 1500);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to log movement';
      setError(typeof message === 'string' ? message : 'Failed to log movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Log Movement">
      <div className="max-w-2xl mx-auto">
        {(error || success) && (
          <Toast type={error ? 'error' : 'success'} message={error || success} onClose={() => { setError(''); setSuccess(''); }} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
            <h2 className="text-xl font-bold text-[var(--t1)] mb-6">Log Movement Event</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Batch <span className="text-[var(--red)]">*</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                onBlur={() => {
                  if (!batchId) setError('Please select a batch');
                }}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                required
              >
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} — {b.productName}
                  </option>
                ))}
              </select>
              {selectedBatch && (
                <div className="mt-2 flex items-center space-x-2">
                  <StatusBadge status={selectedBatch.status as any} />
                  {selectedBatch.fromOrgName && (
                    <span className="text-[var(--t3)] text-xs">
                      From: {selectedBatch.fromOrgName}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Event Type <span className="text-[var(--red)]">*</span>
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                onBlur={() => {
                  if (!eventType) setError('Please select an event type');
                }}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                required
              >
                <option value="">Select event type</option>
                {allowedEventTypes.map((et) => (
                  <option key={et} value={et}>
                    {et.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[var(--t3)] text-xs">
                Available roles: {user?.roles?.join(', ') || 'None'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                  From Organization ID
                </label>
                <input
                  type="text"
                  value={fromOrgId}
                  onChange={(e) => setFromOrgId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                  placeholder="Auto-filled from your org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                  To Organization ID <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="text"
                  value={toOrgId}
                  onChange={(e) => setToOrgId(e.target.value)}
                  onBlur={() => {
                    if (!toOrgId) setError('To organization is required');
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                  placeholder="e.g. receiver org id"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                  From Location
                </label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                  placeholder="Origin city or warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                  To Location
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                  placeholder="Destination city or warehouse"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[var(--t2)]">
                Token Value (optional)
              </label>
              <input
                type="text"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg2)]/50 border border-[var(--border)]/20 text-[var(--t1)] placeholder-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/50 transition-all duration-200"
                placeholder="QR token value if available"
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-lg border border-[var(--border)]/40 bg-[var(--bg2)]/50 text-[var(--t1)] hover:bg-[var(--bg3)]/50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingBatches}
                className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Logging...' : 'Log Movement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageShell>
  );
};