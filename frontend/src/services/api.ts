import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('careerbridge_auth')
      setAuthToken(null)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

export const loginUser = (payload: { email: string; password: string }) =>
  api.post('/auth/login', payload)

export const registerStudent = (payload: {
  email: string
  password: string
  full_name?: string
}) => api.post('/auth/register/student', payload)

export const registerCompany = (payload: {
  email: string
  password: string
  full_name?: string
  company_name?: string
}) => api.post('/auth/register/company', payload)

export const getCurrentUser = () => api.get('/auth/me')

export const getStudentProfile = () => api.get('/profile/me')

export const saveStudentProfile = (payload: {
  full_name?: string
  headline?: string
  bio?: string
  university?: string
  graduation_year?: number | null
  skills?: string[]
  location?: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
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
