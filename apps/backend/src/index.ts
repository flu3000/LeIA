import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import booksRouter       from './routes/books'
import savedBooksRouter  from './routes/savedBooks'
import insightsRouter    from './routes/insights'
import socialRouter      from './routes/social'
import userContentRouter from './routes/userContent'

const app = express()

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet())
app.use(express.json())

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman) in development
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
  })
)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/books',        booksRouter)
app.use('/api/saved-books',  savedBooksRouter)
app.use('/api/insights',     insightsRouter)
app.use('/api/social',       socialRouter)
app.use('/api/user-content', userContentRouter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }))

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3002)
app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`)
})

export default app
