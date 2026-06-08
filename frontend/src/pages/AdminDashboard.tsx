import { useState, useEffect } from 'react';
import api from '../lib/api';
import { StatCard } from '../components/StatCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

const PIE_COLORS = ['var(--cyan)', 'var(--blue)', 'var(--green)', 'var(--red)']

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        setAnalytics(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const pieData = analytics
    ? [
        { name: 'Created', value: analytics.batchesCreated },
        { name: 'In Transit', value: analytics.batchesInTransit },
        { name: 'Delivered', value: analytics.batchesDelivered },
        { name: 'Compromised', value: analytics.batchesCompromised },
      ]
    : [];

  // Mock time-series for line chart until backend exposes trend data
  const lineData = [
    { day: 'Mon', transactions: 12 },
    { day: 'Tue', transactions: 18 },
    { day: 'Wed', transactions: 15 },
    { day: 'Thu', transactions: 22 },
    { day: 'Fri', transactions: 28 },
    { day: 'Sat', transactions: 10 },
    { day: 'Sun', transactions: 8 },
  ]

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h3 className="text-lg font-bold text-[var(--t1)] mb-4">Transaction Volume (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
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
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="var(--cyan)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--cyan)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h3 className="text-lg font-bold text-[var(--t1)] mb-4">Batch Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
