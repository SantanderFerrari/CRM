import api from './axios';

// ── Leave ──────────────────────────────────────────────────────────────────
export const getLeaveRequests  = (params)      => api.get('/leave', { params });
export const getLeaveRequest   = (id)          => api.get(`/leave/${id}`);
export const createLeaveRequest= (data)        => api.post('/leave', data);
export const reviewLeaveRequest= (id, data)    => api.patch(`/leave/${id}/review`, data);
export const cancelLeaveRequest= (id)          => api.patch(`/leave/${id}/cancel`);
export const getLeaveBalance   = ()            => api.get('/leave/balance');
export const getLeaveEntitlements = ()         => api.get('/leave/entitlements');

// ── Funds ──────────────────────────────────────────────────────────────────
export const getFundsRequisitions   = (params) => api.get('/funds', { params });
export const getFundsRequisition    = (id)     => api.get(`/funds/${id}`);
export const createFundsRequisition = (data)   => api.post('/funds', data);
export const submitFundsRequisition = (id)     => api.patch(`/funds/${id}/submit`);
export const supervisorApprove      = (id)     => api.patch(`/funds/${id}/supervisor-approve`);
export const financeApprove         = (id)     => api.patch(`/funds/${id}/finance-approve`);
export const rejectFundsRequisition = (id, reason) => api.patch(`/funds/${id}/reject`, { rejection_reason: reason });
export const getFundsCategories     = ()       => api.get('/funds/categories');

// ── Profile ────────────────────────────────────────────────────────────────
export const getMyProfile    = ()     => api.get('/auth/me');
export const updateMyProfile = (data) => api.patch(`/users/${data.user_id}`, data);
export const changeMyPassword= (data) => api.post('/users/change-password', data);