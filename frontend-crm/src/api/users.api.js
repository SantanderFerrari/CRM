import api from './axios';

export const getUsers       = (params)    => api.get('/users', { params });
export const getUser        = (id)        => api.get(`/users/${id}`);
export const updateUser     = (id, data)  => api.patch(`/users/${id}`, data);
export const activateUser   = (id)        => api.patch(`/users/${id}/activate`);
export const deactivateUser = (id)        => api.patch(`/users/${id}/deactivate`);
export const changePassword = (data)      => api.post('/users/change-password', data);
export const registerUser   = (data)      => api.post('/auth/register', data);