import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Rotas públicas (sem autenticação) ───────────────────────────────────────
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/callback',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware — responsabilidades:
//   1. Refresh automático do token Supabase
//   2. Redireciona não autenticados para /auth/login
//   3. Redireciona usuário já logado que acessa /auth/login para /
//
// ⚠️ NÃO faz redirect por role aqui — isso é responsabilidade do app/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh do token (obrigatório para Supabase SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Rota pública
  if (isPublicRoute(pathname)) {
    // Já autenticado tentando acessar /auth/login → manda para raiz
    if (user && pathname.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Rota protegida sem sessão → login com ?next= para voltar depois
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}