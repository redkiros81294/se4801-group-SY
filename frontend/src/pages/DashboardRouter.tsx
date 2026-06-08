import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ManufacturerDashboard } from './ManufacturerDashboard';

export const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return null;

  if (user.roles.includes('ADMIN')) {
    return <AdminDashboard />;
  }

  if (user.roles.includes('MANUFACTURER')) {
    return <ManufacturerDashboard />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ChainTrack Dashboard</h1>
      <p className="text-[var(--t2)]">Welcome to your supply chain provenance platform</p>
    </div>
  );
};
