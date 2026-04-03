# LeIA Mobile — Guia do Desenvolvedor

App em **Expo / React Native** (TypeScript). Autenticação via Supabase (magic link OTP). Roteamento com Expo Router v4 (file-based).

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

### Library API (AWS Lambda em prod — `BACKEND_URL`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/library/books` | Lista paginada com filtros | Não |
| `GET` | `/library/books/:id` | Detalhe completo + edições | Não |
| `GET` | `/library/pillars` | Lista todos os pilares + categorias | Não |
| `GET` | `/library/pillars/:id` | Detalhe do pilar + categorias + livros | Não |
| `GET` | `/library/categories/:id` | Livros da categoria agrupados por tag | Não |
| `GET` | `/library/favorites` | Livros salvos do usuário | **Bearer** |
| `POST` | `/library/favorites` | Salvar livro | **Bearer** |
| `PATCH` | `/library/favorites/:savedBookId` | Atualizar status / páginas / notas | **Bearer** |
| `DELETE` | `/library/favorites/:savedBookId` | Remover livro salvo | **Bearer** |

Query params de `/library/books`: `search`, `pillar_id`, `category_id`, `tags` (csv), `limit` (máx 50), `offset`.

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
| `useBooks` | `hooks/useBooks.ts` | Listagem paginada + infinite scroll + `useBookDetail` |
| `useSavedBooks` | `hooks/useSavedBooks.ts` | CRUD de favoritos com **optimistic updates** |
| `useChat` | `hooks/useChat.ts` | Envio de mensagens e histórico por sessão |
| `useChatSessions` | `hooks/useChatSessions.ts` | Lista de sessões do chat |
| `usePillars` | `hooks/usePillars.ts` | Pilares e categorias |
| `usePomodoro` | `hooks/usePomodoro.ts` | Lógica do cronômetro (focus/break) |
| `usePomodoroSettings` | `hooks/usePomodoroSettings.ts` | Durações, streak, meta diária → `user_settings` |
| `useUserContent` | `hooks/useUserContent.ts` | is_favourite / is_read nos cards do chat |
| `useInsights` | `hooks/useInsights.ts` | Estatísticas de leitura |
| `useMedals` | `hooks/useMedals.ts` | Sistema de medalhas |
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
| `user_settings` | `id` (user_id), `display_name`, `username`, `avatar_url`, `bio`, `theme`, `pomodoro_*`, `current_streak` | Direto via Supabase client |
| `chat_messages` | `user_id`, `role`, `content`, `session_id`, `created_at` | Via Chat Server |
| `saved_books` | `saved_book_id`, `user_id`, `edition_id`, `saved_as`, `pages_read`, `notes` | Via Library API |
| `books` | `book_id`, `title`, `author`, `difficulty`, `tags[]`, `category_id` | Via Library API |
| `book_editions` | `edition_id`, `book_id`, `cover_url`, `amazon_link`, `publisher` | Via Library API |
| `pillars` | `pillar_id`, `pillar_name` | Via Library API |
| `categories` | `category_id`, `pillar_id`, `category_name` | Via Library API |
| `user_content` | `user_id`, `card_id`, `is_favourite`, `is_read` | Direto via Supabase client |

> **Atenção:** a coluna é `is_favourite` (grafia britânica). Qualquer código que use
> `is_favorite` (grafia americana) está com bug.

---

## Débito Técnico Conhecido

| Item | Localização | Descrição |
|---|---|---|
| Dois clientes HTTP | `lib/apiClient.ts` e `services/api.ts` | Mesma lógica duplicada (fetch vs axios). Migrar tudo para `apiClient.ts`. |
| `user_content` vs `saved_books` | `useUserContent.ts` | Gerencia cards do chat; `useSavedBooks` gerencia livros do acervo. São tabelas diferentes, não confundir. |
| Fontes no chat | `useChat.ts` | `sources` são cards do Bibliotecário (tabela `cards`), não livros do acervo (tabela `books`). |
