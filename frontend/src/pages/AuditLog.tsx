import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import api from '../lib/api';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
  previousHash: string;
  integrityHash: string;
}

interface IntegrityResult {
  intact: boolean;
  entries: number;
  firstBrokenIndex: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/20',
  UPDATE: 'text-[var(--blue)] bg-[var(--blue)]/10 border-[var(--blue)]/20',
  DELETE: 'text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/20',
  LOGIN: 'text-[var(--cyan)] bg-[var(--cyan)]/10 border-[var(--cyan)]/20',
  LOGOUT: 'text-[var(--t3)] bg-[var(--t3)]/10 border-[var(--t3)]/20',
  APPROVE: 'text-[var(--green)] bg-[var(--green)]/10 border-[var(--green)]/20',
  REJECT: 'text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/20',
  INVITE: 'text-[var(--purple)] bg-[var(--purple)]/10 border-[var(--purple)]/20',
  GENERATE_QR: 'text-[var(--amber)] bg-[var(--amber)]/10 border-[var(--amber)]/20',
  VERIFY: 'text-[var(--cyan)] bg-[var(--cyan)]/10 border-[var(--cyan)]/20',
};

export const AuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, string | number> = { page, size: 20 };
      if (actorFilter.trim()) params.actor = actorFilter.trim();
      if (actionFilter.trim()) params.action = actionFilter.trim();
      const response = await api.get('/admin/audit', { params });
      setEntries(response.data?.content ?? []);
      setTotal(response.data?.totalElements ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, actorFilter, actionFilter]);

  const verifyIntegrity = async () => {
    try {
      setVerifying(true);
      setError('');
      const response = await api.get('/admin/audit/verify');
      setIntegrity(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify audit chain');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    verifyIntegrity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--t1)]">Audit Log</h1>
          <p className="text-[var(--t2)] text-sm mt-1">
            Immutable, hash-chained record of every action -- tamper-evident by design
          </p>
        </div>

        <button
          onClick={verifyIntegrity}
          disabled={verifying}
          className={clsx(
            'flex h-11 items-center justify-center gap-2 px-5 rounded-lg text-sm font-medium transition-colors',
            integrity?.intact
              ? 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25 hover:bg-[var(--green)]/25'
              : 'bg-[var(--red)]/15 text-[var(--red)] border border-[var(--red)]/25 hover:bg-[var(--red)]/25'
          )}
        >
          {verifying ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className="ti ti-shield-check" aria-hidden="true" />
          )}
          {integrity ? (
            integrity.intact
              ? `Chain intact · ${integrity.entries} entries`
              : `⚠ Tampering detected at entry ${integrity.firstBrokenIndex + 1}`
          ) : (
            'Verify integrity'
          )}
        </button>
      </div>

      {integrity && !integrity.intact && (
        <div className="p-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/25">
          <p className="text-[var(--red)] font-medium">
            <i className="ti ti-alert-triangle mr-2" aria-hidden="true" />
            The audit hash chain is broken at entry {integrity.firstBrokenIndex + 1} of {integrity.entries}.
            An entry was modified or removed -- investigate immediately.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/25">
          <p className="text-[var(--red)]">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={actorFilter}
          onChange={(e) => { setActorFilter(e.target.value); setPage(0); }}
          placeholder="Filter by actor email…"
          aria-label="Filter by actor"
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/40"
        />
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          placeholder="Filter by action (CREATE, LOGIN…)"
          aria-label="Filter by action"
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg2)] border border-[var(--border)]/30 text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]/40"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <i className="ti ti-list-check text-[var(--t3)] text-4xl mb-4" aria-hidden="true" />
            <h3 className="text-[var(--t1)] font-semibold mb-2">No audit entries</h3>
            <p className="text-[var(--t2)] text-sm">Actions will appear here as users interact with the system</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[var(--bg2)]/50">
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">When</th>
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">Entity</th>
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">IP</th>
                  <th className="px-4 py-3 text-left text-[var(--t2)] font-medium text-xs uppercase tracking-wider">Integrity</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const actionClass = ACTION_COLORS[entry.action.split('_')[0]] ?? 'text-[var(--t1)] bg-[var(--bg2)] border-[var(--border)]/20';
                  return (
                    <tr key={entry.id} className={clsx(
                      'border-t border-[var(--border)]/20 align-top',
                      index % 2 === 1 ? 'bg-[var(--bg2)]/20' : 'bg-[var(--bg2)]/5'
                    )}>
                      <td className="px-4 py-3 text-[var(--t2)] text-xs whitespace-nowrap">{formatTime(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--t1)] text-sm font-mono">{entry.actor}</div>
                        {entry.requestId && <div className="text-[var(--t3)] text-[10px] font-mono">req {entry.requestId.slice(0, 12)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('px-2 py-1 rounded-md text-xs font-semibold border inline-block', actionClass)}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--t1)] text-sm">{entry.entityType}</div>
                        {entry.entityId && <div className="text-[var(--t3)] text-[10px] font-mono break-all">{entry.entityId}</div>}
                        {entry.summary && (
                          <div className="text-[var(--t3)] text-[11px] mt-1 max-w-[280px] truncate" title={entry.summary}>
                            {entry.summary}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--t2)] text-xs font-mono">{entry.ipAddress ?? '--'}</td>
                      <td className="px-4 py-3 text-[var(--t3)] text-[10px] font-mono break-all max-w-[180px]" title={`${entry.previousHash} → ${entry.integrityHash}`}>
                        {entry.integrityHash.slice(0, 16)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[var(--t2)] text-sm">{total} entr{total === 1 ? 'y' : 'ies'}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg2)] text-[var(--t1)] text-sm disabled:opacity-40 hover:bg-[var(--bg3)] transition-colors"
            >
              Prev
            </button>
            <span className="text-[var(--t2)] text-sm">Page {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg2)] text-[var(--t1)] text-sm disabled:opacity-40 hover:bg-[var(--bg3)] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
