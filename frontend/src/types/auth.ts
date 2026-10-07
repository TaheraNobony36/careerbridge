export type UserRole = 'student' | 'company' | 'admin' | 'super_admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface AuthState {
  user: AuthUser
  access_token: string
}
