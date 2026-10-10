import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './context/AuthContext'
import { ProfilePage } from './pages/ProfilePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import {
  getCurrentUser,
  getStudentProfile,
  refreshSession,
  saveStudentProfile,
} from './services/api'

vi.mock('./services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/api')>()),
  getCurrentUser: vi.fn(),
  getStudentProfile: vi.fn(),
  refreshSession: vi.fn(),
  saveStudentProfile: vi.fn(),
  setAuthToken: vi.fn(),
}))

const existingProfile = {
  id: 'profile-1',
  user_id: 'student-1',
  full_name: 'Ada Lovelace',
  headline: 'Aspiring software engineer',
  bio: 'I build useful software.',
  university: 'University of London',
  degree_program: 'Mathematics',
  graduation_year: 2027,
  skills: ['Python', 'SQL'],
  location: 'London, UK',
  portfolio_url: 'https://example.com',
  linkedin_url: null,
  github_url: null,
}

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(refreshSession).mockResolvedValue({ access_token: 'access-token' } as never)
  vi.mocked(getCurrentUser).mockResolvedValue({
    data: { id: 'student-1', email: 'ada@example.com', role: 'student', is_active: true },
  } as never)
  vi.mocked(getStudentProfile).mockRejectedValue({ response: { status: 404 } })
})

afterEach(() => cleanup())

describe('student profile page', () => {
  it('loads existing profile data into the form', async () => {
    vi.mocked(getStudentProfile).mockResolvedValue({ data: existingProfile } as never)

    renderProfile()

    expect(((await screen.findByLabelText('Full name')) as HTMLInputElement).value).toBe('Ada Lovelace')
    expect((screen.getByLabelText('University') as HTMLInputElement).value).toBe('University of London')
    expect((screen.getByLabelText('Degree or program') as HTMLInputElement).value).toBe('Mathematics')
    expect((screen.getByLabelText('Skills') as HTMLInputElement).value).toBe('Python, SQL')
    expect(
      screen.getByRole('progressbar', { name: 'Profile completeness' }).getAttribute('aria-valuenow'),
    ).toBe('82')
  })

  it('shows the empty state and creates a profile successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(saveStudentProfile).mockResolvedValue({
      data: { ...existingProfile, full_name: 'Ada Lovelace' },
    } as never)

    renderProfile()

    expect(await screen.findByText('Your profile is ready to be started.')).toBeTruthy()
    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect((await screen.findByRole('status')).textContent).toContain('Profile saved successfully.')
    await waitFor(() => expect(saveStudentProfile).toHaveBeenCalled())
    expect(vi.mocked(saveStudentProfile).mock.calls[0][0]).toMatchObject({
      full_name: 'Ada Lovelace',
      skills: [],
    })
  })

  it('updates displayed data and clears fields when they are emptied', async () => {
    const user = userEvent.setup()
    vi.mocked(getStudentProfile).mockResolvedValue({ data: existingProfile } as never)
    vi.mocked(saveStudentProfile).mockResolvedValue({
      data: { ...existingProfile, headline: 'Software engineer', university: null },
    } as never)

    renderProfile()

    const headline = (await screen.findByLabelText('Headline')) as HTMLInputElement
    const university = screen.getByLabelText('University') as HTMLInputElement
    await user.clear(headline)
    await user.type(headline, 'Software engineer')
    await user.clear(university)
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect((await screen.findByRole('status')).textContent).toContain('Profile saved successfully.')
    expect(vi.mocked(saveStudentProfile).mock.calls[0][0]).toMatchObject({
      headline: 'Software engineer',
      university: null,
    })
    expect(university.value).toBe('')
  })

  it('shows API validation feedback when save is rejected', async () => {
    const user = userEvent.setup()
    vi.mocked(saveStudentProfile).mockRejectedValue(
      Object.assign(new Error('Invalid profile'), {
        isAxiosError: true,
        response: { status: 422 },
      }),
    )

    renderProfile()
    await screen.findByText('Your profile is ready to be started.')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Check the form fields and try again.',
    )
  })
})
