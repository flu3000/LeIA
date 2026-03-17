import { useState } from 'react'
import { BookOpen, Star, Search } from 'lucide-react'
import Input from '../components/ui/Input'

interface Reference {
  titulo: string
  autor: string
  tipo: 'livro' | 'video' | 'podcast' | 'artigo' | 'curso'
}

interface Topic {
  id: string
  tema: string
  descricao: string
  emoji: string
  accentClass: string
  referencias: Reference[]
}

const topics: Topic[] = [
  {
    id: '1', tema: 'Filosofia', emoji: '🏛️',
    descricao: 'Da lógica aristotélica ao existencialismo moderno.',
    accentClass: 'border-l-4 border-l-purple-400',
    referencias: [
      { titulo: 'A República', autor: 'Platão', tipo: 'livro' },
      { titulo: 'Além do Bem e do Mal', autor: 'Friedrich Nietzsche', tipo: 'livro' },
      { titulo: 'Filosofia em 90 Minutos', autor: 'Paul Strathern', tipo: 'livro' },
    ],
  },
  {
    id: '2', tema: 'Matemática', emoji: '∑',
    descricao: 'Fundamentos, cálculo e matemática aplicada.',
    accentClass: 'border-l-4 border-l-brand-accent',
    referencias: [
      { titulo: 'O Homem que Calculava', autor: 'Malba Tahan', tipo: 'livro' },
      { titulo: '3Blue1Brown', autor: 'Grant Sanderson', tipo: 'video' },
      { titulo: 'MIT OpenCourseWare — Cálculo', autor: 'MIT', tipo: 'curso' },
    ],
  },
  {
    id: '3', tema: 'Programação', emoji: '💻',
    descricao: 'Algoritmos, arquitetura e engenharia de software.',
    accentClass: 'border-l-4 border-l-emerald-400',
    referencias: [
      { titulo: 'Clean Code', autor: 'Robert C. Martin', tipo: 'livro' },
      { titulo: 'The Pragmatic Programmer', autor: 'Hunt & Thomas', tipo: 'livro' },
      { titulo: 'CS50', autor: 'Harvard / David Malan', tipo: 'curso' },
    ],
  },
  {
    id: '4', tema: 'Neurociência', emoji: '🧠',
    descricao: 'Como o cérebro aprende, memoriza e processa informações.',
    accentClass: 'border-l-4 border-l-pink-400',
    referencias: [
      { titulo: 'O Cérebro que se Transforma', autor: 'Norman Doidge', tipo: 'livro' },
      { titulo: 'Huberman Lab', autor: 'Andrew Huberman', tipo: 'podcast' },
      { titulo: 'Learning How to Learn', autor: 'Barbara Oakley', tipo: 'curso' },
    ],
  },
  {
    id: '5', tema: 'História', emoji: '📜',
    descricao: 'Civilizações, impérios e os eventos que moldaram o mundo.',
    accentClass: 'border-l-4 border-l-amber-400',
    referencias: [
      { titulo: 'Sapiens', autor: 'Yuval Noah Harari', tipo: 'livro' },
      { titulo: 'Guns, Germs, and Steel', autor: 'Jared Diamond', tipo: 'livro' },
    ],
  },
  {
    id: '6', tema: 'Física', emoji: '⚛️',
    descricao: 'Do newtoniano ao quântico: como o universo funciona.',
    accentClass: 'border-l-4 border-l-cyan-400',
    referencias: [
      { titulo: 'Uma Breve História do Tempo', autor: 'Stephen Hawking', tipo: 'livro' },
      { titulo: 'The Feynman Lectures', autor: 'Richard Feynman', tipo: 'livro' },
    ],
  },
  {
    id: '7', tema: 'Economia', emoji: '📈',
    descricao: 'Macroeconomia, finanças comportamentais e mercados.',
    accentClass: 'border-l-4 border-l-pomodoro-break',
    referencias: [
      { titulo: 'O Capital no Século XXI', autor: 'Thomas Piketty', tipo: 'livro' },
      { titulo: 'Freakonomics', autor: 'Levitt & Dubner', tipo: 'livro' },
      { titulo: 'Planet Money', autor: 'NPR', tipo: 'podcast' },
    ],
  },
  {
    id: '8', tema: 'Linguística', emoji: '🗣️',
    descricao: 'Linguagem, cognição e a estrutura das línguas humanas.',
    accentClass: 'border-l-4 border-l-rose-400',
    referencias: [
      { titulo: 'The Language Instinct', autor: 'Steven Pinker', tipo: 'livro' },
      { titulo: 'Stuff You Missed in History', autor: 'iHeartPodcasts', tipo: 'podcast' },
    ],
  },
]

const tipoStyle: Record<string, string> = {
  livro:   'text-sky-400   bg-sky-400/10   border border-sky-400/20',
  video:   'text-blue-400  bg-blue-400/10  border border-blue-400/20',
  podcast: 'text-purple-400 bg-purple-400/10 border border-purple-400/20',
  artigo:  'text-teal-400  bg-teal-400/10  border border-teal-400/20',
  curso:   'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
}

export default function TopicsPage() {
  const [search, setSearch] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const filtered = topics.filter(
    (t) =>
      t.tema.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
  )

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
            className={`bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 ${topic.accentClass}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{topic.emoji}</span>
                <div>
                  <h2 className="font-semibold text-slate-100">{topic.tema}</h2>
                  <p className="text-xs text-brand-text leading-relaxed">{topic.descricao}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(topic.id)}
                className="text-slate-600 hover:text-amber-400 transition-colors shrink-0"
                aria-label="Favoritar tema"
              >
                <Star className={`w-4 h-4 ${favorites.has(topic.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
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
          </div>
        ))}
      </div>
    </div>
  )
}
