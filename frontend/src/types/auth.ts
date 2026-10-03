export type UserRole = 'student' | 'company' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface AuthState {
  user: AuthUser
  access_token: string
  refresh_token: string
}
