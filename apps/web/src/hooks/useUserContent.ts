import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export interface UserContent {
  card_id: string
  title: string
  category: string
  is_favourite: boolean
  is_read: boolean
}

export interface SaveItem {
  card_id: string
  title: string
  category: string
}

export function useUserContent() {
  const { user } = useAuth()
  const [items, setItems] = useState<UserContent[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchLibrary = useCallback(async () => {
    if (!user) return
    setIsSyncing(true)
    try {
      const data = await api.get<UserContent[]>('/api/user-content')
      setItems(data)
    } catch (err) {
      console.error('[useUserContent] fetchLibrary:', err)
    }
    setIsSyncing(false)
  }, [user?.id])

  useEffect(() => {
    if (user) fetchLibrary()
  }, [user, fetchLibrary])

  const toggleSave = async (item: SaveItem) => {
    if (!user) return
    const existing = items.find((i) => i.card_id === item.card_id)
    const newFavourite = existing ? !existing.is_favourite : true

    setItems((prev) =>
      existing
        ? prev.map((i) => i.card_id === item.card_id ? { ...i, is_favourite: newFavourite } : i)
        : [{ ...item, is_favourite: true, is_read: false }, ...prev]
    )

    setIsSyncing(true)
    try {
      const updated = await api.put<UserContent>('/api/user-content', {
        ...item,
        is_favourite: newFavourite,
        is_read: existing?.is_read ?? false,
      })
      setItems((prev) => prev.map((i) => i.card_id === updated.card_id ? updated : i))
    } catch (err) {
      console.error('[useUserContent] toggleSave:', err)
    }
    setIsSyncing(false)
  }

  const toggleRead = async (item: SaveItem) => {
    if (!user) return
    const existing = items.find((i) => i.card_id === item.card_id)
    const newRead = existing ? !existing.is_read : true

    setItems((prev) =>
      existing
        ? prev.map((i) => i.card_id === item.card_id ? { ...i, is_read: newRead } : i)
        : [{ ...item, is_favourite: false, is_read: true }, ...prev]
    )

    setIsSyncing(true)
    try {
      const updated = await api.put<UserContent>('/api/user-content', {
        ...item,
        is_favourite: existing?.is_favourite ?? false,
        is_read: newRead,
      })
      setItems((prev) => prev.map((i) => i.card_id === updated.card_id ? updated : i))
    } catch (err) {
      console.error('[useUserContent] toggleRead:', err)
    }
    setIsSyncing(false)
  }

  const isFavourite = (cardId: string) => items.find((i) => i.card_id === cardId)?.is_favourite ?? false
  const isRead      = (cardId: string) => items.find((i) => i.card_id === cardId)?.is_read      ?? false
  const isSaved     = (cardId: string) => items.some((i) => i.card_id === cardId)

  return { items, isSyncing, fetchLibrary, toggleSave, toggleRead, isFavourite, isRead, isSaved }
}
