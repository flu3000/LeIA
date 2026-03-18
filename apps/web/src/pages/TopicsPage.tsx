import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Star, Search, ChevronRight } from 'lucide-react'
import Input from '../components/ui/Input'
import { topics, tipoStyle } from '../data/topics'
import { useUserContent } from '../hooks/useUserContent'

export default function TopicsPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { isFavourite, isSaved, toggleSave } = useUserContent()

  const filtered = topics.filter(
    (t) =>
      t.tema.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleSave = (e: React.MouseEvent, id: string, tema: string) => {
    e.stopPropagation()
    toggleSave({ card_id: id, title: tema, category: 'Tema' })
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Temas</h1>
          <p className="text-sm text-brand-text">
            {filtered.length} área{filtered.length !== 1 ? 's' : ''} do conhecimento com referências curadas
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input placeholder="Buscar tema..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-brand-text">
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p>Nenhum tema encontrado para "{search}"</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((topic) => (
          <div
            key={topic.id}
            onClick={() => navigate(`/topics/${topic.id}`)}
            className={`bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer group ${topic.accentClass}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.emoji}</span>
                <div>
                  <h2 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                    {topic.tema}
                  </h2>
                  <p className="text-xs text-brand-text leading-relaxed">{topic.descricao}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => handleToggleSave(e, topic.id, topic.tema)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-150 active:scale-95 border border-transparent hover:border-slate-600 hover:bg-slate-800"
                  aria-label={isSaved(topic.id) ? 'Remover dos salvos' : 'Salvar tema'}
                  title={isSaved(topic.id) ? 'Remover dos salvos' : 'Salvar na biblioteca'}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      isFavourite(topic.id)
                        ? 'fill-brand-accent text-brand-accent'
                        : 'text-slate-500 hover:text-brand-accent'
                    }`}
                  />
                  {isSaved(topic.id) && (
                    <span className="text-xs text-brand-accent font-medium">Salvo</span>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-3 mt-3">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Referências Bibliográficas
              </p>
              <div className="flex flex-col gap-2">
                {topic.referencias.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate font-medium">{ref.titulo}</p>
                      <p className="text-xs text-brand-text">{ref.autor}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tipoStyle[ref.tipo] ?? 'text-brand-text bg-slate-700'}`}>
                      {ref.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ver mais */}
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-brand-text">
                {topic.todasReferencias.length} referências no total
              </span>
              <span className="text-xs text-brand-accent flex items-center gap-0.5 group-hover:gap-1 transition-all">
                Ver detalhes <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
