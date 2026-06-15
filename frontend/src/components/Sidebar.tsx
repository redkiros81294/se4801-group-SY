import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors and clear local state anyway
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Define routes based on user roles
  const getRoutes = () => {
    const routes = [
      { path: '/dashboard', label: 'Dashboard', icon: 'ti ti-home', roles: ['ADMIN', 'MANUFACTURER'] },
      { path: '/products', label: 'Products', icon: 'ti ti-box', roles: ['ADMIN', 'MANUFACTURER', 'SHIPPER', 'RETAILER'] },
      { path: '/products/new', label: 'Create Product', icon: 'ti ti-plus', roles: ['MANUFACTURER'] },
      { path: '/batches/new', label: 'Create Batch', icon: 'ti ti-tag', roles: ['MANUFACTURER'] },
      { path: '/transactions/new', label: 'Log Movement', icon: 'ti ti-truck', roles: ['MANUFACTURER', 'SHIPPER', 'RETAILER'] },
      { path: '/scan', label: 'Scan QR', icon: 'ti ti-scan', roles: ['ADMIN', 'MANUFACTURER', 'SHIPPER', 'RETAILER'] },
    ];

    // Filter routes based on user roles
    if (!user) return [];
    return routes.filter(route => 
      !route.roles || route.roles.includes(user.roles[0]) || 
      route.roles.some(role => user.roles.includes(role))
    );
  };

  const routes = getRoutes();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg1)] text-[var(--t1)] p-4 space-y-6">
      <div className="space-y-4">
        {/* User Profile Card */}
        <div className="text-center py-4 border-b border-[var(--border)] pb-4">
          {user ? (
            <>
              <div className="w-16 h-16 bg-[var(--bg2)] rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ti ti-user text-[var(--t2)] text-2xl"></i>
              </div>
              <h3 className="font-semibold text-[var(--t1)]">{user.email.split('@')[0]}</h3>
              <p className="text-[var(--t2)] text-sm">{user.roles?.[0] || 'USER'}</p>
            </>
          ) : (
            <div>
              <h3 className="font-semibold text-[var(--t1)]">Guest User</h3>
              <p className="text-[var(--t2)] text-sm">Not logged in</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {routes.map((route, index) => (
            <NavLink
              key={index}
              to={route.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-md text-[var(--t1)] hover:bg-[var(--bg3)] transition-colors
                ${isActive ? 'bg-[var(--bg2)]' : ''}
              `}
              end
            >
              <i className={`ti ti-${route.icon.split(' ')[1]} mr-3 text-[var(--cyan)]`} aria-hidden="true" />
              <span>{route.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer - Logout button */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-start px-3 py-2 rounded-md text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)] transition-colors"
        >
          <i className="ti ti-logout mr-3 text-[var(--red)]" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
