import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import booksRouter       from './routes/books'
import savedBooksRouter  from './routes/savedBooks'
import insightsRouter    from './routes/insights'
import socialRouter      from './routes/social'
import userContentRouter from './routes/userContent'

/**
 * Factory: configura e retorna o app Express sem iniciar o listener.
 * Usada tanto pelo servidor local (index.ts) quanto pelo handler Lambda (lambda.ts).
 */
export function buildApp() {
  const app = express()

  // ── Security & parsing ──────────────────────────────────────────────────────
  app.use(helmet())
  app.use(express.json())

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
        cb(new Error(`CORS blocked: ${origin}`))
      },
      credentials: true,
    })
  )

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/books',        booksRouter)
  app.use('/saved-books',  savedBooksRouter)
  app.use('/insights',     insightsRouter)
  app.use('/social',       socialRouter)
  app.use('/user-content', userContentRouter)

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ ok: true }))

  return app
}
