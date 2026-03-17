# LeIA — Guia do Repositório

LeIA é uma plataforma de curadoria de conhecimento com IA. Um "Bibliotecário" inteligente recebe perguntas do usuário, consulta a API da Perplexity e retorna fontes curadas (livros, vídeos, podcasts, artigos) com links reais e níveis de dificuldade.

---

## Estrutura do Monorepo

Gerenciado com **Turborepo** + **pnpm workspaces**.

```
LeIA/
├── apps/
│   ├── server/      # Backend (Fastify) — único app com lógica implementada
│   ├── web/         # Frontend web (React + Vite + Tailwind CSS v4)
│   └── mobile/      # App mobile (Expo/React Native) — ainda no template padrão
├── packages/
│   ├── ui/                  # Componentes React compartilhados (stub)
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
    │   └── bibliotecario.js          # SYSTEM_PROMPT enviado à API da IA
    ├── routes/
    │   ├── bibliotecaRoutes.js       # POST /buscar
    │   └── userRoutes.js             # POST /interagir, GET /biblioteca/:userId
    ├── controllers/
    │   └── bibliotecaController.js   # Handler de /buscar
    └── services/
        └── bibliotecaService.js      # Lógica principal (conversa + curadoria)
```

### Variáveis de ambiente necessárias

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `PERPLEXITY_API_KEY` | Chave da API Perplexity |
| `PORT` | Porta do servidor (padrão: 3001) |

### Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/buscar` | Envia mensagem ao Bibliotecário; retorna fontes curadas |
| `POST` | `/interagir` | Favorita ou marca um card como lido |
| `GET` | `/biblioteca/:userId` | Retorna favoritos e lidos do usuário |

### Fluxo de `/buscar`

1. Busca as últimas 6 mensagens do histórico no Supabase (`chat_messages`)
2. Verifica se já existem 5+ cards relevantes no banco (`cards`) via full-text search
3. Se houver cache suficiente, retorna direto do banco (`origem: 'cache_db'`)
4. Caso contrário, chama a Perplexity API (modelo `sonar`) com o histórico + SYSTEM_PROMPT
5. Salva a nova troca de mensagens em `chat_messages`
6. Faz upsert dos novos cards em `cards` (conflito por `link`)
7. Retorna o JSON da IA

### Schema do JSON retornado pela IA

```json
{
  "tema_identificado": "string",
  "guia_contextual": "string (2-4 frases humanizadas)",
  "fontes": [
    {
      "id_externo": "string",
      "tipo": "livro | video | podcast | artigo",
      "titulo": "string",
      "autor_canal": "string",
      "dificuldade": "Iniciante | Intermediário | Avançado",
      "link": "URL",
      "por_que_estudar": "string"
    }
  ]
}
```

### Tabelas Supabase

| Tabela | Colunas relevantes | Descrição |
|---|---|---|
| `chat_messages` | `user_id`, `role`, `content`, `created_at` | Histórico de conversa |
| `cards` | `link` (unique), `titulo`, `tipo`, `autor_canal`, `dificuldade`, ... | Fontes curadas |
| `user_content` | `user_id`, `card_id`, `is_favorite`, `is_read` | Interações do usuário com cards |

---

## apps/web

Frontend em **React + Vite + Tailwind CSS v4** (TypeScript). Stack: React Router v6, Lucide React.

```
apps/web/src/
├── App.tsx                          # BrowserRouter + rotas + ProtectedRoute
├── main.tsx                         # StrictMode > AuthProvider > AppProvider > App
├── index.css                        # @import "tailwindcss" + @theme com paleta Oxford Modern
├── components/
│   ├── ui/
│   │   ├── Button.tsx               # Botão reutilizável (variant: primary/secondary/ghost; size: sm/md/lg)
│   │   └── Input.tsx                # Input com label, error e forwardRef
│   ├── layout/
│   │   ├── Layout.tsx               # Wrapper: Sidebar + <Outlet> + MobileNav
│   │   ├── Sidebar.tsx              # Nav lateral desktop — retrátil (ver seção abaixo)
│   │   └── MobileNav.tsx            # Nav inferior fixa (mobile, 5 itens)
│   ├── chat/
│   │   └── ChatMessage.tsx          # Bolhas de chat; cards de fontes clicáveis com dificuldade
│   └── ReferenceOfTheDay.tsx        # Sidebar/hero com citação + livro recomendado do dia
├── pages/
│   ├── LoginPage.tsx                # Tela cheia de login/cadastro (fora do Layout, rota pública)
│   ├── ChatPage.tsx                 # Chat principal + ReferenceOfTheDay em sidebar (lg)
│   ├── TopicsPage.tsx               # Grid de 8 temas com referências bibliográficas e favoritos
│   ├── LibraryPage.tsx              # Tabs: "Consultar Temas" / "Materiais Salvos" com filtros
│   ├── PomodoroPage.tsx             # Timer SVG circular, durações configuráveis, contador de sessões
│   └── ProfilePage.tsx              # Perfil do usuário: avatar, stats, settings, logout
├── hooks/
│   ├── usePomodoro.ts               # Lógica do cronômetro (auto-troca foco↔pausa, durações editáveis)
│   └── useChat.ts                   # Estado do chat + mock da API (conectar ao POST /buscar)
└── context/
    ├── AuthContext.tsx              # user, login(), register(), loginWithOAuth(), logout() + localStorage
    └── AppContext.tsx               # savedCards, saveCard(), toggleRead(), toggleFavorite()
```

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
- **Transição suave:** a largura usa `transition-all duration-300`; os labels usam `opacity` + `max-width` animados com o mesmo `duration-300` para evitar corte abrupto de texto

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
| `/library` | `LibraryPage` | Requer auth |
| `/pomodoro` | `PomodoroPage` | Requer auth |
| `/profile` | `ProfilePage` | Requer auth |

### AuthContext

Mock de autenticação com persistência em `localStorage` (`portal_user`).
- `login(email, password)`, `register(name, email, password)`, `loginWithOAuth(provider: 'google' | 'apple')` simulam 900–1100ms de latência.
- **TODO:** substituir pelas chamadas reais ao Supabase Auth (`@supabase/supabase-js`).

### usePomodoro

Cronômetro com durações configuráveis.
- `durations: { focus: number, break: number }` — padrão `{ focus: 25, break: 5 }`, máximo 90 min
- `setDuration(mode, minutes)` — atualiza duração; sincroniza `timeLeft` se o modo estiver ativo e pausado
- Auto-troca de modo ao fim do tempo; incrementa `sessions` ao completar um ciclo de foco
- `PomodoroPage` expõe painel de configuração com `DurationStepper` (botões +/− e input numérico manual)

### useChat

O hook envia mensagens mock com delay. **TODO:** substituir `mockResponse()` por chamada real ao `POST /buscar` no `apps/server`.

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
| `packages/ui` | `@repo/ui` | Componentes compartilhados (Button, Card, Code) |
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
