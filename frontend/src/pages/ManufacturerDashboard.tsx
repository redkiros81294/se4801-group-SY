import { lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { StatCard } from '../components/StatCard';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

// recharts is large (~110 KB gzipped) -- load it only when this chart renders.
const BatchProductionChart = lazy(() =>
  import('../components/charts/BatchProductionChart').then(m => ({ default: m.BatchProductionChart }))
);

interface Product {
  id: string
  name: string
}

interface Batch {
  id: string
  productId: string
  productName: string
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPROMISED'
  manufacturerId: string
  createdAt: string
}

interface DashboardData {
  products: Product[]
  batches: Batch[]
}

export const ManufacturerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useApiData<DashboardData>(
    async () => {
      const [productsRes, batchesRes] = await Promise.all([
        api.get('/products?size=100'),
        api.get('/batches?size=100'),
      ]);
      return {
        products: productsRes.data.content ?? productsRes.data ?? [],
        batches: batchesRes.data.content ?? batchesRes.data ?? [],
      };
    },
    [user?.orgId],
    { enabled: !!user?.orgId },
  );

  const products = data?.products ?? [];
  const batches = data?.batches ?? [];

  const myBatches = useMemo(() => {
    if (!user?.orgId) return [];
    return batches.filter(b => b.manufacturerId === user.orgId);
  }, [batches, user?.orgId]);

  const activeBatches = myBatches.filter(b => b.status === 'CREATED' || b.status === 'IN_TRANSIT').length;
  const deliveredBatches = myBatches.filter(b => b.status === 'DELIVERED').length;
  const compromisedBatches = myBatches.filter(b => b.status === 'COMPROMISED').length;

  // Real per-day batch production for the last 7 days
  const chartData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: { day: string; batches: number }[] = [];
    const dayStarts: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dayStarts.push(d);
      days.push({ day: labels[d.getDay()], batches: 0 });
    }
    for (const b of myBatches) {
      const created = new Date(b.createdAt);
      const idx = dayStarts.findIndex(d => created.toDateString() === d.toDateString());
      if (idx >= 0) days[idx].batches += 1;
    }
    return days;
  }, [myBatches]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-96" />
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
      {/* Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => navigate('/batches/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--blue)] text-[var(--t1)] font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors duration-200"
        >
          <i className="ti ti-plus" aria-hidden="true" />
          <span>New Batch</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Products"
          value={products.length}
          trend="neutral"
          icon={<i className="ti ti-package" aria-hidden="true" />}
        />
        <StatCard
          label="Active Batches"
          value={activeBatches}
          trend={activeBatches > 0 ? 'up' : 'neutral'}
          icon={<i className="ti ti-layer" aria-hidden="true" />}
        />
        <StatCard
          label="Delivered"
          value={deliveredBatches}
          trend={deliveredBatches > 0 ? 'up' : 'neutral'}
          icon={<i className="ti ti-check" aria-hidden="true" />}
        />
        <StatCard
          label="Compromised"
          value={compromisedBatches}
          trend={compromisedBatches > 0 ? 'down' : 'neutral'}
          icon={<i className="ti ti-alert-triangle" aria-hidden="true" />}
        />
      </div>

      {/* Batch Production Trend */}
      <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <BatchProductionChart data={chartData} total={myBatches.length} />
        </Suspense>
      </div>
    </div>
  );
};
