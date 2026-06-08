import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { ChainStatusBanner } from '../components/ChainStatusBanner';
import { StatusBadge } from '../components/StatusBadge';
import { HashDisplay } from '../components/HashDisplay';

interface Transaction {
  id: string;
  eventType: string;
  timestamp: string;
  fromOrgName?: string;
  toOrgName?: string;
  quantity: number;
  signatureHash: string;
  previousHash: string;
}

export const TransactionHistory = () => {
  const { id } = useParams<{ id: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [batchRes, txRes] = await Promise.all([
          api.get(`/batches/${id}`),
          api.get(`/batches/${id}/history`),
        ]);
        setBatch(batchRes.data);
        const txData = txRes.data;
        const txList = (txData.content ?? txData).map((tx: any) => ({
          id: tx.id,
          eventType: tx.eventType,
          timestamp: tx.timestamp,
          fromOrgName: tx.fromOrgName,
          toOrgName: tx.toOrgName,
          quantity: tx.quantity ?? 0,
          signatureHash: tx.signatureHash,
          previousHash: tx.previousHash,
        }));
        setTransactions(txList);
        setChainValid(txRes.data.chainValid ?? null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Batch not found');
        } else {
          setError('Failed to load transaction history');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <PageShell title="Transaction History">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--t2)]">Loading history...</span>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !batch) {
    return (
      <PageShell title="Transaction History">
        <div className="text-center py-12">
          <i className="ti ti-alert-circle text-[var(--red)] text-4xl mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Not Found</h2>
          <p className="text-[var(--t2)] mb-6">{error || 'The requested batch does not exist.'}</p>
          <button onClick={() => window.history.back()} className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200">Go Back</button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Transaction History">
      <div className="space-y-6">
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Batch #{batch.batchNumber || batch.id}</h2>
          <p className="text-[var(--t2)] text-sm">Product: {batch.productName || 'Unknown'}</p>
          <div className="mt-4 flex items-center space-x-4">
            <StatusBadge status={(batch.status || 'UNKNOWN') as any} />
            <span className="text-[var(--t3)] text-xs">Chain status check</span>
          </div>
        </div>

        {chainValid !== null && (
          <ChainStatusBanner chainValid={chainValid} className="mb-6" />
        )}

        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h3 className="text-xl font-bold text-[var(--t1)] mb-6">Provenance Chain</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <i className="ti ti-history text-[var(--t3)] text-4xl mb-4" aria-hidden="true" />
              <p className="text-[var(--t2)]">No transactions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {transactions.map((tx, index) => (
                <div key={tx.id} className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--bg2)]/50">
                      <i className="ti ti-truck text-[var(--cyan)]" aria-hidden="true" />
                    </div>
                    <div className="flex-1 bg-[var(--bg2)]/30 rounded-xl border border-[var(--border)]/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[var(--t1)] font-semibold">{tx.eventType.replace('_', ' ')}</p>
                        <span className="text-[var(--t3)] text-xs font-mono">{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[var(--t3)] text-xs mb-1">From</p>
                          <p className="text-[var(--t1)]">{tx.fromOrgName || 'Genesis'}</p>
                        </div>
                        <div>
                          <p className="text-[var(--t3)] text-xs mb-1">To</p>
                          <p className="text-[var(--t1)]">{tx.toOrgName || 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-[var(--t3)] text-xs mb-1">Quantity</p>
                          <p className="text-[var(--t1)] font-mono">{tx.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[var(--t3)] text-xs mb-1">Tx ID</p>
                          <HashDisplay hash={tx.id} />
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[var(--border)]/20">
                        <p className="text-[var(--t3)] text-xs mb-2">Chain Links</p>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-[var(--t3)]">Previous Hash</span>
                            <HashDisplay hash={tx.previousHash} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--t3)]">Signature Hash</span>
                            <HashDisplay hash={tx.signatureHash} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < transactions.length - 1 && (
                    <div className="absolute left-5 top-16 h-8 w-px bg-[var(--border)]/40" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};
