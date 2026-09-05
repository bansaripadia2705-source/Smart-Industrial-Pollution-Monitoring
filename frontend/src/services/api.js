import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('eco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:    (data) => API.post('/auth/login', data),
  me:       ()     => API.get('/auth/me'),
};

export const dashboardAPI = {
  stats:          () => API.get('/dashboard/stats'),
  recentIncidents:() => API.get('/dashboard/recent-incidents'),
  chartData:      () => API.get('/dashboard/chart-data'),
};

export const industriesAPI = {
  getAll:  (params) => API.get('/industries', { params }),
  getById: (id)     => API.get(`/industries/${id}`),
  create:  (data)   => API.post('/industries', data),
  update:  (id, data)=> API.put(`/industries/${id}`, data),
  delete:  (id)     => API.delete(`/industries/${id}`),
};

export const sensorsAPI = {
  getAll:       (params) => API.get('/sensors', { params }),
  getById:      (id)     => API.get(`/sensors/${id}`),
  create:       (data)   => API.post('/sensors', data),
  updateStatus: (id, status) => API.put(`/sensors/${id}/status`, { status }),
};

export const readingsAPI = {
  getAll: (params) => API.get('/readings', { params }),
  ingest: (data)   => API.post('/readings', data),
  live:   (type)   => API.get('/readings/live', { params: { type } }),
};

export const violationsAPI = {
  getAll:      (params) => API.get('/violations', { params }),
  getById:     (id)     => API.get(`/violations/${id}`),
  updateStatus:(id, status, notes) => API.patch(`/violations/${id}/status`, { status, notes }),
  summary:     ()       => API.get('/violations/stats/summary'),
};

export const alertsAPI = {
  getAll:      (params) => API.get('/alerts', { params }),
  create:      (data)   => API.post('/alerts', data),
  acknowledge: (id)     => API.patch(`/alerts/${id}/acknowledge`),
  resolve:     (id)     => API.patch(`/alerts/${id}/resolve`),
  delete:      (id)     => API.delete(`/alerts/${id}`),
};

export const riskAPI = {
  getAll:  ()            => API.get('/risk'),
  getById: (industryId)  => API.get(`/risk/${industryId}`),
  assess:  (industryId)  => API.post('/risk/assess', { industryId }),
};

export const agentsAPI = {
  getAll:       ()     => API.get('/agents'),
  getActivities:(id)   => API.get(`/agents/${id}/activities`),
  trigger:      (id, data) => API.post(`/agents/${id}/trigger`, data),
};

export const aiAPI = {
  summarize:     (data) => API.post('/ai/summarize', data),
  generateReport:(data) => API.post('/ai/report', data),
  getReports:    ()     => API.get('/ai/reports'),
  query:         (question) => API.post('/ai/query', { question }),
};

export default API;
