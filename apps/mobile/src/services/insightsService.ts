/**
 * Chamadas de API para o feed de Insights (porta 3001).
 * Mantém lógica pura (sem estado React) — use via useInsights() nos componentes.
 */
import { chatApi } from '@/src/lib/apiClient'
import type { Insight } from '@/src/types/social'

export const insightsService = {
  fetchExplorar: () =>
    chatApi.get<Insight[]>('/api/insights?tab=explorar'),

  fetchSeguindo: () =>
    chatApi.get<Insight[]>('/api/insights?tab=seguindo'),

  toggleLike: (insightId: string) =>
    chatApi.post(`/api/insights/${insightId}/like`),

  publish: (payload: {
    content: string
    author?: string
    book_title?: string
    material_link?: string
  }) => chatApi.post('/api/insights', payload),

  delete: (insightId: string) =>
    chatApi.delete(`/api/insights/${insightId}`),
}
