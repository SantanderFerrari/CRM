import { useCallback, useEffect, useState } from 'react';
import { getJobCard } from '../api/jobcards.api';

const useJobCard = (id) => {
  const [jobCard,  setJobCard]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await getJobCard(id);
      setJobCard(data.job_card);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job card.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { jobCard, loading, error, refresh: fetch };
};

export default useJobCard;