import { useCallback, useEffect, useState } from 'react';
import { getTicket } from '../api/tickets.api';

const useTicket = (id) => {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await getTicket(id);
      setTicket(data.ticket);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ticket, loading, error, refresh: fetch };
};

export default useTicket;