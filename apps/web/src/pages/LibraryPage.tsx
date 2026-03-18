import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Heart, CheckCircle, Search, Library,
  Loader2, Star, RefreshCw,
} from 'lucide-react'
import Input from '../components/ui/Input'
import { topics } from '../data/topics'
import { useUserContent } from '../hooks/useUserContent'

type Tab = 'consultar' | 'salvos'
type Filter = 'todos' | 'favoritos' | 'lidos'

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('consultar')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const navigate = useNavigate()

  const { items, isSyncing, toggleSave, toggleRead, isFavourite } = useUserContent()

  // "Consultar Temas": topics saved by the user (category === 'Tema'), with search
  const savedTopicIds = new Set(
    items.filter((i) => i.category === 'Tema').map((i) => i.card_id)
  )
  const filteredTopics = topics.filter(
    (t) =>
      savedTopicIds.has(t.id) &&
      t.tema.toLowerCase().includes(search.toLowerCase())
  )

  // "Materiais Salvos": all items, filterable
  const filteredItems = items.filter((item) => {
    if (filter === 'favoritos') return item.is_favourite
    if (filter === 'lidos') return item.is_read
    return true
  })

  const savedCount = items.length

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
              : `Materiais Salvos${savedCount > 0 ? ` (${savedCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Sync indicator */}
      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-brand-text mb-4 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Sincronizando...
        </div>
      )}

      {/* ── Tab: Consultar Temas ── */}
      {activeTab === 'consultar' && (
        <div>
          <div className="mb-5 max-w-sm">
            <Input
              placeholder="Buscar tema salvo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {savedTopicIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Star className="w-10 h-10 mb-3 opacity-20" />
              <p className="font-medium text-slate-300">Nenhum tema salvo ainda</p>
              <p className="text-sm mt-1 text-center max-w-xs">
                Na página de Temas, clique na estrela de qualquer área para salvá-la aqui.
              </p>
              <button
                onClick={() => navigate('/topics')}
                className="mt-4 text-sm text-brand-accent hover:underline"
              >
                Ir para Temas →
              </button>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p>Nenhum tema encontrado para "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTopics.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/topics/${t.id}`)}
                  className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-slate-100 group-hover:text-brand-accent transition-colors text-sm">
                          {t.tema}
                        </h3>
                        <p className="text-xs text-brand-text">{t.todasReferencias.length} referências</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSave({ card_id: t.id, title: t.tema, category: 'Tema' })
                      }}
                      className="p-1 transition-all duration-150 active:scale-90 shrink-0"
                      aria-label="Remover dos salvos"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          isFavourite(t.id)
                            ? 'fill-brand-accent text-brand-accent'
                            : 'text-slate-600 hover:text-brand-accent'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-brand-text leading-relaxed line-clamp-2">{t.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Materiais Salvos ── */}
      {activeTab === 'salvos' && (
        <div>
          {items.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'favoritos', 'lidos'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === f
                        ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30'
                        : 'text-brand-text border border-slate-700 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'favoritos' ? '⭐ Favoritos' : '✅ Lidos'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {}}
                className="text-slate-500 hover:text-brand-text transition-colors p-1"
                aria-label="Atualizar"
                title="Atualizar lista"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <Library className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-slate-300">Nenhum material salvo ainda</p>
              <p className="text-sm mt-1 text-center max-w-xs">
                Salve temas ou converse com o Bibliotecário para curar referências
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-brand-text">
              <BookOpen className="w-10 h-10 mb-3 opacity-20" />
              <p>Nenhum material nesta categoria</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredItems.map((item) => (
                <div
                  key={item.card_id}
                  className={`bg-brand-primary border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3 transition-opacity ${
                    item.is_read ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium text-sm truncate ${item.is_read ? 'text-brand-text line-through' : 'text-slate-200'}`}>
                        {item.title}
                      </p>
                      {item.is_read && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-pomodoro-break/10 text-pomodoro-break border border-pomodoro-break/20 shrink-0">
                          Lido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text mt-0.5">{item.category}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Favourite */}
                    <button
                      onClick={() => toggleSave({ card_id: item.card_id, title: item.title, category: item.category })}
                      aria-label="Favoritar"
                      className="transition-all duration-150 active:scale-90"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          item.is_favourite
                            ? 'fill-brand-accent text-brand-accent'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Read */}
                    <button
                      onClick={() => toggleRead({ card_id: item.card_id, title: item.title, category: item.category })}
                      aria-label="Marcar como lido"
                      className="transition-all duration-150 active:scale-90"
                    >
                      <CheckCircle
                        className={`w-4 h-4 transition-colors ${
                          item.is_read
                            ? 'text-pomodoro-break'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
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
