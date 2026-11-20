import axios from 'axios';
import * as mock from '../data/mock.js';

// Use mock data only when explicitly enabled.
// Vercel environment variable: VITE_USE_MOCK=false
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Railway backend URL from environment variables.
// Local development falls back to Vite's /api proxy.
// Railway backend URL from environment variables.
// Local development falls back to Vite's /api proxy.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_URL =
  rawApiUrl && !/^https?:\/\//i.test(rawApiUrl)
    ? `https://${rawApiUrl}`
    : rawApiUrl;

const http = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attach authentication token to every request
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('cw_token') ||
    sessionStorage.getItem('cw_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle API errors
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      ['cw_token', 'cw_user'].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    }

    if (err.response?.data?.errors) {
      err.errors = err.response.data.errors;
    }

    return Promise.reject(err);
  }
);

const data = (res) => res.data;

// One place decides whether a call goes to mock data or Express
const call = (mockCall, method, url, body) =>
  USE_MOCK
    ? mockCall()
    : http({ method, url, data: body }).then(data);

export const api = {
  login: (b) => call(() => mock.login(b), 'post', '/auth/login', b),

  dashboard: () => call(() => mock.dashboard(), 'get', '/dashboard'),

  cases: () => call(() => mock.cases(), 'get', '/cases'),

  search: (q) =>
    call(
      () => mock.search(q),
      'get',
      `/search?q=${encodeURIComponent(q)}`
    ),

  notifications: () =>
    call(() => mock.notifications(), 'get', '/notifications'),

  caseDetail: (id) =>
    call(() => mock.caseDetail(id), 'get', `/cases/${id}`),

  createCase: (b) =>
    call(() => mock.createCase(b), 'post', '/cases', b),

  resolveFlag: (caseId, flagId) =>
    call(
      () => mock.resolveFlag(caseId, flagId),
      'post',
      `/cases/${caseId}/flags/${flagId}/resolve`
    ),

  toggleChecklist: (caseId, label) =>
    call(
      () => mock.toggleChecklist(caseId, label),
      'post',
      `/cases/${caseId}/checklist/toggle`,
      { label }
    ),

  uploadDocuments: (caseId, files) =>
    call(
      () => mock.uploadDocuments(caseId, files),
      'post',
      `/cases/${caseId}/documents`,
      { files }
    ),

  askEvidence: (caseId, question) =>
    call(
      () => mock.askEvidence(caseId, question),
      'post',
      `/cases/${caseId}/ask`,
      { question }
    ),

  reviews: () => call(() => mock.reviews(), 'get', '/reviews'),

  reviewDetail: (id) =>
    call(() => mock.reviewDetail(id), 'get', `/reviews/${id}`),

  decideReview: (id, decision, note) =>
    call(
      () => mock.decideReview(id, decision, note),
      'post',
      `/reviews/${id}/decision`,
      { decision, note }
    ),

  reports: () => call(() => mock.reports(), 'get', '/reports'),
};