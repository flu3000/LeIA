/**
 * CommunitiesPage — Clubes de leitura filtrados pela cidade do usuário.
 *
 * SQL necessário no Supabase:
 * ─────────────────────────────────────────────────────────────────────
 * CREATE TABLE communities (
 *   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name         TEXT NOT NULL,
 *   description  TEXT,
 *   city         TEXT,
 *   state        TEXT,
 *   cover_url    TEXT,
 *   genre        TEXT,          -- ex: 'Ficção Científica', 'Filosofia', 'Geral'
 *   member_count INTEGER DEFAULT 0,
 *   created_at   TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE community_members (
 *   community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
 *   user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   joined_at    TIMESTAMPTZ DEFAULT NOW(),
 *   PRIMARY KEY  (community_id, user_id)
 * );
 *
 * ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "anyone can read communities" ON communities FOR SELECT USING (true);
 * ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "user manages own membership" ON community_members
 *   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
 *
 * -- Adicionar city e state em user_settings (se ainda não existirem):
 * ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS city  TEXT;
 * ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS state TEXT;
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { Users, MapPin, BookOpen, Search, Globe, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Community {
  id: string
  name: string
  description: string
  city: string | null
  state: string | null
  genre: string
  member_count: number
  cover_url: string | null
}

// ── Static seed data — substitua por fetch ao Supabase quando a tabela existir ──
const MOCK_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Leitores de SP',
    description: 'Clube aberto para amantes de literatura em São Paulo. Nos reunimos todo mês para discutir um livro escolhido coletivamente.',
    city: 'São Paulo',
    state: 'SP',
    genre: 'Geral',
    member_count: 128,
    cover_url: null,
  },
  {
    id: '2',
    name: 'Sci-Fi Paulistano',
    description: 'Para quem ama ficção científica, distopias e futurismo. Debates mensais online e presenciais no centro de SP.',
    city: 'São Paulo',
    state: 'SP',
    genre: 'Ficção Científica',
    member_count: 74,
    cover_url: null,
  },
  {
    id: '3',
    name: 'Filosofia & Café — RJ',
    description: 'Leitura de clássicos da filosofia com debates no estilo socrático. Todo sábado, 10h, Leblon.',
    city: 'Rio de Janeiro',
    state: 'RJ',
    genre: 'Filosofia',
    member_count: 53,
    cover_url: null,
  },
  {
    id: '4',
    name: 'Clube do Romance — BH',
    description: 'Romances nacionais e internacionais. Belo Horizonte e região.',
    city: 'Belo Horizonte',
    state: 'MG',
    genre: 'Romance',
    member_count: 41,
    cover_url: null,
  },
  {
    id: '5',
    name: 'Leitores Online Brasil',
    description: 'Clube 100% online, sem restrição de cidade. Encontros semanais por vídeo.',
    city: null,
    state: null,
    genre: 'Geral',
    member_count: 312,
    cover_url: null,
  },
]

const genreColors: Record<string, string> = {
  'Geral': 'bg-brand-accent/15 text-brand-accent',
  'Ficção Científica': 'bg-violet-500/15 text-violet-400',
  'Filosofia': 'bg-amber-500/15 text-amber-400',
  'Romance': 'bg-rose-500/15 text-rose-400',
}

function CommunityCard({ community, joined, onJoin }: {
  community: Community
  joined: boolean
  onJoin: () => void
}) {
  const genreClass = genreColors[community.genre] ?? 'bg-slate-700 text-slate-300'
  const isOnline = !community.city

  return (
    <div className="bg-brand-primary border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-brand-accent" />
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${genreClass}`}>
          {community.genre}
        </span>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-slate-100 leading-tight">{community.name}</h3>
        <p className="text-sm text-brand-text mt-1 line-clamp-2">{community.description}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          {isOnline
            ? <><Globe className="w-3.5 h-3.5" /> Online</>
            : <><MapPin className="w-3.5 h-3.5" /> {community.city}, {community.state}</>}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {community.member_count} membros
        </span>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={onJoin}
        className={`mt-auto w-full py-2 rounded-xl text-sm font-medium transition-colors ${
          joined
            ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/25'
            : 'bg-brand-accent text-white hover:bg-sky-500'
        }`}
      >
        {joined ? 'Participando' : 'Entrar no clube'}
      </button>
    </div>
  )
}

export default function CommunitiesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'local' | 'all'>('local')
  const [joined, setJoined] = useState<Set<string>>(new Set())

  // When user has a city, default to local filter; otherwise show all
  useEffect(() => {
    if (!user?.city) setFilter('all')
  }, [user?.city])

  const userCity = user?.city?.toLowerCase().trim() ?? ''

  const visible = MOCK_COMMUNITIES.filter((c) => {
    const matchesSearch =
      search.trim() === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.genre.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === 'all' ||
      c.city === null || // online clubs always shown in local filter
      c.city.toLowerCase().trim() === userCity

    return matchesSearch && matchesFilter
  })

  const toggleJoin = (id: string) => {
    setJoined((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Comunidades</h1>
        <p className="text-brand-text text-sm mt-1">
          Clubes de leitura para conectar leitores com interesses em comum.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar comunidade ou gênero…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-primary border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <div className="flex rounded-xl border border-slate-700 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setFilter('local')}
            disabled={!userCity}
            title={!userCity ? 'Defina sua cidade nas configurações' : undefined}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              filter === 'local'
                ? 'bg-brand-accent text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {userCity ? `${user?.city}, ${user?.state}` : 'Minha cidade'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-brand-accent text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Todas
          </button>
        </div>
      </div>

      {/* City prompt */}
      {!userCity && (
        <a
          href="/settings"
          className="flex items-center justify-between gap-3 bg-brand-accent/10 border border-brand-accent/25 rounded-2xl px-5 py-4 mb-6 hover:bg-brand-accent/15 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-accent shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-200">Adicione sua cidade</p>
              <p className="text-xs text-brand-text">Veja clubes de leitura perto de você.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-accent group-hover:translate-x-0.5 transition-transform" />
        </a>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-brand-text">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma comunidade encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              joined={joined.has(c.id)}
              onJoin={() => toggleJoin(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
