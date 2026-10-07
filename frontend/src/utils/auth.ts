import type { UserRole } from '../types/auth'

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/student'
    case 'company':
      return '/company'
    case 'admin':
    case 'super_admin':
      return '/admin'
  }
}
