import { useNavigate } from 'react-router-dom';

export const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--bg0)] flex items-center justify-center p-4">
      <div className="bg-[var(--bg1)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-[var(--red)]/10 rounded-full flex items-center justify-center mx-auto">
          <i className="ti ti-lock text-[var(--red)] text-3xl"></i>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)] mb-2">Access Denied</h1>
          <p className="text-[var(--t2)]">
            You don't have permission to access this page.
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
            onClick={() => navigate('/dashboard', { replace: true })}
            className="flex-1 h-12 bg-[var(--blue)] text-[var(--t1)] rounded-lg hover:bg-[var(--blue)]/90 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
