import axios from 'axios'
import { authState } from '../store/auth.js'
import { createApiLogger } from '@shared/logger.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const DOC_BACKEND_URL = import.meta.env.VITE_DOC_BACKEND_URL || 'http://localhost:8002'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const agentApi = axios.create({
  baseURL: DOC_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

createApiLogger('DocAgent', api)
createApiLogger('DocAgent', agentApi)

function authInterceptor(config) {
  if (authState.token) {
    config.headers.Authorization = `Bearer ${authState.token}`
  }
  return config
}

function authErrorHandler(err) {
  if (err.response?.status === 401) {
    authState.logout()
    window.location.href = '/login'
  }
  return Promise.reject(err)
}

api.interceptors.request.use(authInterceptor)
api.interceptors.response.use((res) => res, authErrorHandler)

agentApi.interceptors.request.use(authInterceptor)
agentApi.interceptors.response.use((res) => res, authErrorHandler)

export function billingAPI() {
  const base = `${BASE_URL}/api/billing`
  return {
    getSubscription() {
      return api.get(`${base}/subscription`)
    },
    getUsage() {
      return api.get(`${base}/usage`)
    },
    getPlans() {
      return api.get(`${BASE_URL}/api/plans`)
    },
    createPortalSession() {
      return api.post(`${base}/portal`)
    },
  }
}

export function socialAuth() {
  const base = `${BASE_URL}/api/auth`
  return {
    googleRedirect() {
      return `${base}/google/redirect`
    },
    githubRedirect() {
      return `${base}/github/redirect`
    },
    exchangeCode(provider, code) {
      return api.post(`${base}/${provider}/callback`, { code, provider })
    },
    mockLogin(provider) {
      const mockUsers = {
        google: {
          name: 'Alex Johnson',
          email: 'alex.johnson@gmail.com',
          picture: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=6b8ba8&color=fff',
        },
        github: {
          name: 'Alex Johnson',
          email: 'alex@github.com',
          username: 'alexj',
          picture: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=24292e&color=fff',
        },
      }
      const user = mockUsers[provider]
      if (!user) return null
      return {
        token: `mock-social-token-${provider}-${Date.now()}`,
        user: { ...user, id: `social-${provider}-${Date.now()}` },
        subscription: { plan: 'free' },
        usage: { generated: 0, exported: 0, periodStart: new Date().toISOString() },
      }
    },
  }
}

export { agentApi }
export default api
