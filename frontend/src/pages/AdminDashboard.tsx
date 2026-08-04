import { lazy, Suspense, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import api from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { StatCard } from '../components/StatCard';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

// recharts is large (~110 KB gzipped) — load it only when the charts render.
const AdminCharts = lazy(() =>
  import('../components/charts/AdminCharts').then(m => ({ default: m.AdminCharts }))
);

interface AdminAnalytics {
  totalOrganizations: number
  totalProducts: number
  totalBatches: number
  totalTransactions: number
  batchesCreated: number
  batchesInTransit: number
  batchesDelivered: number
  batchesCompromised: number
}

export const AdminDashboard = () => {
  const { data: analytics, loading, error, refetch } = useApiData<AdminAnalytics>(
    () => api.get('/admin/analytics').then(res => res.data),
  );
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleResetDemoData = async () => {
    setResetting(true);
    setResetMessage('');
    try {
      const response = await api.post('/admin/demo/reset');
      setResetMessage(response.data?.message || 'Demo dataset restored');
      setConfirmingReset(false);
      refetch();
    } catch (err: any) {
      setResetMessage(err.response?.data?.message || 'Reset failed — try again');
    } finally {
      setResetting(false);
    }
  };

  const pieData = useMemo(
    () => analytics
      ? [
          { name: 'Created', value: analytics.batchesCreated },
          { name: 'In Transit', value: analytics.batchesInTransit },
          { name: 'Delivered', value: analytics.batchesDelivered },
          { name: 'Compromised', value: analytics.batchesCompromised },
        ]
      : [],
    [analytics],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <i className="ti ti-alert-circle text-[var(--red)] text-4xl mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Unable to load dashboard</h2>
        <p className="text-[var(--t2)] mb-6">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with demo reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">System Dashboard</h1>
          <p className="text-[var(--t2)] text-sm mt-1">Live supply-chain analytics across all organizations</p>
        </div>

        <div className="flex items-center gap-3">
          {resetMessage && (
            <span className="text-sm text-[var(--green)]">{resetMessage}</span>
          )}
          {confirmingReset ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--amber)]">Reset all demo data?</span>
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="px-3 py-2 rounded-lg bg-[var(--red)]/20 text-[var(--red)] text-sm font-medium hover:bg-[var(--red)]/30 transition-colors disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Yes, reset'}
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="px-3 py-2 rounded-lg bg-[var(--bg2)] text-[var(--t2)] text-sm hover:bg-[var(--bg3)] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setConfirmingReset(true); setResetMessage(''); }}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                'border-[var(--amber)]/30 text-[var(--amber)] hover:bg-[var(--amber)]/10'
              )}
              title="Restore the seeded demo dataset (audit log is preserved)"
            >
              <i className="ti ti-refresh" aria-hidden="true" />
              Reset demo data
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Organizations"
          value={analytics?.totalOrganizations ?? 0}
          trend="neutral"
          icon={<i className="ti ti-building" aria-hidden="true" />}
        />
        <StatCard
          label="Products"
          value={analytics?.totalProducts ?? 0}
          trend="up"
          icon={<i className="ti ti-package" aria-hidden="true" />}
        />
        <StatCard
          label="Batches"
          value={analytics?.totalBatches ?? 0}
          trend="up"
          icon={<i className="ti ti-layer" aria-hidden="true" />}
        />
        <StatCard
          label="Transactions"
          value={analytics?.totalTransactions ?? 0}
          trend="up"
          icon={<i className="ti ti-exchange" aria-hidden="true" />}
        />
      </div>

      {/* Charts — loaded lazily so recharts only downloads when they render */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AdminCharts pieData={pieData} />
      </Suspense>
    </div>
  );
};
