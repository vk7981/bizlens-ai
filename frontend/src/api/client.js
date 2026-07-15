import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFiles = (files, email) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (email) {
    formData.append('email', email);
  }
  return client.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const runAgent = (sessionId) => {
  return client.post(`/api/agent/run/${sessionId}`);
};

export const getReport = (sessionId) => {
  return client.get(`/api/agent/report/${sessionId}`);
};

export const getHistory = () => {
  return client.get('/api/history');
};

export const getSessionInfo = (sessionId) => {
  return client.get(`/api/history/session/${sessionId}`);
};

export const configureAlerts = (payload) => {
  return client.post('/api/alerts/configure', payload);
};

export const sendReportEmail = (sessionId, email) => {
  return client.post(`/api/alerts/send-report/${sessionId}${email ? `?email=${encodeURIComponent(email)}` : ''}`);
};

export const sendMessage = (sessionId, message) => {
  return client.post(`/api/chat/${sessionId}`, { message });
};

export const getChatHistory = (sessionId) => {
  return client.get(`/api/chat/${sessionId}/history`);
};

export const loginUser = (email, password) => {
  return client.post('/api/auth/login', { email, password });
};

export const registerUser = (name, email, password) => {
  return client.post('/api/auth/register', { name, email, password });
};

export const forgotPassword = (email) => {
  return client.post('/api/auth/forgot-password', { email });
};

export const verifyOtp = (email, otp) => {
  return client.post('/api/auth/verify-otp', { email, otp });
};

export const resetPassword = (email, otp, newPassword) => {
  return client.post('/api/auth/reset-password', { email, otp, new_password: newPassword });
};

export default client;
