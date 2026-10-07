import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerCompany,
  registerStudent,
} from './services/api'
import type { AuthState, AuthUser, UserRole } from './types/auth'

vi.mock('./services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/api')>()),
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  refreshSession: vi.fn(),
  registerCompany: vi.fn(),
  registerStudent: vi.fn(),
  setAuthToken: vi.fn(),
}))

const makeAuthState = (role: UserRole, email: string): AuthState => ({
  user: { id: 'user-1', email, role, is_active: true },
  access_token: 'access-token',
})

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  vi.clearAllMocks()
  vi.mocked(refreshSession).mockRejectedValue(new Error('No refresh cookie'))
  vi.mocked(logoutUser).mockResolvedValue({ data: { message: 'Logged out' } } as never)
})

afterEach(() => cleanup())

describe('frontend authentication flows', () => {
  it('registers a student, opens the student area, and logs out', async () => {
    const user = userEvent.setup()
    const email = 'student@example.com'
    window.history.replaceState({}, '', '/register/student')
    vi.mocked(registerStudent).mockResolvedValue({
      data: makeAuthState('student', email),
    } as never)

    render(<App />)
    await user.type(await screen.findByLabelText('Full name'), 'Student User')
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!')
    await user.click(screen.getByRole('button', { name: 'Create student account' }))

    expect(await screen.findByRole('heading', { name: `Welcome back, ${email}` })).toBeTruthy()
    expect(window.location.pathname).toBe('/student')
    expect(registerStudent).toHaveBeenCalledWith({
      email,
      password: 'StrongPass123!',
      full_name: 'Student User',
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(await screen.findByRole('heading', { name: 'Log in to CareerBridge' })).toBeTruthy()
    expect(logoutUser).toHaveBeenCalledOnce()
  })

  it('registers a company and routes to the company area', async () => {
    const user = userEvent.setup()
    const email = 'company@example.com'
    window.history.replaceState({}, '', '/login')
    vi.mocked(registerCompany).mockResolvedValue({
      data: makeAuthState('company', email),
    } as never)

    render(<App />)
    await user.click(await screen.findByRole('link', { name: 'Register as company' }))
    await user.type(screen.getByLabelText('Company name'), 'Bridge Coders')
    await user.type(screen.getByLabelText('Contact name'), 'Company Contact')
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!')
    await user.click(screen.getByRole('button', { name: 'Create company account' }))

    expect(await screen.findByRole('heading', { name: `Welcome back, ${email}` })).toBeTruthy()
    expect(window.location.pathname).toBe('/company')
  })

  it('logs in and routes using the returned user role', async () => {
    const user = userEvent.setup()
    const email = 'login-student@example.com'
    vi.mocked(loginUser).mockResolvedValue({
      data: makeAuthState('student', email),
    } as never)

    render(<App />)
    await user.click(await screen.findByRole('link', { name: 'Log in' }))
    await user.type(screen.getByLabelText('Email'), email)
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('heading', { name: `Welcome back, ${email}` })).toBeTruthy()
    expect(window.location.pathname).toBe('/student')
  })

  it('redirects unauthenticated users and rejects role-incompatible routes', async () => {
    window.history.replaceState({}, '', '/student')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Log in to CareerBridge' })).toBeTruthy()

    cleanup()
    window.history.replaceState({}, '', '/admin')
    vi.mocked(refreshSession).mockResolvedValue({ access_token: 'company-access' })
    const company: AuthUser = { id: 'company-1', email: 'company@example.com', role: 'company', is_active: true }
    vi.mocked(getCurrentUser).mockResolvedValue({ data: company } as never)
    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'))
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getByText('company')).toBeTruthy()
  })
})
