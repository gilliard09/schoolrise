import { createClient } from '@supabase/supabase-js'

// Estas variáveis devem estar no seu arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Criação do cliente único para ser usado em toda a aplicação
export const supabase = createClient(supabaseUrl, supabaseAnonKey)