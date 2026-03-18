import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export interface UserContent {
  card_id: string
  title: string
  category: string
  is_favourite: boolean
  is_read: boolean
  saved_at: string
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
    const { data } = await supabase
      .from('user_content')
      .select('card_id, title, category, is_favourite, is_read, saved_at')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
    if (data) setItems(data as UserContent[])
    setIsSyncing(false)
  }, [user])

  useEffect(() => {
    if (user) fetchLibrary()
  }, [user, fetchLibrary])

  // Toggle is_favourite. Creates the row if it doesn't exist yet (saved_at = now, is_read = false).
  const toggleSave = async (item: SaveItem) => {
    if (!user) return
    const existing = items.find((i) => i.card_id === item.card_id)
    const newFavourite = existing ? !existing.is_favourite : true
    const savedAt = existing?.saved_at ?? new Date().toISOString()

    setItems((prev) =>
      existing
        ? prev.map((i) =>
            i.card_id === item.card_id ? { ...i, is_favourite: newFavourite } : i
          )
        : [
            { ...item, is_favourite: true, is_read: false, saved_at: savedAt },
            ...prev,
          ]
    )

    setIsSyncing(true)
    await supabase.from('user_content').upsert(
      {
        user_id: user.id,
        card_id: item.card_id,
        title: item.title,
        category: item.category,
        is_favourite: newFavourite,
        is_read: existing?.is_read ?? false,
        saved_at: savedAt,
      },
      { onConflict: 'user_id,card_id' }
    )
    setIsSyncing(false)
  }

  // Toggle is_read. Creates the row if it doesn't exist yet (is_favourite = false).
  const toggleRead = async (item: SaveItem) => {
    if (!user) return
    const existing = items.find((i) => i.card_id === item.card_id)
    const newRead = existing ? !existing.is_read : true
    const savedAt = existing?.saved_at ?? new Date().toISOString()

    setItems((prev) =>
      existing
        ? prev.map((i) =>
            i.card_id === item.card_id ? { ...i, is_read: newRead } : i
          )
        : [
            { ...item, is_favourite: false, is_read: true, saved_at: savedAt },
            ...prev,
          ]
    )

    setIsSyncing(true)
    await supabase.from('user_content').upsert(
      {
        user_id: user.id,
        card_id: item.card_id,
        title: item.title,
        category: item.category,
        is_favourite: existing?.is_favourite ?? false,
        is_read: newRead,
        saved_at: savedAt,
      },
      { onConflict: 'user_id,card_id' }
    )
    setIsSyncing(false)
  }

  const isFavourite = (cardId: string) =>
    items.find((i) => i.card_id === cardId)?.is_favourite ?? false

  const isRead = (cardId: string) =>
    items.find((i) => i.card_id === cardId)?.is_read ?? false

  const isSaved = (cardId: string) => items.some((i) => i.card_id === cardId)

  return { items, isSyncing, fetchLibrary, toggleSave, toggleRead, isFavourite, isRead, isSaved }
}
