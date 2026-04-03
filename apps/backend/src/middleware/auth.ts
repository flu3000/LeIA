import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido ou inválido' })
    return
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Usuário não autorizado' })
    return
  }

  (req as any).user = user

  next()
}
