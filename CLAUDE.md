# LeIA — Guia do Repositório

LeIA é uma plataforma de curadoria de conhecimento com IA. Um "Bibliotecário" inteligente recebe perguntas do usuário, consulta a API da Perplexity e retorna fontes curadas (livros, vídeos, podcasts, artigos) com links reais e níveis de dificuldade.

---

## Estrutura do Monorepo

Gerenciado com **Turborepo** + **pnpm workspaces**.

```
LeIA/
├── apps/
│   ├── server/      # Backend (Fastify) — lógica principal + integração Perplexity
│   ├── web/         # Frontend web (React + Vite + Tailwind CSS v4)
│   └── mobile/      # App mobile (Expo/React Native) — ainda no template padrão
├── packages/
│   ├── ui/                  # Componentes React compartilhados (stub, não usado)
│   ├── api-types/           # Tipos TypeScript compartilhados (desalinhados com implementação atual)
│   ├── eslint-config/       # Configs ESLint compartilhadas
│   └── typescript-config/   # tsconfig.json base compartilhado
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## apps/server

Backend em **Fastify** (JavaScript). Porta padrão: `3001`.

```
apps/server/
├── index.js                          # Entry point — registra CORS e rotas
└── src/
    ├── lib/
    │   └── supabase.js               # Cliente Supabase (usa SERVICE_ROLE_KEY)
    ├── prompts/
    │   └── bibliotecario.js          # SYSTEM_PROMPT enviado à API da Perplexity
    ├── routes/
    │   ├── bibliotecaRoutes.js       # POST /buscar (legado), POST /api/chat, GET+DELETE /api/chat/*
    │   └── userRoutes.js             # POST /interagir, GET /biblioteca/:userId (subutilizados)
    ├── controllers/
    │   └── bibliotecaController.js   # Handler delgado — chama conversarComBibliotecario()
    └── services/
        └── bibliotecaService.js      # Lógica principal (conversa + curadoria + cache)
```

### Variáveis de ambiente necessárias

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (acesso total) |
| `PERPLEXITY_API_KEY` | Chave da API Perplexity |
| `PORT` | Porta do servidor (padrão: 3001) |

### Rotas da API

| Método | Rota | Descrição | Status |
|---|---|---|---|
| `POST` | `/buscar` | Legado — chama o mesmo handler via controller | Legado |
| `POST` | `/api/chat` | Rota principal usada pelo frontend | **Ativa** |
| `GET` | `/api/chat/history/:userId` | Retorna últimas 20 mensagens do usuário | **Ativa** |
| `DELETE` | `/api/chat/:userId` | Limpa todo o histórico do usuário | **Ativa** |
| `POST` | `/interagir` | Favorita ou marca um card como lido | Subutilizada |
| `GET` | `/biblioteca/:userId` | Retorna favoritos e lidos do usuário | Subutilizada |

> **Nota:** O frontend acessa o Supabase diretamente via `useUserContent()` em vez de usar `/interagir` e `/biblioteca/:userId`.

### Fluxo de `/api/chat`

1. Busca as últimas **4** mensagens do histórico no Supabase (`chat_messages`); fallback para o histórico enviado pelo frontend
2. Detecta "quebra de tema" por palavras-chave para resetar o contexto
3. Valida alternância user/assistant para a Perplexity API
4. Verifica cache: se existem 5+ cards relevantes no banco (`cards`) via full-text search em `titulo`, retorna direto (`origem: 'cache_db'`)
5. Caso contrário, chama a Perplexity API (modelo `sonar`) com histórico + SYSTEM_PROMPT
6. Extrai JSON do bloco ` ```json-materials ``` ` da resposta
7. Faz upsert das mensagens em `chat_messages` (user + assistant)
8. Faz upsert dos novos cards em `cards` (conflito por `link`)
9. Retorna o JSON da IA + array `citations`

### Schema do JSON retornado pela IA

```json
{
  "tema_identificado": "string",
  "guia_contextual": "string (2-4 frases humanizadas)",
  "fontes": [
    {
      "id_externo": "string",
      "tipo": "livro | video | podcast | artigo | curso",
      "titulo": "string",
      "autor_canal": "string",
      "dificuldade": "Iniciante | Intermediário | Avançado",
      "link": "URL",
      "por_que_estudar": "string"
    }
  ],
  "citations": ["URL"]
}
```

### Tabelas Supabase

| Tabela | Colunas relevantes | Descrição |
|---|---|---|
| `chat_messages` | `user_id`, `role`, `content`, `created_at` | Histórico de conversa |
| `cards` | `link` (unique), `titulo`, `tipo`, `autor_canal`, `dificuldade`, ... | Fontes curadas |
| `user_content` | `user_id`, `card_id`, `is_favourite`, `is_read` | Interações do usuário com cards |
| `user_settings` | `id` (user_id), `pomodoro_focus_time`, `pomodoro_break_time`, `daily_sessions_goal`, `current_streak`, `last_session_date`, `sessions_completed_today`, `theme` | Configurações do Pomodoro, streak e tema |

> **Atenção:** A coluna é `is_favourite` (grafia britânica). O backend em `userRoutes.js` usa `is_favorite` (grafia americana) — há um mismatch que torna essa rota com comportamento incorreto.

---

## apps/web

Frontend em **React + Vite + Tailwind CSS v4** (TypeScript). Stack: React Router v6, Lucide React, `@supabase/supabase-js`.

```
apps/web/src/
├── App.tsx                          # BrowserRouter + rotas + ProtectedRoute
├── main.tsx                         # StrictMode > AuthProvider > ThemeProvider > AppProvider > App
├── index.css                        # @import "tailwindcss" + @theme com paleta Oxford Modern
├── services/
│   └── supabase.ts                  # Cliente Supabase (usa VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
├── data/
│   └── topics.ts                    # 8 temas estáticos com referencias, conceitos, estilos
├── components/
│   ├── ui/
│   │   ├── Button.tsx               # Botão reutilizável (variant: primary/secondary/ghost; size: sm/md/lg)
│   │   └── Input.tsx                # Input com label, error e forwardRef
│   ├── layout/
│   │   ├── Layout.tsx               # Wrapper: Sidebar + <Outlet> + MobileNav
│   │   ├── Sidebar.tsx              # Nav lateral desktop — retrátil
│   │   └── MobileNav.tsx            # Nav inferior fixa (mobile, 5 itens)
│   ├── chat/
│   │   ├── ChatMessage.tsx          # Bolhas de chat; renderização markdown; exibe SourceCards
│   │   └── SourceCard.tsx           # Card individual de fonte (tipo, dificuldade, link, Amazon)
│   └── ReferenceOfTheDay.tsx        # Widget lateral com citação + livro recomendado do dia
├── pages/
│   ├── LoginPage.tsx                # Tela cheia de login/cadastro (fora do Layout, rota pública)
│   ├── ChatPage.tsx                 # Chat principal + ReferenceOfTheDay em sidebar (lg)
│   ├── TopicsPage.tsx               # Grid de 8 temas com busca e favoritos
│   ├── TopicDetailPage.tsx          # Detalhe de um tema: conceitos, filtros por tipo/dificuldade, referências
│   ├── LibraryPage.tsx              # Tabs: "Consultar Temas" / "Materiais Salvos" com filtros
│   ├── PomodoroPage.tsx             # Timer SVG circular, durações configuráveis, sync Supabase
│   └── ProfilePage.tsx              # Perfil do usuário: avatar, stats, settings, logout
├── hooks/
│   ├── useChat.ts                   # Chat: histórico, envio para /api/chat, persistência localStorage
│   ├── usePomodoro.ts               # Lógica do cronômetro; aceita callback onFocusComplete
│   ├── usePomodoroSettings.ts       # Durações + streak + meta diária no Supabase (user_settings)
│   └── useUserContent.ts            # Gerencia is_favourite e is_read via Supabase (user_content)
└── context/
    ├── AuthContext.tsx              # Supabase Auth real: login, register, OAuth, onAuthStateChange
    ├── ThemeContext.tsx             # Tema claro/escuro: aplica .light no <html>, persiste em user_settings
    └── AppContext.tsx               # savedCards legacy (não usado ativamente — ver useUserContent)
```

### Paleta de cores — Light Mode

Definida via `:root.light` em `index.css`. Aplicada ao `<html>` pela `ThemeContext`.

```css
:root.light {
  --color-brand-primary:   #FFFFFF;   /* cards e superfícies */
  --color-brand-secondary: #F1F5F9;   /* fundo das páginas */
  --color-brand-accent:    #0284C7;   /* azul mais saturado para contraste */
  --color-brand-text:      #64748B;   /* texto secundário */
}
```

Também sobrescreve as classes Tailwind hardcoded (ex: `text-slate-100`, `border-slate-700`) via seletores de maior especificidade fora de qualquer `@layer`.

### Variáveis de ambiente necessárias (web)

| Variável | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon pública do Supabase |
| `VITE_API_URL` | URL do servidor backend (padrão: `http://localhost:3001`) |

### Paleta de cores — Oxford Modern (Tailwind v4)

Definida via `@theme` em `apps/web/src/index.css`. **Não existe `tailwind.config.js`** — Tailwind v4 usa apenas CSS.

```css
@theme {
  --color-brand-primary:   #1E293B;  /* superfície de cards e sidebar */
  --color-brand-secondary: #0F172A;  /* fundo geral da app */
  --color-brand-accent:    #0EA5E9;  /* destaque principal (azul) */
  --color-brand-text:      #94A3B8;  /* texto secundário */
  --color-pomodoro-focus:  #E11D48;  /* vermelho — modo foco */
  --color-pomodoro-break:  #10B981;  /* verde — modo pausa */
}
```

Uso nos componentes: `bg-brand-primary`, `text-brand-accent`, `bg-pomodoro-focus`, etc.

### Sidebar retrátil (`Sidebar.tsx`)

- Estado local `collapsed: boolean` (padrão `false`)
- **Expandida:** `w-60` — mostra ícones + labels + nome/e-mail do usuário
- **Recolhida:** `w-16` — mostra apenas ícones centralizados; `title` nos links exibe tooltip nativo
- **Fechar:** botão `ChevronLeft` visível apenas quando expandida
- **Abrir:** clicar em qualquer parte da sidebar recolhida
- **Transição suave:** largura usa `transition-all duration-300`; labels usam `opacity` + `max-width` animados para evitar corte abrupto de texto

```tsx
// Classe aplicada a cada label/texto para fade suave:
const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ${
  collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-xs'
}`
```

### Rotas do frontend

| Rota | Componente | Proteção |
|---|---|---|
| `/login` | `LoginPage` | Pública (redireciona p/ `/` se já logado) |
| `/` | `ChatPage` | Requer auth |
| `/topics` | `TopicsPage` | Requer auth |
| `/topics/:id` | `TopicDetailPage` | Requer auth |
| `/library` | `LibraryPage` | Requer auth |
| `/pomodoro` | `PomodoroPage` | Requer auth |
| `/profile` | `ProfilePage` | Requer auth |

### AuthContext

Autenticação real via **Supabase Auth** (`@supabase/supabase-js`).
- `login(email, password)` → `signInWithPassword()`
- `register(name, email, password)` → `signUp()`
- `loginWithOAuth(provider: 'google' | 'apple')` → `signInWithOAuth()`
- `logout()` → `signOut()`
- `onAuthStateChange()` mantém sessão persistida automaticamente pelo Supabase

### useChat

Gerencia o estado do chat e integra com o backend real.
- Carrega histórico inicial via `GET /api/chat/history/:userId`
- Envia mensagens via `POST /api/chat` com `{ userId, message, history }`
- Persiste histórico no `localStorage` com debounce de 500ms como fallback
- Botão "Nova Conversa" chama `DELETE /api/chat/:userId` e limpa estado local

### useUserContent

Gerencia interações do usuário com cards diretamente no Supabase.
- `toggleSave(card)` → cria/atualiza linha em `user_content`, alterna `is_favourite`
- `toggleRead(cardId)` → cria/atualiza linha em `user_content`, alterna `is_read`
- `isFavourite(cardId)`, `isRead(cardId)`, `isSaved(cardId)` — queries locais

### usePomodoro + usePomodoroSettings

Cronômetro com durações configuráveis, gamificação por streak e persistência na nuvem.

**usePomodoro(onFocusComplete?)**
- `durations: { focus, break }` — padrão `{ focus: 25, break: 5 }`, máximo 90 min
- Auto-troca de modo ao fim do tempo; ao completar foco, chama `onFocusComplete()` via ref (sem stale closure)

**usePomodoroSettings** — lê e escreve em `user_settings`:
- `saveDurations(durations)` — upsert com debounce de 800ms; status: `idle | saving | saved | error`
- `saveDailyGoal(n)` — salva meta diária (1–20 sessões)
- `completeSession()` — lógica de streak:
  - `last_session_date === today` → incrementa `sessions_completed_today`
  - `last_session_date === yesterday` → `current_streak++`, `sessions_completed_today = 1`
  - Qualquer outra data → `current_streak = 1`, `sessions_completed_today = 1`
  - Datas comparadas em UTC (`toISOString().slice(0, 10)`) para evitar bugs de fuso horário
  - Quando `sessionsToday === dailyGoal`, seta `goalJustReached: true` (auto-limpa após 5s)

**PomodoroPage UI:**
- Cabeçalho: `🔥 {streak}` (badge âmbar, visível quando streak > 0)
- Progresso: "Sessões hoje X / Y" + barra `bg-brand-accent`
- Settings: `DurationStepper` (foco/pausa) + `GoalStepper` (meta diária)
- Celebração: toast deslizante na base da tela quando `goalJustReached`

### ThemeContext + useTheme

Gerencia tema claro/escuro com persistência dupla:
1. **localStorage** (`leia_theme`) → aplicado imediatamente no mount para evitar flash
2. **Supabase** `user_settings.theme` → sincronizado após autenticação

`applyTheme(t)` adiciona/remove a classe `.light` no `document.documentElement`.
`useTheme()` expõe `{ theme, setTheme }` para qualquer componente.
`ThemeProvider` é montado dentro de `AuthProvider` (precisa do usuário para sincronizar).

### data/topics.ts

8 temas estáticos hardcoded (não vêm do banco de dados):
- Cada tema tem: `id`, `tema`, `emoji`, `descricao`, `descricaoLonga`, `accentClass`, `conceitos[]`, `referencias[]`, `todasReferencias[]`
- Exporta também `tipoStyle` e `dificuldadeStyle` para estilização dos badges

---

## apps/mobile

App em **Expo/React Native** (TypeScript). Ainda é o template padrão do Expo — sem UI do LeIA implementada.

```
apps/mobile/
├── app/
│   ├── _layout.tsx
│   ├── modal.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       └── explore.tsx
├── components/
├── constants/
│   └── theme.ts
└── hooks/
```

---

## packages/

| Pacote | Nome npm | Descrição |
|---|---|---|
| `packages/ui` | `@repo/ui` | Componentes compartilhados (Button, Card, Code) — não usado pelo web |
| `packages/api-types` | `@repo/api-types` | Tipos `Fonte` e `RespostaBibliotecario` — desalinhados com o schema atual |
| `packages/eslint-config` | `@repo/eslint-config` | Configs ESLint (base, next, react-internal) |
| `packages/typescript-config` | `@repo/typescript-config` | tsconfigs base, nextjs, react-library |

---

## Comandos

```bash
# Rodar todos os apps em dev
pnpm dev

# Rodar apenas um app
pnpm turbo dev --filter=server
pnpm turbo dev --filter=web
pnpm turbo dev --filter=mobile

# Build
pnpm build

# Lint + type-check
pnpm lint
pnpm check-types
```

---

## TODOs / Débito técnico

| Item | Localização | Descrição |
|---|---|---|
| Mismatch coluna | `userRoutes.js` | Rota `/interagir` usa `is_favorite` mas a tabela tem `is_favourite` |
| Tipos desalinhados | `packages/api-types` | `Fonte` e `RespostaBibliotecario` não refletem o schema real retornado |
| AppContext legacy | `AppContext.tsx` | `saveCard/toggleRead/toggleFavorite` não são usados; `useUserContent` é o real |
| Temas estáticos | `data/topics.ts` | Os 8 temas são hardcoded em vez de virem do banco |
| Mobile não implementado | `apps/mobile` | Ainda é o template Expo sem UI do LeIA |
| `packages/ui` não usado | `packages/ui` | Web tem seus próprios componentes em `components/ui/` |
