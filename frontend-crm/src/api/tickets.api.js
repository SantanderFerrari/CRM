import api from './axios';

export const getTickets          = (params)       => api.get('/tickets', { params });
export const getTicket           = (id)           => api.get(`/tickets/${id}`);
export const createTicket        = (data)         => api.post('/tickets', data);
export const updateTicketStatus  = (id, status)   => api.patch(`/tickets/${id}/status`, { status });
export const assignTicket        = (id, userId)   => api.patch(`/tickets/${id}/assign`, { assigned_user_id: userId });
export const getAccessories      = (id)           => api.get(`/tickets/${id}/accessories`);
export const addAccessory        = (id, data)     => api.post(`/tickets/${id}/accessories`, data);
export const getConditionReports = (id)           => api.get(`/tickets/${id}/condition-report`);
export const addConditionReport  = (id, data)     => api.post(`/tickets/${id}/condition-report`, data);

export const getCustomers        = (params)       => api.get('/customers', { params });
export const getDevicesByCustomer= (customerId)   => api.get(`/customers/${customerId}/devices`);
export const getTechnicians      = ()             => api.get('/users', { params: { role: 'TECHNICIAN', is_active: true } });