import { useCallback, useEffect, useState } from 'react';
import { getTickets } from '../api/tickets.api';

const useTickets = () => {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filters,  setFilters]  = useState({
    status: '', assigned_user_id: '', customer_id: '',
    limit: 20, offset: 0,
  });
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      // Strip empty strings before sending
      const params = Object.fromEntries(
        Object.entries(f).filter(([, v]) => v !== '' && v !== null)
      );
      const { data } = await getTickets(params);
      setTickets(data.tickets);
      setTotal(data.tickets.length); // extend if backend returns total count
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, []);  // eslint-disable-line

  const applyFilters = (newFilters) => {
    const merged = { ...filters, ...newFilters, offset: 0 };
    setFilters(merged);
    fetch(merged);
  };

  const refresh = () => fetch(filters);

  return { tickets, loading, error, filters, applyFilters, refresh };
};

export default useTickets;