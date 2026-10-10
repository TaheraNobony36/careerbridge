import axios, { type InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  withCredentials: true,
})

type RetriableRequestConfig = InternalAxiosRequestConfig & { authRetry?: boolean }
let refreshPromise: Promise<string> | null = null

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

function renewAccessToken(): Promise<string> {
  refreshPromise ??= api.post('/auth/refresh')
    .then(({ data }) => {
      setAuthToken(data.access_token)
      window.dispatchEvent(new CustomEvent('careerbridge:token-refreshed', {
        detail: data.access_token,
      }))
      return data.access_token as string
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const request = error.config as RetriableRequestConfig | undefined
    if (error.response?.status !== 401 || !request || request.url?.startsWith('/auth/')) {
      return Promise.reject(error)
    }

    if (request.authRetry) {
      setAuthToken(null)
      window.dispatchEvent(new Event('careerbridge:unauthorized'))
      return Promise.reject(error)
    }

    request.authRetry = true
    try {
      const token = await renewAccessToken()
      request.headers.Authorization = `Bearer ${token}`
      return await api.request(request)
    } catch (refreshError) {
      setAuthToken(null)
      window.dispatchEvent(new Event('careerbridge:unauthorized'))
      return Promise.reject(refreshError)
    }
  },
)

export const loginUser = (payload: { email: string; password: string }) =>
  api.post('/auth/login', payload)

export const registerStudent = (payload: {
  email: string
  password: string
  full_name?: string
}) => api.post('/auth/register', { ...payload, role: 'student' })

export const registerCompany = (payload: {
  email: string
  password: string
  full_name?: string
  company_name?: string
}) => api.post('/auth/register', { ...payload, role: 'company' })

export const getCurrentUser = () => api.get('/auth/me')
export const refreshSession = async () => ({ access_token: await renewAccessToken() })
export const logoutUser = () => api.post('/auth/logout')

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return 'Unable to connect. Check your connection and try again.'

  switch (error.response.status) {
    case 400:
      return 'The request could not be completed.'
    case 401:
      return 'Invalid email or password.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 409:
      return 'An account with this email already exists.'
    case 422:
      return 'Check the form fields and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export const getStudentProfile = () => api.get('/profile/me')

export const saveStudentProfile = (payload: {
  full_name?: string | null
  headline?: string | null
  bio?: string | null
  university?: string | null
  degree_program?: string | null
  graduation_year?: number | null
  skills?: string[]
  location?: string | null
  portfolio_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
}) => api.put('/profile/me', payload)

export const getJobs = () => api.get('/jobs')

export const getJobRecommendations = () => api.get('/jobs/recommendations')

export const getMyJobs = () => api.get('/jobs/my')

export const createJob = (payload: {
  title: string
  description: string
  company_name: string
  location?: string
  job_type?: string
  salary?: string
  skills?: string[]
}) => api.post('/jobs', payload)

export const applyToJob = (jobId: string, payload: { cover_letter?: string }) =>
  api.post(`/jobs/${jobId}/apply`, payload)

export default api
