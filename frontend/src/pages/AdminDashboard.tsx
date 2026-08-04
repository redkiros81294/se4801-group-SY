import { lazy, Suspense, useMemo } from 'react';
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
