import { useCallback, useEffect, useState } from 'react';
import { getCustomer, getCustomerDevices } from '../api/customers.api';
import { getTickets } from '../api/tickets.api';

const useCustomer = (id) => {
  const [customer, setCustomer] = useState(null);
  const [devices,  setDevices]  = useState([]);
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [custRes, devRes, tickRes] = await Promise.all([
        getCustomer(id),
        getCustomerDevices(id),
        getTickets({ customer_id: id, limit: 10 }),
      ]);
      setCustomer(custRes.data.customer);
      setDevices(devRes.data.devices);
      setTickets(tickRes.data.tickets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { customer, devices, tickets, loading, error, refresh: fetch };
};

export default useCustomer;