# LeIA Mobile — Guia do Desenvolvedor

App em **Expo / React Native** (TypeScript). Autenticação via Supabase (magic link OTP). Roteamento com Expo Router v6 (file-based).

---

## Mapa de Navegação (Expo Router)

```
app/
├── _layout.tsx              ← RootLayout: AuthProvider + Gatekeeper de rota
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx            ← Tela de entrada (magic link)
│   ├── onboarding.tsx       ← Coleta username (obrigatório antes de usar o app)
│   └── forgot-password.tsx
├── (app)/
│   ├── _layout.tsx          ← Tab navigator (5 abas)
│   ├── index.tsx            ← Home / Library (tab 1)
│   ├── chat.tsx             ← Chat com o Bibliotecário (tab 2)
│   ├── topics.tsx           ← Tópicos / Pilares (tab 3)
│   ├── pomodoro.tsx         ← Timer Pomodoro (tab 4)
│   ├── profile.tsx          ← Perfil do usuário (tab 5)
│   ├── library.tsx          ← Acervo completo
│   └── social.tsx           ← Social / Rankings
├── topic/[id].tsx           ← Detalhe de tópico (modal card)
├── insights.tsx             ← Insights do usuário (modal card)
└── library/
    ├── book/[id].tsx        ← Detalhe do livro (modal card)
    ├── pillar/[id].tsx      ← Detalhe do pilar
    └── category/[id].tsx   ← Detalhe da categoria
```

### Lógica de Gatekeeper (app/_layout.tsx)

O `RootLayoutNav` decide a rota inicial **depois** de todos os portões fecharem:
- `isLoading` (AuthContext) — sessão + perfil do Supabase confirmados
- `isProcessingLink` — deep link de magic link processado
- `fontsLoaded` — ClashDisplay carregada

Suporte a deep link de autenticação:
- **Implicit flow** (`#access_token=...&refresh_token=...`) — extrai tokens do fragmento da URL e chama `supabase.auth.setSession()`
- **PKCE** (`?code=...`) — chama `supabase.auth.exchangeCodeForSession()`
- Timeout de 1,5s para aguardar deep link antes de decidir rota (race condition safety)
- Retry com backoff de 500ms (até 3 tentativas) se `setSession` falhar; fallback para `getSession()` em erros de rede

Fluxo de decisão:
```
sem usuário          → /(auth)/login
usuário sem username → /(auth)/onboarding
usuário com perfil   → /(app)
```

---

## Clientes de API

Existem **dois clientes** (atenção ao usar qual):

### `src/lib/apiClient.ts` — cliente principal (fetch nativo)
```typescript
import { api, chatApi } from '@/src/lib/apiClient'

// api      → EXPO_PUBLIC_BACKEND_URL (AWS Lambda em prod, port 3002 em dev)
// chatApi  → EXPO_PUBLIC_CHAT_URL    (Fastify local port 3001)
```
- Detecta IP da máquina via `Constants.expoConfig?.hostUri` (funciona em dispositivo físico)
- Injeta `Authorization: Bearer <token>` automaticamente em toda requisição
- **Use este para hooks novos**

### `src/services/api.ts` — cliente legado (axios)
- Mesma lógica, mas com axios. Mantido por compatibilidade com código antigo.
- **Não crie novos hooks usando este**; migre para `apiClient.ts` quando tocar nos arquivos.

---

## Endpoints da API

### Chat Server (Fastify — `CHAT_URL`, port 3001)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/chat` | Envia mensagem ao Bibliotecário (Perplexity) | Não |
| `GET` | `/api/chat/sessions/:sessionId/messages` | Histórico da sessão | Não |
| `DELETE` | `/api/chat/:userId` | Limpa histórico do usuário | Não |

Body do `POST /api/chat`:
```json
{ "mensagem": "string", "userId": "uuid", "historico": [], "sessionId": "string" }
```

### Library API (Express + TypeScript — `BACKEND_URL`, port 3002 em dev, AWS Lambda em prod)

Todas as rotas autenticadas exigem `Authorization: Bearer <token>`.

#### Livros
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/books/getAll` | Lista paginada com filtros | Não |
| `GET` | `/books/getById/:bookId` | Detalhe completo + todas as edições | Não |

Query params de `/books/getAll`: `search`, `category_id`, `difficulty`, `page` (paginação de 20 por página).
> **Atenção:** A busca textual (`search`) é feita em JavaScript após fetch do banco (filtra por título, autor, ISBN, editora). A paginação é manual pós-filtragem.

#### Livros Salvos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/saved-books/:userId` | Livros salvos do usuário (ordenados por `created_at` desc) | **Bearer** |
| `PUT` | `/saved-books/:bookId` | Upsert: salvar ou atualizar status/páginas/notas | **Bearer** |
| `DELETE` | `/saved-books/:bookId` | Remover livro salvo | **Bearer** |

Body do `PUT /saved-books/:bookId` (validado com Zod):
```json
{ "saved_as": "a ler | lendo | lido", "pages_read": 0, "notes": "" }
```
Upsert por `onConflict: 'user_id,book_id'`.

#### Pilares e Categorias
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/library/pillars` | Lista todos os pilares + categorias | Não |
| `GET` | `/library/pillars/:id` | Detalhe do pilar + categorias + livros | Não |
| `GET` | `/library/categories/:id` | Livros da categoria agrupados por tag | Não |

#### Pomodoro
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/pomodoro/settings` | Durações, streak, sessões hoje, meta diária | **Bearer** |
| `PUT` | `/pomodoro/settings` | Atualizar focus/break durations | **Bearer** |
| `PUT` | `/pomodoro/goal` | Atualizar meta diária (1–20 sessões) | **Bearer** |
| `POST` | `/pomodoro/sessions` | Registrar sessão completa (calcula streak + XP) | **Bearer** |

Body do `POST /pomodoro/sessions`:
```json
{ "durationMinutes": 25, "maintainedFocus": true }
```
Resposta: `{ streak, sessionsToday, goalJustReached, xpGained }`.

XP = `(durationMinutes / 5) * 10`, multiplicado por `1.5` se `maintainedFocus === true`.

#### Perfil do Usuário
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/user/` | Dados do perfil (auth + user_settings) | **Bearer** |
| `PUT` | `/user/` | Atualizar perfil | **Bearer** |

Erro `USERNAME_TAKEN` (HTTP 409) se username já existir.

#### Outras Rotas
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/insights` | Analytics do usuário | **Bearer** |
| `GET/POST` | `/social` | Rankings, comunidades, follows | **Bearer** |
| `GET/POST` | `/medals` | Conquistas | **Bearer** |
| `GET/PUT` | `/userContent` | Favoritar fontes do chat | **Bearer** |

---

## Variáveis de Ambiente

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_CHAT_URL=http://<IP_DA_MAQUINA>:3001   # chat server local
EXPO_PUBLIC_BACKEND_URL=https://...amazonaws.com/  # library API (prod)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

> **Regra de ouro:** nunca use `localhost` em requisições mobile. Use o IP da máquina
> ou deixe o `apiClient.ts` detectar via `hostUri` (funciona automaticamente com `--lan`).

---

## Hooks e Responsabilidades

| Hook | Arquivo | Responsabilidade |
|---|---|---|
| `useAuth` | `context/AuthContext.tsx` | Sessão Supabase, signIn OTP, logout, updateProfile |
| `useBooks` | `hooks/useBooks.ts` | Listagem paginada + infinite scroll via `GET /books/getAll`; também exporta `useBookDetail` |
| `useSavedBooks` | `hooks/useSavedBooks.ts` | CRUD de livros salvos com **optimistic updates** via `PUT/DELETE /saved-books` |
| `useChat` | `hooks/useChat.ts` | Envio de mensagens e histórico por sessão via Chat Server |
| `useChatSessions` | `hooks/useChatSessions.ts` | Lista de sessões do chat |
| `usePillars` | `hooks/usePillars.ts` | Pilares, categorias e detalhes via `GET /library/pillars` |
| `usePomodoro` | `hooks/usePomodoro.ts` | Cronômetro local (focus/break); detecta app em background como anti-cheat |
| `usePomodoroSettings` | `hooks/usePomodoroSettings.ts` | Durações, streak, meta diária via `/pomodoro/settings` e `/pomodoro/sessions` |
| `useUserContent` | `hooks/useUserContent.ts` | is_favourite / is_read nos cards do chat (tabela `user_content`, Supabase direto) |
| `useInsights` | `hooks/useInsights.ts` | Analytics do usuário via `GET /insights` |
| `useMedals` | `hooks/useMedals.ts` | Sistema de medalhas via `GET /medals` |
| `useFollow` | `hooks/useFollow.ts` | Social: seguir/deixar de seguir |

### Padrão de Optimistic Update (usar em todos os hooks de mutação)

```typescript
// 1. Atualiza o estado local imediatamente
setState((prev) => applyChange(prev))

try {
  // 2. Confirma no servidor
  await api.patch('/resource/id', payload)
} catch (e) {
  // 3. Reverte se falhar
  refetch()
  throw e
}
```

### Padrão de Estado de Carregamento

```typescript
const [isLoading, setIsLoading]   = useState(true)   // carga inicial
const [isSyncing, setIsSyncing]   = useState(false)  // re-fetch em background
const [error, setError]           = useState<string | null>(null)
```

---

## Tipos Centrais

### `src/types/auth.ts`
- `User` — usuário autenticado (inclui `hasCompletedProfile`)
- `UpdateProfilePayload` — campos aceitos por `updateProfile()`

### `src/types/library.ts`
- `Pillar`, `Category`, `Book`, `Edition`, `SavedBook`
- `Difficulty`, `ReadStatus` — union types dos valores de banco
- `BookFilters`, `PillarDetail`, `CategoryDetail` — respostas da API

### `src/types/chat.ts`
- `Fonte`, `Message` — estrutura do chat

### `src/types/social.ts`
- Tipos da feature social

### `src/types/content.ts`
- Tipos de conteúdo curado (cards do chat)

---

## Guia de Estilo de Código

### Separação de responsabilidades
```
app/(app)/library.tsx   → UI apenas: renderiza, abre modais, navega
src/screens/library/    → Screens complexas com lógica de UI local
src/hooks/              → Toda lógica de dados (fetch, mutação, estado)
src/services/           → Chamadas de API puras (sem estado React)
src/types/              → Interfaces TypeScript (sem lógica)
```

### Regras obrigatórias
- **Nunca** chame `fetch`/`api` diretamente em uma Screen ou componente — use um hook
- **Sempre** use `api` de `@/src/lib/apiClient` (não de `@/src/services/api`)
- **Sempre** use `maybeSingle()` no Supabase quando o resultado pode ser `null` (nunca `single()` nessas situações)
- **Nunca** use `.catch()` encadeado no Supabase — use destructuring `{ data, error }`
- TypeScript estrito: sem `any`, sem `as unknown as Foo` sem comentário justificando

### Componentes
- Arquivos de Screen: exportação `default` nomeada (ex: `export default function LibraryScreen`)
- Componentes reutilizáveis em `src/components/` (sem lógica de dados)
- Componentes de domínio (ex: `BookCard`) dentro do diretório da feature

---

## Tabelas Supabase (usadas pelo mobile)

| Tabela | Colunas chave | Acesso |
|---|---|---|
| `user_settings` | `id` (user_id), `display_name`, `username`, `avatar_url`, `bio`, `theme`, `pomodoro_focus_time`, `pomodoro_break_time`, `daily_sessions_goal`, `current_streak`, `last_session_date`, `sessions_completed_today` | Direto via Supabase client (auth/perfil) e via Library API (pomodoro) |
| `user_stats` | `user_id`, `total_xp`, `sessions_count`, `focused_sessions` | Via Library API (`POST /pomodoro/sessions`) |
| `chat_messages` | `user_id`, `role`, `content`, `session_id`, `created_at` | Via Chat Server |
| `saved_books` | `saved_book_id`, `user_id`, `edition_id`, `saved_as`, `pages_read`, `notes`, `created_at`, `updated_at` | Via Library API |
| `books` | `book_id`, `title`, `author`, `difficulty`, `tags[]`, `category_id`, `description`, `best_seller_edition` | Via Library API |
| `book_editions` | `edition_id`, `book_id`, `cover_url`, `amazon_link`, `publisher`, `pages`, `publish_year`, `translator`, `isbn_13`, `isbn_10`, `language`, `sales_rank`, `is_best_seller` | Via Library API |
| `pillars` | `pillar_id`, `pillar_name` | Via Library API |
| `categories` | `category_id`, `pillar_id`, `category_name` | Via Library API |
| `user_content` | `user_id`, `card_id`, `is_favourite`, `is_read` | Direto via Supabase client |

> **Atenção:** a coluna é `is_favourite` (grafia britânica). Qualquer código que use
> `is_favorite` (grafia americana) está com bug.

> **Não confundir `user_content` com `saved_books`:** `user_content` guarda interações com
> cards do Bibliotecário (chat); `saved_books` guarda livros do acervo. São tabelas distintas.

---

## Débito Técnico Conhecido

| Item | Localização | Descrição |
|---|---|---|
| Dois clientes HTTP | `lib/apiClient.ts` e `services/api.ts` | Mesma lógica duplicada (fetch vs axios). Migrar tudo para `apiClient.ts`. |
| Busca de livros em JS | `backend/src/routes/books.ts` | Filtragem por `search` é feita em JS após fetch completo; paginação manual pós-filtro. Pode ser lento com volume alto. |
| Seleção de edição comentada | `src/screens/library/BookDetailScreen.tsx` | Modal de seleção de edição está parcialmente implementado/comentado. |
