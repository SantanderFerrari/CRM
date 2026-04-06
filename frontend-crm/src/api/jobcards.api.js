import api from './axios';

export const getJobCards         = (params)               => api.get('/job-cards', { params });
export const getJobCard          = (id)                   => api.get(`/job-cards/${id}`);
export const createJobCard       = (data)                 => api.post('/job-cards', data);
export const updateJobCardStatus = (id, data)             => api.patch(`/job-cards/${id}/status`, data);
export const addChecklistItem    = (id, item_name)        => api.post(`/job-cards/${id}/checklist`, { item_name });
export const toggleChecklist     = (id, cid, is_completed)=> api.patch(`/job-cards/${id}/checklist/${cid}`, { is_completed });
export const addTimeLog          = (id, data)             => api.post(`/job-cards/${id}/time-logs`, data);
export const addPartsUsed        = (id, data)             => api.post(`/job-cards/${id}/parts`, data);
export const createRequisition   = (id, data)             => api.post(`/job-cards/${id}/requisitions`, data);
export const approveRequisition  = (id, rid)              => api.patch(`/job-cards/${id}/requisitions/${rid}/approve`);
export const rejectRequisition   = (id, rid)              => api.patch(`/job-cards/${id}/requisitions/${rid}/reject`);
export const addIncident         = (id, data)             => api.post(`/job-cards/${id}/incidents`, data);
export const getInventory        = ()                     => api.get('/job-cards/inventory/list');