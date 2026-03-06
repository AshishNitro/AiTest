import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Stack APIs ──────────────────────────────────────────
export const stacksApi = {
  list: () => api.get('/stacks/'),
  create: (data) => api.post('/stacks/', data),
  get: (id) => api.get(`/stacks/${id}`),
  update: (id, data) => api.put(`/stacks/${id}`, data),
  delete: (id) => api.delete(`/stacks/${id}`),
};

// ── Document APIs ───────────────────────────────────────
export const documentsApi = {
  list: (stackId) => api.get(`/stacks/${stackId}/documents/`),
  upload: (stackId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/stacks/${stackId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  process: (stackId, documentId, params) =>
    api.post(`/stacks/${stackId}/documents/${documentId}/process`, null, { params }),
  delete: (stackId, documentId) =>
    api.delete(`/stacks/${stackId}/documents/${documentId}`),
};

// ── Chat APIs ───────────────────────────────────────────
export const chatApi = {
  validate: (stackId) => api.post(`/stacks/${stackId}/validate`),
  send: (stackId, data) => api.post(`/stacks/${stackId}/chat`, data),
  history: (stackId) => api.get(`/stacks/${stackId}/chat/history`),
  clearHistory: (stackId) => api.delete(`/stacks/${stackId}/chat/history`),
};

export default api;
