import type { User } from '@supabase/supabase-js'

declare namespace Express {
  interface Request {
    userId: string
    supabaseUser: User
  }
}
