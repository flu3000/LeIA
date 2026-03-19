import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, MessageSquare, Filter, Star, Heart, CheckCircle2, Quote, CheckCircle } from 'lucide-react'
import { topics, tipoStyle, dificuldadeStyle } from '../data/topics'
import { useUserContent } from '../hooks/useUserContent'
import type { SaveItem } from '../hooks/useUserContent'
import PostCitationModal from '../components/PostCitationModal'

const tipoLabel: Record<string, string> = {
  livro: 'Livro', video: 'Vídeo', podcast: 'Podcast', artigo: 'Artigo', curso: 'Curso',
}

type TipoFilter = 'todos' | 'livro' | 'video' | 'podcast' | 'artigo' | 'curso'
type DificuldadeFilter = 'todas' | 'Iniciante' | 'Intermediário' | 'Avançado'

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')
  const [dificuldadeFilter, setDificuldadeFilter] = useState<DificuldadeFilter>('todas')
  const [citationCardId, setCitationCardId] = useState<string | undefined>()
  const [citationToast, setCitationToast] = useState(false)

  const { isFavourite, isRead, isSaved, toggleSave, toggleRead } = useUserContent()

  const handleCitationSuccess = () => {
    setCitationCardId(undefined)
    setCitationToast(true)
    setTimeout(() => setCitationToast(false), 3000)
  }

  const topic = topics.find((t) => t.id === id)

  if (!topic) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-brand-text">
        <p className="text-lg mb-4">Tema não encontrado.</p>
        <Link to="/topics" className="text-brand-accent hover:underline">← Voltar para Temas</Link>
      </div>
    )
  }

  // Stable card_id for each reference: topicId + position in todasReferencias
  const refCardId = (index: number) => `${topic.id}_ref_${index}`

  const refSaveItem = (index: number): SaveItem => ({
    card_id: refCardId(index),
    title: topic.todasReferencias[index].titulo,
    category: topic.todasReferencias[index].tipo,
  })

  const tipos = ['todos', ...Array.from(new Set(topic.todasReferencias.map((r) => r.tipo)))] as TipoFilter[]
  const dificuldades: DificuldadeFilter[] = ['todas', 'Iniciante', 'Intermediário', 'Avançado']

  // Keep original indexes when filtering so card_ids stay stable
  const referenciasComIndex = topic.todasReferencias.map((ref, i) => ({ ref, i }))
  const referenciasExibidas = referenciasComIndex.filter(({ ref }) => {
    const passaTipo = tipoFilter === 'todos' || ref.tipo === tipoFilter
    const passaDificuldade = dificuldadeFilter === 'todas' || ref.dificuldade === dificuldadeFilter
    return passaTipo && passaDificuldade
  })

  const topicSaveItem: SaveItem = { card_id: topic.id, title: topic.tema, category: 'Tema' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Citation toast */}
      {citationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-brand-primary border border-pomodoro-break/40 text-pomodoro-break text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Insight compartilhado com sucesso!
        </div>
      )}

      <PostCitationModal
        open={citationCardId !== undefined}
        onClose={() => setCitationCardId(undefined)}
        onSuccess={handleCitationSuccess}
        preselectedCardId={citationCardId}
      />

      {/* Voltar */}
      <button
        onClick={() => navigate('/topics')}
        className="flex items-center gap-2 text-brand-text hover:text-slate-100 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm">Voltar para Temas</span>
      </button>

      {/* Header */}
      <div className={`bg-brand-primary rounded-2xl p-6 mb-6 ${topic.accentClass}`}>
        <div className="flex items-start gap-4">
          <span className="text-5xl leading-none">{topic.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-100">{topic.tema}</h1>
              {/* Save topic button */}
              <button
                onClick={() => toggleSave(topicSaveItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-brand-accent/50 bg-slate-800 hover:bg-brand-accent/10 transition-all duration-150 active:scale-95 shrink-0"
                aria-label={isSaved(topic.id) ? 'Remover dos salvos' : 'Salvar tema'}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    isFavourite(topic.id) ? 'fill-brand-accent text-brand-accent' : 'text-slate-400'
                  }`}
                />
                <span className={`text-xs font-medium ${isSaved(topic.id) ? 'text-brand-accent' : 'text-slate-400'}`}>
                  {isSaved(topic.id) ? 'Salvo' : 'Salvar'}
                </span>
              </button>
            </div>
            <p className="text-brand-text text-sm mb-4 leading-relaxed">{topic.descricaoLonga}</p>

            {/* Conceitos-chave */}
            <div className="flex flex-wrap gap-2">
              {topic.conceitos.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA — Explorar no Chat */}
        <div className="mt-5 pt-5 border-t border-slate-700">
          <Link
            to={`/?tema=${encodeURIComponent(topic.tema)}`}
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Explorar {topic.tema} no Chat
          </Link>
        </div>
      </div>

      {/* Referências */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-accent" />
            Referências Curadas
            <span className="text-sm font-normal text-brand-text">({referenciasExibidas.length})</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-brand-text">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setTipoFilter(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  tipoFilter === t
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'todos' ? 'Todos os tipos' : tipoLabel[t]}
              </button>
            ))}
          </div>

          <div className="w-px bg-slate-700 self-stretch hidden sm:block" />

          <div className="flex flex-wrap gap-1.5">
            {dificuldades.map((d) => (
              <button
                key={d}
                onClick={() => setDificuldadeFilter(d)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  dificuldadeFilter === d
                    ? 'bg-brand-accent border-brand-accent text-white'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {d === 'todas' ? 'Toda dificuldade' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de referências */}
        {referenciasExibidas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-brand-text">
            <BookOpen className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma referência com esses filtros.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {referenciasExibidas.map(({ ref, i }) => {
              const cardId = refCardId(i)
              const saved = isSaved(cardId)
              const favourite = isFavourite(cardId)
              const read = isRead(cardId)

              return (
                <div
                  key={cardId}
                  className={`bg-brand-primary border rounded-xl p-4 transition-all hover:shadow-md hover:shadow-black/20 ${
                    read ? 'border-slate-700/50 opacity-70' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug mb-0.5 ${read ? 'line-through text-brand-text' : 'text-slate-100'}`}>
                        {ref.titulo}
                      </p>
                      <p className="text-xs text-brand-text mb-2">{ref.autor}</p>
                      {ref.descricao && (
                        <p className="text-xs text-slate-400 leading-relaxed">{ref.descricao}</p>
                      )}
                    </div>

                    {/* Badges + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Type + difficulty badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tipoStyle[ref.tipo] ?? 'text-brand-text bg-slate-700'}`}>
                          {tipoLabel[ref.tipo] ?? ref.tipo}
                        </span>
                        {ref.dificuldade && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${dificuldadeStyle[ref.dificuldade] ?? 'text-brand-text bg-slate-700'}`}>
                            {ref.dificuldade}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 pt-1 border-t border-slate-700 w-full justify-end">
                        {/* Favourite */}
                        <button
                          onClick={() => toggleSave(refSaveItem(i))}
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-all duration-150 active:scale-90"
                          aria-label={favourite ? 'Remover dos favoritos' : 'Favoritar'}
                          title={favourite ? 'Remover dos favoritos' : 'Favoritar'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${
                              favourite ? 'fill-brand-accent text-brand-accent' : 'text-slate-500 hover:text-brand-accent'
                            }`}
                          />
                        </button>

                        {/* Read */}
                        <button
                          onClick={() => toggleRead(refSaveItem(i))}
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-all duration-150 active:scale-90"
                          aria-label={read ? 'Marcar como não lido' : 'Marcar como lido'}
                          title={read ? 'Marcar como não lido' : 'Marcar como lido'}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 transition-colors ${
                              read ? 'text-pomodoro-break' : 'text-slate-500 hover:text-pomodoro-break'
                            }`}
                          />
                        </button>

                        {/* Cite */}
                        <button
                          onClick={() => setCitationCardId(cardId)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-all duration-150 active:scale-90"
                          aria-label="Adicionar citação"
                          title="Adicionar citação (+20 XP)"
                        >
                          <Quote className="w-3.5 h-3.5 text-slate-500 hover:text-brand-accent transition-colors" />
                        </button>

                        {/* Saved indicator */}
                        {saved && (
                          <span className="text-xs text-slate-500 ml-0.5" title="Salvo na biblioteca">
                            ·
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
