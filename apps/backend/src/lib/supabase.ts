import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

// Service-role client: bypasses RLS — ownership must be enforced in query WHERE clauses
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
})
