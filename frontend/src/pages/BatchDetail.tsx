import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { ProvenanceTimeline } from '../components/ProvenanceTimeline';
import { ChainStatusBanner } from '../components/ChainStatusBanner';
import { HashDisplay } from '../components/HashDisplay';

interface Transaction {
  id: string
  eventType: string
  timestamp: string
  fromOrgName?: string
  toOrgName?: string
  quantity: number
  signatureHash: string
  previousHash: string
}

interface Batch {
  id: string
  productId: string
  productName: string
  status: string
  batchNumber: string
  createdAt: string
  updatedAt: string
  chainValid?: boolean
}

export const BatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
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
        setTransactions(txData.content || txRes.data || []);
        setChainValid(txRes.data.chainValid ?? null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Batch not found');
        } else {
          setError('Failed to load batch details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <PageShell title="Batch Detail">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--t2)]">Loading batch details...</span>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !batch) {
    return (
      <PageShell title="Batch Detail">
        <div className="text-center py-12">
          <i className="ti ti-alert-circle text-[var(--red)] text-4xl mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Batch Not Found</h2>
          <p className="text-[var(--t2)] mb-6">{error || 'The batch you are looking for does not exist.'}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-lg bg-[var(--blue)] text-[var(--t1)] font-medium hover:bg-[var(--blue)]/90 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`Batch ${batch.batchNumber}`}>
      <div className="space-y-6">
        {/* Chain Status Banner */}
        {chainValid !== null && (
          <ChainStatusBanner 
            chainValid={chainValid} 
            className="mb-6"
          />
        )}

        {/* Batch Info Card */}
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--t1)] mb-2">Batch #{batch.batchNumber}</h2>
              <p className="text-[var(--t2)] text-sm">Product: {batch.productName}</p>
            </div>
            <StatusBadge status={batch.status as any} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[var(--t2)] text-sm mb-1">Batch ID</p>
              <HashDisplay hash={batch.id} label="Batch ID" />
            </div>
            
            <div>
              <p className="text-[var(--t2)] text-sm mb-2">Created</p>
              <p className="text-[var(--t1)] font-mono text-sm">
                {new Date(batch.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-[var(--t2)] text-sm mb-2">Status</p>
              <StatusBadge status={batch.status as any} />
            </div>
            
            <div>
              <p className="text-[var(--t2)] text-sm mb-2">Last Updated</p>
              <p className="text-[var(--t1)] font-mono text-sm">
                {new Date(batch.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Timeline */}
        <div className="bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6">
          <h3 className="text-xl font-bold text-[var(--t1)] mb-6">Transaction History</h3>
          {transactions.length > 0 ? (
            <ProvenanceTimeline 
              transactions={transactions} 
              chainValid={chainValid ?? true}
            />
          ) : (
            <div className="text-center py-8">
              <i className="ti ti-history text-[var(--t3)] text-4xl mb-4" aria-hidden="true" />
              <p className="text-[var(--t2)]">No transactions recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};