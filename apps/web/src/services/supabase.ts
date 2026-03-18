import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error(
    '[LeIA] VITE_SUPABASE_URL não foi detectada pelo Vite.\n' +
    'Verifique se o arquivo apps/web/.env.local existe e reinicie o servidor de desenvolvimento.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
