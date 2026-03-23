/**
 * Chamadas de API para Social: seguir/deixar de seguir, busca, ranking (porta 3001).
 * Mantém lógica pura — use via useFollow() nos componentes.
 */
import { chatApi } from '@/src/lib/apiClient'
import type { PublicProfile } from '@/src/types/social'

export const socialService = {
  getFollowingIds: () =>
    chatApi.get<string[]>('/api/social/following'),

  follow: (targetId: string) =>
    chatApi.post(`/api/social/follow/${targetId}`),

  unfollow: (targetId: string) =>
    chatApi.delete(`/api/social/follow/${targetId}`),

  searchUsers: (query: string) =>
    chatApi.get<PublicProfile[]>(`/api/social/users?q=${encodeURIComponent(query)}`),

  getLeaderboard: () =>
    chatApi.get<PublicProfile[]>('/api/social/leaderboard'),
}
