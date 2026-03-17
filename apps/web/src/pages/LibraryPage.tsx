import { useState } from 'react'
import { BookOpen, Heart, CheckCircle, ExternalLink, Search, Library } from 'lucide-react'
import Input from '../components/ui/Input'
import { useApp } from '../context/AppContext'

const themes = [
  { id: '1', tema: 'Filosofia',   total: 42, emoji: '🏛️', progresso: 0.6 },
  { id: '2', tema: 'Matemática',  total: 18, emoji: '∑',   progresso: 0.3 },
  { id: '3', tema: 'Programação', total: 67, emoji: '💻',  progresso: 0.8 },
  { id: '4', tema: 'Neurociência',total: 23, emoji: '🧠',  progresso: 0.4 },
  { id: '5', tema: 'História',    total: 31, emoji: '📜',  progresso: 0.5 },
  { id: '6', tema: 'Física',      total: 15, emoji: '⚛️',  progresso: 0.2 },
  { id: '7', tema: 'Economia',    total: 28, emoji: '📈',  progresso: 0.35 },
  { id: '8', tema: 'Linguística', total: 11, emoji: '🗣️',  progresso: 0.1 },
]

type Tab = 'consultar' | 'salvos'

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('consultar')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'favoritos' | 'lidos'>('todos')
  const { savedCards, toggleRead, toggleFavorite } = useApp()

  const filteredThemes = themes.filter((t) =>
    t.tema.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCards = savedCards.filter((c) => {
    if (filter === 'favoritos') return c.isFavorite
    if (filter === 'lidos') return c.isRead
    return true
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Biblioteca</h1>
        <p className="text-sm text-brand-text">Consulte temas e gerencie seus materiais salvos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit mb-6 border border-slate-700">
        {(['consultar', 'salvos'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-slate-700 text-slate-100'
                : 'text-brand-text hover:text-slate-200'
            }`}
          >
            {tab === 'consultar'
              ? 'Consultar Temas'
              : `Materiais Salvos${savedCards.length > 0 ? ` (${savedCards.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab: Consultar Temas */}
      {activeTab === 'consultar' && (
        <div>
          <div className="mb-5 max-w-sm">
            <Input placeholder="Buscar tema..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredThemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p>Nenhum tema encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredThemes.map((t) => (
                <div
                  key={t.id}
                  className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-brand-accent transition-colors text-sm">
                        {t.tema}
                      </h3>
                      <p className="text-xs text-brand-text">{t.total} referências</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-brand-text">
                      <span>Progresso</span>
                      <span className="font-medium text-slate-300">{Math.round(t.progresso * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-accent rounded-full transition-all"
                        style={{ width: `${t.progresso * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Materiais Salvos */}
      {activeTab === 'salvos' && (
        <div>
          {savedCards.length > 0 && (
            <div className="flex gap-2 mb-4">
              {(['todos', 'favoritos', 'lidos'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30'
                      : 'text-brand-text border border-slate-700 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'favoritos' ? '❤️ Favoritos' : '✅ Lidos'}
                </button>
              ))}
            </div>
          )}

          {savedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Library className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-slate-300">Nenhum material salvo ainda</p>
              <p className="text-sm mt-1 text-center max-w-xs">
                Converse com o Bibliotecário para descobrir e salvar referências na sua biblioteca
              </p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <BookOpen className="w-10 h-10 mb-3 opacity-20" />
              <p>Nenhum material nesta categoria</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredCards.map((card) => (
                <div key={card.id} className="bg-brand-primary border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200 truncate text-sm">{card.titulo}</p>
                    <p className="text-xs text-brand-text mt-0.5">{card.autor} · {card.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleFavorite(card.id)} aria-label="Favoritar"
                      className={`transition-colors ${card.isFavorite ? 'text-pomodoro-focus' : 'text-slate-600 hover:text-slate-400'}`}>
                      <Heart className={`w-4 h-4 ${card.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => toggleRead(card.id)} aria-label="Marcar como lido"
                      className={`transition-colors ${card.isRead ? 'text-pomodoro-break' : 'text-slate-600 hover:text-slate-400'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <a href={card.link} target="_blank" rel="noopener noreferrer"
                      className="text-slate-600 hover:text-brand-accent transition-colors" aria-label="Abrir link">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
