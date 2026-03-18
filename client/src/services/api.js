import axios from 'axios'

const api = axios.create({
  baseURL: 'https://science-tech-club-iju0.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ✅ Don't intercept login/register failures
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        console.log('🔒 Unauthorized - Token expired or invalid')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    return Promise.reject(error)
  }
)

export default api
