import { useCallback, useEffect, useState } from 'react';
import { getCustomers } from '../api/customers.api';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');

  const fetch = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (q.trim()) params.search = q.trim();
      const { data } = await getCustomers(params);
      setCustomers(data.customers);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(''); }, []); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetch(search), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  return { customers, loading, error, search, setSearch, refresh: () => fetch(search) };
};

export default useCustomers;