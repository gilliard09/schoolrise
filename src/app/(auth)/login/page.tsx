'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Alterna entre Login e Cadastro
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Lógica de Cadastro
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) throw signUpError
        toast.success("Conta criada! Verifique seu e-mail para confirmar.")
      } else {
        // Lógica de Login
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) throw authError

        if (data.session) {
          toast.success("Bem-vindo ao SchoolRise!")
          router.refresh()
          router.push('/')
        }
      }
    } catch (err: any) {
      const message = err.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : err.message
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* ÁREA DA LOGO */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative h-16 w-48 mb-2">
            {/* Certifique-se que a imagem está em /public/logo.png */}
            <Image 
              src="/logo.png" 
              alt="SchoolRise" 
              fill 
              className="object-contain"
              priority 
            />
          </div>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">
            {isSignUp ? 'Criar nova conta' : 'Portal do Gestor'}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-wider">
              E-mail
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" 
              className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm" 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-wider">
              Senha
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm" 
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {isSignUp ? 'Cadastrar Minha Escola' : 'Entrar no Dashboard'}
                {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
              </>
            )}
          </button>
        </form>

        {/* ALTERNAR ENTRE LOGIN E CADASTRO */}
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] font-black text-slate-400 uppercase tracking-tighter hover:text-indigo-600 transition-colors"
          >
            {isSignUp 
              ? 'Já possui acesso? Clique para entrar' 
              : 'Não tem uma conta? Clique para criar'}
          </button>
        </div>
      </div>
    </main>
  )
}