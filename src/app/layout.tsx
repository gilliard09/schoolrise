import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from 'sonner'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default:  'SchoolRise | Elevando escolas ao próximo nível',
    template: '%s | SchoolRise',
  },
  description:
    'Plataforma de performance para escolas profissionalizantes. Aumente matrículas, reduza evasão e engaje alunos com dados reais.',
  keywords: ['gestão escolar', 'matrículas', 'escola profissionalizante', 'SaaS educacional'],
  authors: [{ name: 'SchoolRise' }],
  creator: 'SchoolRise',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://schoolrise.com.br'
  ),
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    title:       'SchoolRise | Elevando escolas ao próximo nível',
    description: 'Plataforma de performance para escolas profissionalizantes.',
    siteName:    'SchoolRise',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'SchoolRise',
    description: 'Plataforma de performance para escolas profissionalizantes.',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

// Viewport separado (Next.js 14+ recomenda fora do metadata)
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)',  color: '#0d0f1a' },
  ],
  width:        'device-width',
  initialScale: 1,
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: evita warnings ao usar dark mode por classe
    <html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <main className="w-full">
          {children}
        </main>

        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:       'sr-toast',
              title:       'font-black text-sm',
              description: 'text-xs font-medium opacity-80',
              closeButton: 'opacity-60 hover:opacity-100',
            },
          }}
        />
      </body>
    </html>
  )
}