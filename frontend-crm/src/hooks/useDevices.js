import { useCallback, useEffect, useState } from 'react';
import { getDevices } from '../api/customers.api';

const useDevices = () => {
  const [devices,    setDevices]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetch = useCallback(async ({ q = search, type = typeFilter } = {}) => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (type) params.device_type = type;
      const { data } = await getDevices(params);

      // client-side search filter across brand, model, serial, customer name
      const filtered = q.trim()
        ? data.devices.filter((d) => {
            const hay = `${d.brand} ${d.model} ${d.serial_number} ${d.customer_name}`.toLowerCase();
            return hay.includes(q.trim().toLowerCase());
          })
        : data.devices;

      setDevices(filtered);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  // Initial load
  useEffect(() => { fetch({ q: '', type: '' }); }, []); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetch(), 350);
    return () => clearTimeout(t);
  }, [search, typeFilter]); // eslint-disable-line

  return {
    devices, loading, error,
    search, setSearch,
    typeFilter, setTypeFilter,
    refresh: () => fetch(),
  };
};

export default useDevices;