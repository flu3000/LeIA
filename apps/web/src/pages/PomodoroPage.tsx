import { useState, useEffect, useCallback } from 'react'
import {
  Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, Info,
  Settings2, Minus, Plus, Loader2, AlertCircle, Cloud, Flame, Target, AlertTriangle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { usePomodoro, type PomodoroMode, type FocusSessionData } from '../hooks/usePomodoro'
import { usePomodoroSettings } from '../hooks/usePomodoroSettings'
import SessionCompleteModal from '../components/pomodoro/SessionCompleteModal'
import XPToast from '../components/XPToast'
import type { Medal } from '../data/medals'

const CIRCLE_RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

function DurationStepper({
  label, icon, value, onChange, accentClass, disabled, min = 1,
}: {
  label: string; icon: React.ReactNode; value: number
  onChange: (v: number) => void; accentClass: string; disabled: boolean; min?: number
}) {
  const [raw, setRaw] = useState(String(value))
  useEffect(() => { setRaw(String(value)) }, [value])
  const commit = (text: string) => {
    const parsed = parseInt(text, 10)
    const clamped = isNaN(parsed) ? value : Math.max(min, Math.min(90, parsed))
    setRaw(String(clamped)); if (clamped !== value) onChange(clamped)
  }
  return (
    <div className="min-w-0 bg-brand-secondary border border-slate-700 rounded-xl p-4">
      <div className={`flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider ${accentClass}`}>{icon}{label}</div>
      <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2">
        <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
          <Minus className="w-3.5 h-3.5 text-slate-300" />
        </button>
        <input type="number" min={min} max={90} value={raw} disabled={disabled}
          onChange={(e) => setRaw(e.target.value)} onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} onFocus={(e) => e.target.select()}
          className="w-full text-center text-3xl font-bold text-slate-100 tabular-nums bg-transparent border-b-2 border-slate-600 focus:border-brand-accent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= 90}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
          <Plus className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>
    </div>
  )
}

function GoalStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0 bg-brand-secondary border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-brand-accent">
        <Target className="w-3.5 h-3.5" />Meta diária
      </div>
      <div className="grid grid-cols-[2rem_1fr_2rem] items-center gap-2">
        <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
          <Minus className="w-3.5 h-3.5 text-slate-300" />
        </button>
        <span className="text-center text-3xl font-bold text-slate-100 tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 20}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
          <Plus className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>
      <p className="text-xs text-brand-text mt-2 text-center">sessões por dia</p>
    </div>
  )
}

export default function PomodoroPage() {
  const { initialDurations, isLoadingSettings, saveStatus, saveDurations, stats, saveDailyGoal, completeSession } = usePomodoroSettings()
  const [pendingSession, setPendingSession] = useState<FocusSessionData | null>(null)
  const [xpToast, setXPToast] = useState<{ xp: number; medals: Medal[] } | null>(null)

  const handleFocusComplete = useCallback((data: FocusSessionData) => {
    setPendingSession(data)
  }, [])

  const {
    mode, durations, minutes, seconds, isRunning, sessions, progress,
    focusInterrupted, start, pause, reset, switchMode, setDuration, loadDurations, dismissInterrupted,
  } = usePomodoro(handleFocusComplete)

  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!isLoadingSettings) loadDurations(initialDurations)
  }, [isLoadingSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetDuration = (m: PomodoroMode, v: number) => {
    setDuration(m, v)
    saveDurations({ ...durations, [m]: Math.max(m === 'focus' ? 5 : 1, Math.min(90, v)) })
  }

  const handleSessionConfirm = async (pages: number, chapters: number) => {
    if (!pendingSession) return
    setPendingSession(null)
    const result = await completeSession({ ...pendingSession, pages, chapters })
    setXPToast({ xp: result.xpGained, medals: result.newMedals })
  }

  const isFocus = mode === 'focus'
  const accentColor = isFocus ? '#E11D48' : '#10B981'
  const accentBg    = isFocus ? 'bg-pomodoro-focus'   : 'bg-pomodoro-break'
  const accentText  = isFocus ? 'text-pomodoro-focus' : 'text-pomodoro-break'
  const accentRing  = isFocus ? 'ring-pomodoro-focus/20' : 'ring-pomodoro-break/20'
  const dashOffset  = CIRCUMFERENCE * (1 - progress)
  const { streak, sessionsToday, dailyGoal, goalJustReached } = stats
  const goalProgress = Math.min(sessionsToday / Math.max(1, dailyGoal), 1)

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 bg-brand-secondary text-slate-100">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Estudo Focado</h1>
            <p className="text-sm text-brand-text">Técnica Pomodoro</p>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div title={`${streak} dia${streak !== 1 ? 's' : ''} consecutivo${streak !== 1 ? 's' : ''}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm font-bold">
                🔥 {streak}
              </div>
            )}
            <button type="button" onClick={() => setShowSettings((v) => !v)}
              aria-label="Configurar tempos" aria-expanded={showSettings}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
                showSettings ? 'bg-brand-accent/10 border-brand-accent/40 text-brand-accent'
                : 'bg-brand-primary border-slate-700 text-brand-text hover:text-slate-200 hover:border-slate-600'}`}>
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab-left warning */}
        {focusInterrupted && (
          <div className="mb-4 flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 flex-1">Mantenha o foco no livro! O bônus de XP foi perdido.</p>
            <button onClick={dismissInterrupted} className="text-slate-500 hover:text-slate-300 text-xs ml-2">✕</button>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="bg-brand-primary border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configurações</p>
                {saveStatus === 'saving' && <span className="flex items-center gap-1 text-xs text-brand-text"><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</span>}
                {saveStatus === 'saved'  && <span className="flex items-center gap-1 text-xs text-pomodoro-break"><Cloud className="w-3 h-3" /> Salvo na nuvem</span>}
                {saveStatus === 'error'  && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> Erro ao salvar</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <DurationStepper label="Foco" icon={<Brain className="w-3.5 h-3.5" />} value={durations.focus}
                  onChange={(v) => handleSetDuration('focus', v)} accentClass="text-pomodoro-focus"
                  disabled={isRunning && mode === 'focus'} min={5} />
                <DurationStepper label="Pausa" icon={<Coffee className="w-3.5 h-3.5" />} value={durations.break}
                  onChange={(v) => handleSetDuration('break', v)} accentClass="text-pomodoro-break"
                  disabled={isRunning && mode === 'break'} />
              </div>
              <GoalStepper value={dailyGoal} onChange={saveDailyGoal} />
              {isRunning && (
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />Pause o cronômetro para alterar o tempo do modo ativo.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mode switcher */}
        <div className="flex gap-1 bg-brand-primary border border-slate-700 p-1 rounded-xl mb-8">
          {(['focus', 'break'] as PomodoroMode[]).map((m) => {
            const active = mode === m; const bg = m === 'focus' ? 'bg-pomodoro-focus' : 'bg-pomodoro-break'; const Icon = m === 'focus' ? Brain : Coffee
            return (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? `${bg} text-white shadow-sm` : 'text-brand-text hover:text-slate-100'}`}>
                <Icon className="w-4 h-4" />
                {m === 'focus' ? `Foco (${durations.focus} min)` : `Pausa (${durations.break} min)`}
              </button>
            )
          })}
        </div>

        {/* Timer circle */}
        <div className="flex justify-center mb-8">
          <div className="relative w-56 h-56">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r={CIRCLE_RADIUS} fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle cx="100" cy="100" r={CIRCLE_RADIUS} fill="none" stroke={accentColor} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-linear" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-slate-100 tabular-nums tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className={`text-sm font-semibold mt-1 ${accentText}`}>{isFocus ? 'Foco' : 'Pausa'}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-8">
          <Button variant="secondary" onClick={reset} aria-label="Reiniciar">
            <RotateCcw className="w-4 h-4" />Reiniciar
          </Button>
          <button onClick={isRunning ? pause : start} aria-label={isRunning ? 'Pausar' : 'Iniciar'}
            className={`inline-flex items-center gap-2 px-8 py-2.5 text-base rounded-xl font-medium text-white transition-colors ring-2 ${accentBg} ${accentRing} hover:opacity-90`}>
            {isRunning ? <><Pause className="w-5 h-5" /> Pausar</> : <><Play className="w-5 h-5" /> Iniciar</>}
          </button>
        </div>

        {/* Daily progress */}
        <div className="bg-brand-primary border border-slate-700 rounded-2xl p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300 font-medium">Sessões hoje</span>
              </div>
              <span className="text-sm font-bold text-slate-100 tabular-nums">{sessionsToday} / {dailyGoal}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-brand-accent transition-all duration-500" style={{ width: `${goalProgress * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pomodoro-break" />
              <span className="text-sm text-slate-300 font-medium">
                {sessions} {sessions === 1 ? 'sessão concluída' : 'sessões concluídas'} hoje
              </span>
            </div>
            {sessions >= 4 && (
              <span className="text-xs text-pomodoro-break bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Ótimo dia!</span>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            {Array.from({ length: dailyGoal }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${i < sessions ? accentBg : 'bg-slate-700'}`} />
            ))}
          </div>
          <div className="flex items-start gap-2 text-xs text-brand-text">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
            <p>A técnica Pomodoro alterna blocos de foco com pausas curtas para maximizar produtividade e reduzir fadiga mental.</p>
          </div>
        </div>
      </div>

      {/* Session complete modal */}
      {pendingSession && <SessionCompleteModal session={pendingSession} onConfirm={handleSessionConfirm} />}

      {/* XP + medal toast */}
      <XPToast
        xp={xpToast?.xp ?? null}
        medals={xpToast?.medals ?? []}
        onDone={() => setXPToast(null)}
      />

      {/* Goal reached */}
      {goalJustReached && (
        <div className="fixed inset-0 flex items-end justify-center pb-24 pointer-events-none z-50 px-4">
          <div className="bg-brand-primary border border-pomodoro-break/40 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-4 duration-400">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-pomodoro-break">Meta batida!</p>
              <p className="text-xs text-brand-text">{dailyGoal} {dailyGoal === 1 ? 'sessão concluída' : 'sessões concluídas'} hoje. Incrível!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
