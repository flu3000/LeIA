import { useState } from 'react'
import { BookOpen, Minus, Plus, Zap, AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import type { FocusSessionData } from '../../hooks/usePomodoro'

interface Props {
  session: FocusSessionData
  onConfirm: (pages: number, chapters: number) => void
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-slate-300" />
        </button>
        <span className="w-10 text-center text-xl font-bold text-slate-100 tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>
    </div>
  )
}

export default function SessionCompleteModal({ session, onConfirm }: Props) {
  const [pages, setPages] = useState(0)
  const [chapters, setChapters] = useState(0)

  const baseXP = session.durationMinutes * 2 + pages * 5 + chapters * 50
  const finalXP = session.maintainedFocus ? Math.round(baseXP * 1.5) : baseXP

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-primary border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/50">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-pomodoro-focus/10 border border-pomodoro-focus/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-pomodoro-focus" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Sessão concluída!</h2>
              <p className="text-xs text-brand-text">{session.durationMinutes} min de foco</p>
            </div>
          </div>

          {/* Focus quality badge */}
          {session.maintainedFocus ? (
            <div className="mt-3 flex items-center gap-2 bg-pomodoro-break/10 border border-pomodoro-break/20 rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-pomodoro-break shrink-0" />
              <span className="text-xs text-pomodoro-break font-medium">Foco total — bônus 1.5× aplicado!</span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-400">Você saiu da aba — sem bônus de foco desta vez.</span>
            </div>
          )}
        </div>

        {/* Counters */}
        <div className="px-6 py-4 flex flex-col gap-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">O que você concluiu?</p>
          <Counter label="Páginas lidas" value={pages} onChange={setPages} />
          <Counter label="Capítulos concluídos" value={chapters} onChange={setChapters} />
        </div>

        {/* XP preview */}
        <div className="mx-6 mb-4 bg-brand-secondary border border-slate-700/60 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-brand-text">XP a ganhar</span>
          <div className="flex items-center gap-1.5">
            {session.maintainedFocus && baseXP !== finalXP && (
              <span className="text-xs text-slate-500 line-through">{baseXP}</span>
            )}
            <span className="text-lg font-bold text-brand-accent">+{finalXP} XP</span>
          </div>
        </div>

        {/* Formula hint */}
        <p className="text-center text-xs text-slate-600 pb-3">
          ({session.durationMinutes}min × 2) + ({pages}pág × 5) + ({chapters}cap × 50)
          {session.maintainedFocus ? ' × 1.5' : ''}
        </p>

        {/* Confirm */}
        <div className="px-6 pb-6">
          <Button className="w-full" onClick={() => onConfirm(pages, chapters)}>
            <Zap className="w-4 h-4" />
            Registrar e ganhar {finalXP} XP
          </Button>
        </div>
      </div>
    </div>
  )
}
