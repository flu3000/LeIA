import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Heart, CheckCircle, Search, Library, Loader2, Star, RefreshCw, ChevronDown } from 'lucide-react'
import Input from '../components/ui/Input'
import { topics, type Topic } from '../data/topics'
import { useUserContent } from '../hooks/useUserContent'

type Tab = 'consultar' | 'salvos'
type Filter = 'todos' | 'favoritos' | 'lidos'

// Broader grouping for accordion (Theme → Subtheme layout)
const TOPIC_GROUPS: Record<string, string[]> = {
  'Humanidades':    ['1', '5', '8'],  // Filosofia, História, Linguística
  'Ciências Exatas':['2', '6'],       // Matemática, Física
  'Ciências da Vida':['4'],           // Neurociência
  'Tecnologia & Economia': ['3', '7'],// Programação, Economia
}

const TIPO_LABEL: Record<string, string> = {
  livro: '📚 Livros', video: '🎬 Vídeos', podcast: '🎙 Podcasts', artigo: '📰 Artigos', curso: '🎓 Cursos',
}

// ── Accordion item ─────────────────────────────────────────
function AccordionGroup({ label, topics: groupTopics }: { label: string; topics: Topic[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-brand-primary border border-slate-700 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors"
      >
        <span className="font-serif font-semibold text-slate-100 text-base">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-brand-text">{groupTopics.length} tema{groupTopics.length !== 1 ? 's' : ''}</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700/60">
          {groupTopics.map((topic) => (
            <TopicAccordion key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}

function TopicAccordion({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(false)
  const byTipo = topic.todasReferencias.reduce<Record<string, typeof topic.todasReferencias>>((acc, ref) => {
    if (!acc[ref.tipo]) acc[ref.tipo] = []
    acc[ref.tipo].push(ref)
    return acc
  }, {})

  return (
    <div className="border-b border-slate-700/30 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-700/10 transition-colors"
      >
        <span className="text-xl">{topic.emoji}</span>
        <span className="font-serif font-medium text-slate-200 flex-1 text-left">{topic.tema}</span>
        <span className="text-xs text-brand-text">{topic.todasReferencias.length} ref.</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-4">
          {Object.entries(byTipo).map(([tipo, refs]) => (
            <div key={tipo} className="mb-4 last:mb-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
                {TIPO_LABEL[tipo] ?? tipo}
              </p>
              <div className="flex flex-col gap-1.5">
                {refs.map((ref, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent/50 shrink-0" />
                    <span className="text-slate-300">{ref.titulo}</span>
                    <span className="text-slate-600 text-xs ml-auto shrink-0">{ref.autor}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('consultar')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const navigate = useNavigate()
  const { items, isSyncing, toggleSave, toggleRead, isFavourite } = useUserContent()

  const savedTopicIds = new Set(items.filter((i) => i.category === 'Tema').map((i) => i.card_id))
  const filteredItems = items.filter((item) => {
    if (filter === 'favoritos') return item.is_favourite
    if (filter === 'lidos') return item.is_read
    return true
  })
  const savedCount = items.length

  // Build grouped topics for accordion, filtered by search
  const topicById = Object.fromEntries(topics.map((t) => [t.id, t]))
  const groupedFiltered = Object.entries(TOPIC_GROUPS).map(([label, ids]) => ({
    label,
    topics: ids.flatMap((id) => {
      const t = topicById[id]
      if (!t) return []
      if (search && !t.tema.toLowerCase().includes(search.toLowerCase())) return []
      return [t]
    }),
  })).filter((g) => g.topics.length > 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Biblioteca</h1>
        <p className="text-sm text-brand-text">Consulte temas e gerencie seus materiais salvos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit mb-6 border border-slate-700">
        {(['consultar', 'salvos'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-slate-700 text-slate-100' : 'text-brand-text hover:text-slate-200'}`}>
            {tab === 'consultar' ? 'Acervo' : `Minha Coleção${savedCount > 0 ? ` (${savedCount})` : ''}`}
          </button>
        ))}
      </div>

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-brand-text mb-4 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />Sincronizando...
        </div>
      )}

      {/* ── Tab: Acervo (Accordion) ── */}
      {activeTab === 'consultar' && (
        <div>
          <div className="mb-5 max-w-sm">
            <Input placeholder="Buscar tema…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {groupedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p>Nenhum tema encontrado para "{search}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedFiltered.map((group) => (
                <AccordionGroup key={group.label} label={group.label} topics={group.topics} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Minha Coleção ── */}
      {activeTab === 'salvos' && (
        <div>
          {items.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'favoritos', 'lidos'] as Filter[]).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-brand-text border border-slate-700 hover:border-slate-600 hover:text-slate-200'}`}>
                    {f === 'todos' ? 'Todos' : f === 'favoritos' ? '⭐ Favoritos' : '✅ Lidos'}
                  </button>
                ))}
              </div>
              <button onClick={() => {}} className="text-slate-500 hover:text-brand-text transition-colors p-1" aria-label="Atualizar">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Library className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-slate-300">Nenhum material salvo ainda</p>
              <p className="text-sm mt-1 text-center max-w-xs">Salve temas ou converse com o Bibliotecário para curar referências</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <BookOpen className="w-10 h-10 mb-3 opacity-20" /><p>Nenhum material nesta categoria</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredItems.map((item) => (
                <div key={item.card_id}
                  className={`bg-brand-primary border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3 transition-opacity ${item.is_read ? 'opacity-60' : 'opacity-100'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium text-sm truncate ${item.is_read ? 'text-brand-text line-through' : 'text-slate-200'}`}>{item.title}</p>
                      {item.is_read && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-pomodoro-break/10 text-pomodoro-break border border-pomodoro-break/20 shrink-0">Lido</span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text mt-0.5">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleSave({ card_id: item.card_id, title: item.title, category: item.category })}
                      aria-label="Favoritar" className="transition-all duration-150 active:scale-90">
                      <Heart className={`w-4 h-4 transition-colors ${item.is_favourite ? 'fill-brand-accent text-brand-accent' : 'text-slate-600 hover:text-slate-400'}`} />
                    </button>
                    <button onClick={() => toggleRead({ card_id: item.card_id, title: item.title, category: item.category })}
                      aria-label="Marcar como lido" className="transition-all duration-150 active:scale-90">
                      <CheckCircle className={`w-4 h-4 transition-colors ${item.is_read ? 'text-pomodoro-break' : 'text-slate-600 hover:text-slate-400'}`} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Saved topics shortcut */}
              {savedTopicIds.size > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/60">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Temas Salvos ({savedTopicIds.size})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {topics.filter((t) => savedTopicIds.has(t.id)).map((t) => (
                      <div key={t.id} onClick={() => navigate(`/topics/${t.id}`)}
                        className="bg-brand-secondary border border-slate-700 hover:border-slate-600 rounded-xl p-3 cursor-pointer flex items-center gap-2 group transition-colors">
                        <span className="text-lg">{t.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 group-hover:text-brand-accent truncate transition-colors">{t.tema}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleSave({ card_id: t.id, title: t.tema, category: 'Tema' }) }}
                          className="ml-auto shrink-0 active:scale-90">
                          <Star className={`w-3.5 h-3.5 ${isFavourite(t.id) ? 'fill-brand-accent text-brand-accent' : 'text-slate-600 hover:text-brand-accent'} transition-colors`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
