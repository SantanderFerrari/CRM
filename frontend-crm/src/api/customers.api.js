import api from './axios';

// ── Customers ──────────────────────────────────────────────────────────────
export const getCustomers     = (params)      => api.get('/customers', { params });
export const getCustomer      = (id)          => api.get(`/customers/${id}`);
export const createCustomer   = (data)        => api.post('/customers', data);
export const updateCustomer   = (id, data)    => api.patch(`/customers/${id}`, data);
export const deleteCustomer   = (id)          => api.delete(`/customers/${id}`);
export const getCustomerDevices = (id)        => api.get(`/customers/${id}/devices`);

// ── Devices ────────────────────────────────────────────────────────────────
export const getDevices       = (params)      => api.get('/devices', { params });
export const getDevice        = (id)          => api.get(`/devices/${id}`);
export const createDevice     = (data)        => api.post('/devices', data);
export const updateDevice     = (id, data)    => api.patch(`/devices/${id}`, data);