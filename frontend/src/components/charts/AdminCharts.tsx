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

const PIE_COLORS = ['var(--cyan)', 'var(--blue)', 'var(--green)', 'var(--red)']

// Note: the backend does not yet expose per-day trend data, so this chart
// uses sample data. Swap `lineData` for a real endpoint when available.
const lineData = [
  { day: 'Mon', transactions: 12 },
  { day: 'Tue', transactions: 18 },
  { day: 'Wed', transactions: 15 },
  { day: 'Thu', transactions: 22 },
  { day: 'Fri', transactions: 28 },
  { day: 'Sat', transactions: 10 },
  { day: 'Sun', transactions: 8 },
]

export const AdminCharts = ({ pieData }: { pieData: Array<{ name: string; value: number }> }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Line Chart */}
    <div className="lg:col-span-2 bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--t1)]">Transaction Volume (Last 7 Days)</h3>
        <span className="px-3 py-1 bg-[var(--bg2)]/50 border border-[var(--border)]/20 rounded-full text-xs text-[var(--t2)]">Sample data</span>
      </div>
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
);
