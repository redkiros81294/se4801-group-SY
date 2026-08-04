import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ChartPoint {
  day: string;
  batches: number;
}

export const BatchProductionChart = ({ data, total }: { data: ChartPoint[]; total: number }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-[var(--t1)]">Batch Production (Last 7 Days)</h3>
      <span className="px-3 py-1 bg-[var(--bg2)]/50 border border-[var(--border)]/20 rounded-full text-xs text-[var(--t2)]">
        {total} total batches
      </span>
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
          <XAxis dataKey="day" stroke="var(--t2)" />
          <YAxis stroke="var(--t2)" allowDecimals={false} />
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
);
