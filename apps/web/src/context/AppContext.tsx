import { createContext, useContext, useState, type ReactNode } from 'react'

export interface SavedCard {
  id: string
  titulo: string
  autor: string
  tipo: string
  link: string
  isRead: boolean
  isFavorite: boolean
}

interface AppContextType {
  savedCards: SavedCard[]
  saveCard: (card: Omit<SavedCard, 'isRead' | 'isFavorite'>) => void
  toggleRead: (id: string) => void
  toggleFavorite: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])

  const saveCard = (card: Omit<SavedCard, 'isRead' | 'isFavorite'>) => {
    setSavedCards((prev) => {
      if (prev.find((c) => c.id === card.id)) return prev
      return [...prev, { ...card, isRead: false, isFavorite: false }]
    })
  }

  const toggleRead = (id: string) =>
    setSavedCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isRead: !c.isRead } : c))
    )

  const toggleFavorite = (id: string) =>
    setSavedCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    )

  return (
    <AppContext.Provider value={{ savedCards, saveCard, toggleRead, toggleFavorite }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
