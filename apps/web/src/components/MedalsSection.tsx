import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useMedals } from '../hooks/useMedals'
import { MEDALS, MEDAL_RARITY_STYLE, type Medal } from '../data/medals'

function MedalCard({
  medal, unlocked, featured, canFeature, onToggle,
}: {
  medal: Medal
  unlocked: boolean
  featured: boolean
  canFeature: boolean
  onToggle?: () => void
}) {
  const style = MEDAL_RARITY_STYLE[medal.rarity]
  const showGlow = unlocked && featured

  return (
    <motion.button
      whileHover={unlocked ? { scale: 1.06 } : {}}
      whileTap={unlocked ? { scale: 0.96 } : {}}
      onClick={unlocked ? onToggle : undefined}
      disabled={!unlocked || (!featured && !canFeature)}
      title={unlocked ? (featured ? 'Remover do destaque' : canFeature ? 'Colocar em destaque' : 'Máximo de 5 destaques') : 'Bloqueada'}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center
        ${unlocked ? 'cursor-pointer' : 'cursor-default opacity-40'}
        ${featured ? style.border : unlocked ? 'border-slate-700 hover:border-slate-600' : 'border-slate-800'}
        ${showGlow ? `shadow-lg ${style.glow}` : ''}
      `}
    >
      {showGlow && (
        <span className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }} />
      )}
      <span className="text-2xl">{unlocked ? medal.emoji : <Lock className="w-5 h-5" />}</span>
      <span className={`text-xs font-medium leading-tight ${unlocked ? 'text-slate-200' : 'text-slate-600'}`}>
        {medal.name}
      </span>
      {unlocked && (
        <span className={`text-[10px] uppercase tracking-wide ${MEDAL_RARITY_STYLE[medal.rarity].border.replace('border-', 'text-').replace('/60', '').replace('/70', '')}`}>
          {medal.rarity}
        </span>
      )}
      {featured && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] flex items-center justify-center text-black font-bold">
          ★
        </span>
      )}
    </motion.button>
  )
}

export default function MedalsSection({ isOwner = true }: { isOwner?: boolean }) {
  const { unlocked, featured, unlockedKeys, toggleFeatured } = useMedals()
  const [tab, setTab] = useState<'destaque' | 'colecao'>('destaque')
  const featuredKeys = new Set(featured.map((m) => m.key))
  const canFeature = featured.length < 5

  return (
    <div className="bg-brand-primary border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <h3 className="text-sm font-semibold text-slate-200">Medalhas</h3>
        <div className="flex gap-1">
          {(['destaque', ...(isOwner ? ['colecao'] : [])] as ('destaque' | 'colecao')[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                tab === t ? 'bg-slate-700 text-slate-100' : 'text-brand-text hover:text-slate-200'
              }`}
            >
              {t === 'destaque' ? `⭐ Em Destaque (${featured.length}/5)` : `🎖 Coleção (${unlocked.length})`}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'destaque' ? (
          <motion.div key="destaque" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5">
            {featured.length === 0 ? (
              <p className="text-center text-sm text-brand-text py-4">
                {isOwner ? 'Selecione até 5 medalhas na Coleção para exibir aqui.' : 'Nenhuma medalha em destaque.'}
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {featured.map((medal) => (
                  <MedalCard
                    key={medal.key} medal={medal} unlocked featured={true}
                    canFeature={canFeature} onToggle={() => isOwner && toggleFeatured(medal.key)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="colecao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {MEDALS.map((medal) => (
                <MedalCard
                  key={medal.key} medal={medal}
                  unlocked={unlockedKeys.has(medal.key)}
                  featured={featuredKeys.has(medal.key)}
                  canFeature={canFeature}
                  onToggle={() => toggleFeatured(medal.key)}
                />
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3 text-center">
              Clique em uma medalha desbloqueada para colocá-la em destaque (máx. 5).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
