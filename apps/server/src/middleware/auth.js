import { supabase } from '../lib/supabase.js'

/**
 * Middleware Fastify — valida o JWT do Supabase enviado pelo App.
 * Injeta request.userId para uso nos handlers.
 */
export async function requireAuth(request, reply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido.' })
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return reply.status(401).send({ error: 'Token inválido ou expirado.' })
  }

  request.userId = user.id
}
