/**
 * lib/supabase.ts
 *
 * Helper centralizado para criação de clientes Supabase.
 * Substitui o createClient legado do @supabase/supabase-js.
 *
 * ─── Uso correto por contexto ────────────────────────────────────────────────
 *
 * Client Component ('use client'):
 *   import { getBrowserClient } from '@/lib/supabase'
 *   const supabase = useMemo(() => getBrowserClient(), [])
 *
 * Server Component / Route Handler / Server Action:
 *   import { getServerClient } from '@/lib/supabase'
 *   const supabase = await getServerClient()
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Client Component ─────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'

/**
 * Retorna um cliente Supabase para uso em Client Components.
 * Sempre envolva em useMemo para evitar recriação a cada render:
 *   const supabase = useMemo(() => getBrowserClient(), [])
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─── Server Component / Route Handler ────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Retorna um cliente Supabase para uso em Server Components,
 * Route Handlers e Server Actions.
 * Lida com cookies automaticamente para manter a sessão SSR.
 */
export async function getServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// ─── Nota sobre o cliente legado ──────────────────────────────────────────────
//
// O createClient do @supabase/supabase-js foi REMOVIDO intencionalmente.
// Ele não gerencia cookies e quebra a autenticação SSR no App Router.
//
// Se você encontrar imports assim em algum arquivo:
//   import { supabase } from '@/lib/supabase'
//
// Substitua por:
//   // Client Component
//   const supabase = useMemo(() => getBrowserClient(), [])
//
//   // Server Component
//   const supabase = await getServerClient()