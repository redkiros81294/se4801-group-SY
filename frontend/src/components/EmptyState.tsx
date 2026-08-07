import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon = 'ti ti-inbox', title, message, action, className = '' }: EmptyStateProps) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center p-8', className)}>
      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[var(--bg2)] text-[var(--t3)] mb-4">
        <i className={clsx(icon, 'text-2xl')} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--t1)] mb-1">{title}</h3>
      {message && <p className="text-sm text-[var(--t2)] max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
