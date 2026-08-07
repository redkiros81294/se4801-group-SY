import { clsx } from 'clsx';

interface RoleChipProps {
  role: string;
  className?: string;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-[var(--purple)]/15 text-[var(--purple)] border border-[var(--purple)]/25',
  MANUFACTURER: 'bg-[var(--teal)]/15 text-[var(--teal)] border border-[var(--teal)]/25',
  SHIPPER: 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/25',
  RETAILER: 'bg-[var(--pink)]/15 text-[var(--pink)] border border-[var(--pink)]/25',
};

export const RoleChip = ({ role, className = '' }: RoleChipProps) => {
  const style = ROLE_STYLES[role] ?? 'bg-[var(--bg2)] text-[var(--t2)] border border-[var(--border)]';

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', style, className)}>
      {role}
    </span>
  );
};
