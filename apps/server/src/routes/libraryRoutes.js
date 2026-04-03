import { requireAuth } from '../middleware/auth.js'
import {
  getBooks,
  getBookById,
  getPillars,
  getPillarById,
  getCategoryById,
  getFavorites,
  saveBook,
  updateFavorite,
  unsaveBook,
} from '../services/libraryService.js'

export async function libraryRoutes(app) {
  // ── Acervo ──────────────────────────────────────────────────────────────────

  /**
   * GET /library/books
   * Query params: search, pillar_id, category_id, tags (csv), limit, offset
   */
  app.get('/library/books', async (request, reply) => {
    const { search, pillar_id, category_id, tags, limit, offset } = request.query
    try {
      const result = await getBooks({ search, pillar_id, category_id, tags, limit, offset })
      return reply.send(result)
    } catch (err) {
      app.log.error('[GET /library/books]', err)
      return reply.status(500).send({ error: 'Erro ao buscar livros.' })
    }
  })

  /**
   * GET /library/books/:id
   * Retorna detalhes completos do livro + todas as edições
   */
  app.get('/library/books/:id', async (request, reply) => {
    const { id } = request.params
    try {
      const book = await getBookById(id)
      return reply.send(book)
    } catch (err) {
      app.log.error('[GET /library/books/:id]', err)
      const status = err.code === 'PGRST116' ? 404 : 500
      const message = status === 404 ? 'Livro não encontrado.' : 'Erro ao buscar livro.'
      return reply.status(status).send({ error: message })
    }
  })

  // ── Pilares ──────────────────────────────────────────────────────────────────

  /**
   * GET /library/pillars
   * Lista todos os pilares com suas categorias
   */
  app.get('/library/pillars', async (_request, reply) => {
    try {
      const pillars = await getPillars()
      return reply.send(pillars)
    } catch (err) {
      app.log.error('[GET /library/pillars]', err)
      return reply.status(500).send({ error: 'Erro ao buscar pilares.' })
    }
  })

  /**
   * GET /library/pillars/:id
   * Detalhes do pilar + categorias com livros + livros em destaque
   */
  app.get('/library/pillars/:id', async (request, reply) => {
    const { id } = request.params
    try {
      const pillar = await getPillarById(id)
      return reply.send(pillar)
    } catch (err) {
      app.log.error('[GET /library/pillars/:id]', err)
      const status = err.code === 'PGRST116' ? 404 : 500
      return reply.status(status).send({ error: 'Pilar não encontrado.' })
    }
  })

  // ── Categorias ────────────────────────────────────────────────────────────────

  /**
   * GET /library/categories/:id
   * Livros da categoria agrupados por tags
   */
  app.get('/library/categories/:id', async (request, reply) => {
    const { id } = request.params
    try {
      const result = await getCategoryById(id)
      return reply.send(result)
    } catch (err) {
      app.log.error('[GET /library/categories/:id]', err)
      const status = err.code === 'PGRST116' ? 404 : 500
      return reply.status(status).send({ error: 'Categoria não encontrada.' })
    }
  })

  // ── Favoritos (requerem autenticação) ────────────────────────────────────────

  /**
   * GET /library/favorites
   * Livros salvos do usuário autenticado (com join completo)
   */
  app.get('/library/favorites', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const favorites = await getFavorites(request.userId)
      return reply.send(favorites)
    } catch (err) {
      app.log.error('[GET /library/favorites]', err)
      return reply.status(500).send({ error: 'Erro ao buscar favoritos.' })
    }
  })

  /**
   * POST /library/favorites
   * Body: { edition_id: string, saved_as?: 'a ler' | 'lendo' | 'lido' }
   * Se a edição já estiver salva, atualiza o status.
   */
  app.post('/library/favorites', { preHandler: requireAuth }, async (request, reply) => {
    const { edition_id, saved_as } = request.body ?? {}
    if (!edition_id) {
      return reply.status(400).send({ error: 'edition_id é obrigatório.' })
    }
    const validStatus = ['a ler', 'lendo', 'lido']
    if (saved_as && !validStatus.includes(saved_as)) {
      return reply.status(400).send({ error: `saved_as deve ser um de: ${validStatus.join(', ')}.` })
    }
    try {
      const result = await saveBook(request.userId, edition_id, saved_as)
      return reply.status(201).send(result)
    } catch (err) {
      app.log.error('[POST /library/favorites]', err)
      return reply.status(500).send({ error: 'Erro ao salvar livro.' })
    }
  })

  /**
   * PATCH /library/favorites/:savedBookId
   * Body: { saved_as?, pages_read?, notes? }
   * Atualiza status de leitura, progresso e notas.
   */
  app.patch('/library/favorites/:savedBookId', { preHandler: requireAuth }, async (request, reply) => {
    const { savedBookId } = request.params
    const { saved_as, pages_read, notes } = request.body ?? {}

    const validStatus = ['a ler', 'lendo', 'lido']
    if (saved_as && !validStatus.includes(saved_as)) {
      return reply.status(400).send({ error: `saved_as deve ser um de: ${validStatus.join(', ')}.` })
    }

    try {
      const result = await updateFavorite(savedBookId, request.userId, { saved_as, pages_read, notes })
      return reply.send(result)
    } catch (err) {
      app.log.error('[PATCH /library/favorites/:savedBookId]', err)
      const status = err.code === 'PGRST116' ? 404 : 500
      return reply.status(status).send({ error: 'Erro ao atualizar livro salvo.' })
    }
  })

  /**
   * DELETE /library/favorites/:savedBookId
   * Remove um livro da lista do usuário. Só o dono pode remover.
   */
  app.delete('/library/favorites/:savedBookId', { preHandler: requireAuth }, async (request, reply) => {
    const { savedBookId } = request.params
    try {
      await unsaveBook(savedBookId, request.userId)
      return reply.status(204).send()
    } catch (err) {
      app.log.error('[DELETE /library/favorites/:savedBookId]', err)
      return reply.status(500).send({ error: 'Erro ao remover livro salvo.' })
    }
  })
}
