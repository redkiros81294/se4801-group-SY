import { useNavigate, useLocation } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Show the original path if coming from wildcard redirect, otherwise show current pathname
  const originalPath = (location.state as { from?: string })?.from || (location.pathname === '/not-found' ? null : location.pathname);

  return (
    <div className="min-h-screen bg-[var(--bg0)] flex items-center justify-center p-4">
      <div className="bg-[var(--bg1)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full text-center space-y-6 animate-fade-in">
        <main role="main" aria-label="Page not found">
          <div className="w-16 h-16 bg-[var(--amber)]/10 rounded-full flex items-center justify-center mx-auto">
            <i className="ti ti-alert-octagon text-[var(--amber)] text-3xl"></i>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--t1)] mb-2">Page Not Found</h1>
            <p className="text-[var(--t2)]">
              {originalPath ? `The route ${originalPath} was not found.` : 'The page you are looking for does not exist.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 h-12 bg-[var(--bg2)] text-[var(--t1)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg3)] transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 h-12 bg-[var(--blue)] text-[var(--t1)] rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
            >
              Go Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};