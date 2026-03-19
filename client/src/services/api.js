import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response interceptor
api.interceptors.response.use(
  (response) => response.data,  // unwrap .data automatically
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Safe wrappers — guaranteed return types
const safeGet = async (url, params) => {
  const data = await api.get(url, { params })
  return Array.isArray(data) ? data : (data ?? [])
}

const safeGetOne = async (url) => {
  const data = await api.get(url)
  return data && typeof data === 'object' ? data : {}
}

export default {
  get: (url, params) => api.get(url, { params }),
  post: (url, body, config) => api.post(url, body, config),
  put: (url, body) => api.put(url, body),
  delete: (url) => api.delete(url),
  // Safe versions that never crash .map()
  getArray: safeGet,        // always returns []
  getOne: safeGetOne,       // always returns {}
}
