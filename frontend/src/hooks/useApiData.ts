import { useState, useEffect, useCallback } from 'react';

interface UseApiDataOptions {
  /** Skip fetching until this is truthy (e.g. a required id is present) */
  enabled?: boolean;
}

/**
 * Small shared data-fetching hook. Wraps the loading / error / data state
 * that every page was hand-rolling so fetches behave consistently.
 *
 * Returns a `refetch` that re-runs the loader -- pass it to a Retry button.
 */
export const useApiData = <T,>(loader: () => Promise<T>, deps: unknown[] = [], options: UseApiDataOptions = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (options.enabled === false) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { data, loading, error, refetch: load };
};
