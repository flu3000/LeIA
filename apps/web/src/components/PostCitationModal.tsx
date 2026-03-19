import { useState, useEffect } from 'react'
import { X, Quote, Loader2, BookOpen } from 'lucide-react'
import { useCitations } from '../hooks/useCitations'
import { useUserContent } from '../hooks/useUserContent'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedCardId?: string
}

export default function PostCitationModal({ open, onClose, onSuccess, preselectedCardId }: Props) {
  const { createCitation } = useCitations()
  const { items } = useUserContent()
  const [content, setContent] = useState('')
  const [selectedCardId, setSelectedCardId] = useState(preselectedCardId ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setContent('')
      setSelectedCardId(preselectedCardId ?? '')
    }
  }, [open, preselectedCardId])

  if (!open) return null

  const selectedItem = items.find((i) => i.card_id === selectedCardId)

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    const ok = await createCitation(content, selectedItem?.title)
    setSubmitting(false)
    if (ok) onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-brand-secondary border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-brand-accent" />
            <h2 className="font-semibold text-slate-100">Compartilhar Citação</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder='"Uma citação que mudou sua perspectiva…"'
              className="w-full bg-brand-primary border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent resize-none transition-colors font-serif italic leading-relaxed"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${content.length >= 450 ? 'text-pomodoro-focus' : 'text-slate-600'}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Book select */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Livro de origem (opcional)
            </label>
            {items.length === 0 ? (
              <p className="text-xs text-slate-600 italic px-1">
                Adicione livros à sua biblioteca para vinculá-los.
              </p>
            ) : (
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-brand-primary border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="">Nenhum livro selecionado</option>
                {items.map((item) => (
                  <option key={item.card_id} value={item.card_id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* XP preview */}
          <div className="flex items-center gap-1.5 text-xs bg-pomodoro-break/5 border border-pomodoro-break/20 rounded-lg px-3 py-2">
            <span className="text-pomodoro-break font-bold">+20 XP</span>
            <span className="text-slate-500">ao publicar este insight</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publicar Insight
          </button>
        </div>
      </div>
    </div>
  )
}
