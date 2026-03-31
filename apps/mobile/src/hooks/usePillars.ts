import { useState, useEffect, useCallback } from 'react'
import { api } from '@/src/lib/apiClient'
import type { Pillar, PillarDetail, CategoryDetail } from '@/src/types/library'

// ── Lista de pilares ──────────────────────────────────────────────────────────

export function usePillars() {
  const [pillars, setPillars]     = useState<Pillar[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.get<Pillar[]>('/library/pillars')
      setPillars(data ?? [])
    } catch (e) {
      console.error('[usePillars]', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { pillars, isLoading, refetch: fetch }
}

// ── Detalhe de um pilar ───────────────────────────────────────────────────────

export function usePillarDetail(pillarId: string | number) {
  const [detail, setDetail]       = useState<PillarDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!pillarId) return
    setIsLoading(true)
    api.get<PillarDetail>(`/library/pillars/${pillarId}`)
      .then(setDetail)
      .catch((e) => console.error('[usePillarDetail]', e))
      .finally(() => setIsLoading(false))
  }, [pillarId])

  return { detail, isLoading }
}

// ── Detalhe de uma categoria ──────────────────────────────────────────────────

export function useCategoryDetail(categoryId: string | number) {
  const [data, setData]           = useState<CategoryDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!categoryId) return
    setIsLoading(true)
    api.get<CategoryDetail>(`/library/categories/${categoryId}`)
      .then(setData)
      .catch((e) => console.error('[useCategoryDetail]', e))
      .finally(() => setIsLoading(false))
  }, [categoryId])

  return { data, isLoading }
}
