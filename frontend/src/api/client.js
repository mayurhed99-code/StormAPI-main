import axios from 'axios'
import { store } from '../store/store.js'
import { logout } from '../store/authSlice.js'

const api = axios.create({
  baseURL: '/',
  timeout: 30_000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 → logout and redirect to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      store.dispatch(logout())
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email, password) =>
    api.post('/api/auth/register', { email, password }),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  me: () =>
    api.get('/api/auth/me'),
}

// ── Targets ───────────────────────────────────────────────────────────────
export const targetsApi = {
  list: () =>
    api.get('/api/test/targets'),
  get: (id) =>
    api.get(`/api/test/targets/${id}`),
  create: (payload) =>
    api.post('/api/test/targets', payload),
    // { name, baseUrl, method, headersJson?, bodyTemplate? }
  delete: (id) =>
    api.delete(`/api/test/targets/${id}`),
}

// ── Configs ───────────────────────────────────────────────────────────────
export const configsApi = {
  list: () =>
    api.get('/api/test/configs'),
  get: (id) =>
    api.get(`/api/test/configs/${id}`),
  create: (targetId, payload) =>
    api.post(`/api/test/configs/targets/${targetId}`, payload),
    // { concurrency, totalRequests, timeoutMs }
}

// ── Runs ──────────────────────────────────────────────────────────────────
export const runsApi = {
  list: () =>
    api.get('/api/test/runs'),
  get: (id) =>
    api.get(`/api/test/runs/${id}`),
  start: (configId) =>
    api.post(`/api/test/runs/${configId}/start`),
    // Returns { runId, status }
}

// ── Reports ───────────────────────────────────────────────────────────────
export const reportsApi = {
  list: () =>
    api.get('/api/metrics/reports'),
  get: (id) =>
    api.get(`/api/metrics/reports/${id}`),
}

export default api
