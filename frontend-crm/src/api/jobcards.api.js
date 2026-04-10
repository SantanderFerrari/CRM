import api from './axios';

export const getJobCards         = (params)               => api.get('/jobcards', { params });
export const getJobCard          = (id)                   => api.get(`/jobcards/${id}`);
export const createJobCard       = (data)                 => api.post('/jobcards', data);
export const updateJobCardStatus = (id, data)             => api.patch(`/jobcards/${id}/status`, data);
export const addChecklistItem    = (id, item_name)        => api.post(`/jobcards/${id}/checklist`, { item_name });
export const toggleChecklist     = (id, cid, is_completed)=> api.patch(`/jobcards/${id}/checklist/${cid}`, { is_completed });
export const addTimeLog          = (id, data)             => api.post(`/jobcards/${id}/time-logs`, data);
export const addPartsUsed        = (id, data)             => api.post(`/jobcards/${id}/parts`, data);
export const createRequisition   = (id, data)             => api.post(`/jobcards/${id}/requisitions`, data);
export const approveRequisition  = (id, rid)              => api.patch(`/jobcards/${id}/requisitions/${rid}/approve`);
export const rejectRequisition   = (id, rid)              => api.patch(`/jobcards/${id}/requisitions/${rid}/reject`);
export const addIncident         = (id, data)             => api.post(`/jobcards/${id}/incidents`, data);
export const getInventory        = ()                     => api.get('/jobcards/inventory/list');