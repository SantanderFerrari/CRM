import { useEffect, useState, useCallback } from 'react';
import { getDashboardStats } from '../api/dashboard.api';

const useDashboard = (refreshIntervalMs = 60_000) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await getDashboardStats();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetch(true); }, [fetch]);

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(() => fetch(false), refreshIntervalMs);
    return () => clearInterval(id);
  }, [fetch, refreshIntervalMs]);

  return { data, loading, error, refresh: () => fetch(true) };
};

export default useDashboard;