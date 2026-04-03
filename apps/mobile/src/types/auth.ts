// Interface canônica do usuário autenticado.
// Mantida em sync com AuthContext.tsx — altere nos dois lugares se mudar o schema.

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
  username?: string
  bio?: string
  /** true quando o usuário completou o onboarding (username definido) */
  hasCompletedProfile: boolean
}

export interface UpdateProfilePayload {
  name?: string
  username?: string
  bio?: string
  avatarUrl?: string
  city?: string
  state?: string
  country?: string
  isPublic?: boolean
  theme?: string
}
