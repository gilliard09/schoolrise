import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

// ─── Segurança: lista de rotas internas permitidas após login ─────────────────
const ALLOWED_NEXT_PATHS = [
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/comercial',
  '/',
]

function getSafeRedirect(next: string | null): string {
  if (!next) return '/dashboard'

  // Bloqueia redirects externos (Open Redirect)
  // Aceita apenas caminhos internos que começam com /
  const isInternal = next.startsWith('/') && !next.startsWith('//')
  if (!isInternal) return '/dashboard'

  // Opcional: whitelist restrita — descomente se quiser mais controle
  // const allowed = ALLOWED_NEXT_PATHS.some(path => next.startsWith(path))
  // if (!allowed) return '/dashboard'

  return next
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = getSafeRedirect(searchParams.get('next'))

  // Sem code → erro imediato
  if (!code) {
    console.warn('[SchoolRise] /auth/callback chamado sem code')
    return NextResponse.redirect(`${origin}/auth/login?error=missing-code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Loga o erro real para debug, mas não expõe detalhes ao usuário
    console.error('[SchoolRise] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/auth/login?error=auth-code-error`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}