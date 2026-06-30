import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import React from 'react';

export const PageShell = ({ title, children, showSidebar = true }: { 
  title: string; 
  children: React.ReactNode; 
  showSidebar?: boolean 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Generate breadcrumb based on current path
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [{ label: 'Home', path: '/' }];

    if (path === '/') return items;

    const paths = path.split('/').filter(Boolean);
    let accumulatedPath = '';

    paths.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      let label = segment;

      // Convert path segments to readable labels
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard';
          break;
        case 'products':
          label = 'Products';
          break;
        case 'new':
          label = paths[index - 1] === 'products' ? 'New Product' : 'New Batch';
          break;
        case 'edit':
          label = 'Edit Product';
          break;
        case 'transactions':
          label = 'Log Movement';
          break;
        case 'history':
          label = 'Transaction History';
          break;
        case 'scan':
          label = 'Scan QR';
          break;
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      items.push({ label, path: accumulatedPath });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div className="flex min-h-screen bg-[var(--bg0)]">
      {/* Sidebar - Desktop */}
      {showSidebar && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Sidebar - Mobile Overlay */}
      {showSidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="w-64 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-[var(--bg1)] text-[var(--t1)] px-4 lg:px-6 py-4 flex items-center justify-between border-b border-[var(--border)] sticky top-0 z-30 w-full">
          <div className="flex items-center space-x-4">
            {showSidebar && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-md hover:bg-[var(--bg2)] text-[var(--t2)] transition-colors"
                aria-label="Open sidebar"
              >
                <i className="ti ti-menu-2 text-xl"></i>
              </button>
            )}
            <h1 className="text-lg lg:text-xl font-bold truncate">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="w-8 h-8 bg-[var(--bg2)] rounded-full flex items-center justify-center">
                  <i className="ti ti-user text-[var(--t2)]"></i>
                </div>
                <span className="text-[var(--t2)]">{user.email.split('@')[0]}</span>
              </>
            ) : (
              <span className="text-[var(--t2)]">Guest</span>
            )}
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="bg-[var(--bg2)] text-[var(--t2)] px-4 lg:px-6 py-2 border-b border-[var(--border)] overflow-x-auto">
          <ol className="flex items-center space-x-2 text-sm whitespace-nowrap">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.path}>
                {index > 0 && <span className="mx-2 opacity-50">/</span>}
                {item.path === location.pathname ? (
                  <span className="text-[var(--t1)] font-medium">{item.label}</span>
                ) : (
                  <Link to={item.path} className="hover:text-[var(--cyan)] transition-colors">
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </ol>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
