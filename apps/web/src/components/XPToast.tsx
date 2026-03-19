import { AnimatePresence, motion } from 'framer-motion'
import type { Medal } from '../data/medals'

interface Props {
  xp: number | null
  medals: Medal[]
  onDone: () => void
}

export default function XPToast({ xp, medals, onDone }: Props) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {xp !== null && (
        <motion.div
          key="xp-toast"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none"
        >
          {/* XP badge */}
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: [1.15, 0.95, 1.05, 1] }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center gap-2 bg-brand-primary border border-brand-accent/50 rounded-2xl px-5 py-3 shadow-xl shadow-brand-accent/20"
          >
            <span className="text-2xl">⚡</span>
            <span className="text-2xl font-bold text-brand-accent">+{xp} XP</span>
          </motion.div>

          {/* Medal pops */}
          {medals.map((medal, i) => (
            <motion.div
              key={medal.key}
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300 }}
              className="flex items-center gap-2 bg-brand-primary border border-amber-400/40 rounded-xl px-4 py-2 shadow-lg shadow-amber-400/20"
            >
              <span className="text-xl">{medal.emoji}</span>
              <div>
                <p className="text-xs font-bold text-amber-400">{medal.name}</p>
                <p className="text-xs text-slate-500">Medalha desbloqueada!</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
