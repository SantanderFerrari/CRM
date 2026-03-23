import api from './axios';

export const loginRequest = (credentials) =>
  api.post('/auth/login', credentials);

export const registerRequest = (data) =>
  api.post('/auth/register', data);

export const refreshRequest = (refreshToken) =>
  api.post('/auth/refresh', { refreshToken });

export const logoutRequest = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const getMeRequest = () =>
  api.get('/auth/me');