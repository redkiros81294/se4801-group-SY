import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { StatCard } from '../components/StatCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ProductStat {
  name: string
  batches: number
  delivered: number
}

export const ManufacturerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.orgId) return;

      try {
        const { data } = await api.get('/products?size=100');
        const productsList = data.content ?? data ?? [];
        const mapped: ProductStat[] = productsList.map((p: any) => ({
          name: p.name,
          batches: 0,
          delivered: 0,
        }));
        setProducts(mapped);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--t2)]">Loading dashboard...</span>
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
          onClick={() => window.location.reload()}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="My Products"
          value={products.length}
          trend="neutral"
          icon={<i className="ti ti-package" aria-hidden="true" />}
        />
        <StatCard
          label="Active Batches"
          value={products.reduce((acc, p) => acc + p.batches, 0)}
          trend="up"
          icon={<i className="ti ti-layer" aria-hidden="true" />}
        />
        <StatCard
          label="Delivered"
          value={products.reduce((acc, p) => acc + p.delivered, 0)}
          trend="up"
          icon={<i className="ti ti-check" aria-hidden="true" />}
        />
      </div>

      {/* Batch Production Trend */}
      <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
        <h3 className="text-lg font-bold text-[var(--t1)] mb-4">Batch Production (Last 7 Days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { day: 'Mon', batches: 4 },
              { day: 'Tue', batches: 6 },
              { day: 'Wed', batches: 5 },
              { day: 'Thu', batches: 8 },
              { day: 'Fri', batches: 7 },
              { day: 'Sat', batches: 3 },
              { day: 'Sun', batches: 2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
              <XAxis dataKey="day" stroke="var(--t2)" />
              <YAxis stroke="var(--t2)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="batches" fill="var(--blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};