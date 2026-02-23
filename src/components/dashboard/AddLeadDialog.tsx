'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { Plus, Calculator, Target, User, BookOpen, Megaphone, MessageCircle, CalendarDays, DollarSign, FileText } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import confetti from 'canvas-confetti'

export function AddLeadDialog({ onUpdate }: { onUpdate: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estados do formulário
  const [nome, setNome] = useState('')
  const [curso, setCurso] = useState('')
  const [campanha, setCampanha] = useState('') 
  const [status, setStatus] = useState('lead') 
  
  // Funil Comercial, Observações & Follow-up
  const [contactMade, setContactMade] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [notes, setNotes] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [negotiationValue, setNegotiationValue] = useState(0)
  
  // Calculadora de Matrícula
  const [matricula, setMatricula] = useState(0)
  const [material, setMaterial] = useState(0)
  const [vlrParcela, setVlrParcela] = useState(0)
  const [qtdParcelas, setQtdParcelas] = useState(1)

  const valorTotal = (Number(matricula) || 0) + (Number(material) || 0) + ((Number(vlrParcela) || 0) * (Number(qtdParcelas) || 1))

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const dispararCelebracao = () => {
    const audio = new Audio('/bell.mp3')
    audio.volume = 0.5
    audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"))

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#4f46e5', '#FFD700']
    })
  }

  const handleSave = async () => {
    if (!nome || !curso) return toast.error("Preencha pelo menos Nome e Curso")
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Sua sessão expirou. Faça login novamente.")
        return
      }

      const { error } = await supabase.from('sales_leads').insert([{
        student_name: nome,
        course: curso,
        campaign: campanha || 'Direto / Outros',
        status: status,     
        value: status === 'converted' ? valorTotal : negotiationValue,
        notes: notes,
        return_date: returnDate || null,
        contact_made: contactMade,
        scheduled: scheduled,
        user_id: user.id,
        created_at: new Date().toISOString()
      }])

      if (error) throw error

      if (status === 'converted') {
        dispararCelebracao()
        toast.success("MUITO BEM! Nova matrícula realizada! 🔔")
      } else {
        toast.success("Registro salvo com sucesso!")
      }

      setOpen(false)
      onUpdate()
      
      // Limpar campos
      setNome(''); setCurso(''); setCampanha(''); setStatus('lead')
      setContactMade(false); setScheduled(false); setNotes(''); setReturnDate(''); setNegotiationValue(0)
      setMatricula(0); setMaterial(0); setVlrParcela(0); setQtdParcelas(1)
      
    } catch (error: any) {
      console.error(error)
      toast.error("Erro ao salvar no banco de dados")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    switch(status) {
      case 'converted': return 'bg-emerald-100 text-emerald-600'
      case 'canceled': return 'bg-red-100 text-red-600'
      case 'graduated': return 'bg-blue-100 text-blue-600'
      default: return 'bg-amber-100 text-amber-600'
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase text-xs tracking-widest">
        <Plus size={20} /> Novo Aluno
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl z-50 border border-slate-100 overflow-y-auto max-h-[90vh] outline-none font-sans">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <Dialog.Title className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cadastro</Dialog.Title>
              <Dialog.Description className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Preencha os dados do aluno abaixo
              </Dialog.Description>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor()}`}>
              {status === 'converted' ? 'Matrícula' : status === 'canceled' ? 'Cancelamento' : status === 'graduated' ? 'Formando' : 'Interesse'}
            </span>
          </div>

          {/* STATUS DO FUNIL */}
          <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 mb-6 space-y-3">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center mb-1">Passos Concluídos</p>
            <div className="flex items-center justify-around">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`p-2 rounded-xl transition-all ${contactMade ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-300'}`}>
                  <MessageCircle size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-700">Contatado</span>
                  <input type="checkbox" checked={contactMade} onChange={e => setContactMade(e.target.checked)} className="hidden" />
                </div>
              </label>

              <div className="h-8 w-[1px] bg-slate-200" />

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`p-2 rounded-xl transition-all ${scheduled ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-300'}`}>
                  <CalendarDays size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-700">Agendado</span>
                  <input type="checkbox" checked={scheduled} onChange={e => setScheduled(e.target.checked)} className="hidden" />
                </div>
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex items-center gap-1"><User size={10} /> Nome do Aluno</label>
                <input value={nome} onChange={e => setNome(e.target.value)} className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium" placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex items-center gap-1"><BookOpen size={10} /> Curso</label>
                <input value={curso} onChange={e => setCurso(e.target.value)} className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium" placeholder="Ex: Robótica" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex items-center gap-1"><Megaphone size={10} /> Origem</label>
                <input value={campanha} onChange={e => setCampanha(e.target.value)} className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium" placeholder="Instagram, WhatsApp..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 flex items-center gap-1"><Target size={10} /> Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-5 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none font-bold text-xs text-slate-700">
                  <option value="lead">APENAS LEAD (INTERESSADO)</option>
                  <option value="converted">MATRICULADO (NOVA ENTRADA) 🔔</option>
                  <option value="canceled">CANCELADO (SAÍDA/CHURN)</option>
                  <option value="graduated">FORMANDO (SAÍDA CONCLUÍDA)</option>
                </select>
              </div>
            </div>

            {/* SEÇÃO DE ACOMPANHAMENTO (Aparece se for Lead ou outros status não convertidos) */}
            {status !== 'converted' && (
              <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100 mt-6 animate-in fade-in zoom-in duration-300 space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <DollarSign size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Acompanhamento do Lead</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Expectativa Valor (R$)</label>
                    <input type="number" value={negotiationValue} onChange={e => setNegotiationValue(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Data de Retorno</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-white p-3 rounded-xl text-[11px] font-bold outline-none border border-slate-100" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><FileText size={10} /> Observações da Conversa</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 min-h-[80px] resize-none" placeholder="O que o cliente disse?" />
                </div>
              </div>
            )}

            {/* SEÇÃO DE MATRÍCULA (Aparece se for Matriculado) */}
            {status === 'converted' && (
              <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 mt-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Calculator size={18} />
                  <span className="text-[10px] font-black uppercase">Calculadora de Investimento</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">Matrícula</span>
                    <input type="number" onChange={e => setMatricula(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">Material</span>
                    <input type="number" onChange={e => setMaterial(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">Vlr. Parcela</span>
                    <input type="number" onChange={e => setVlrParcela(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">Qtd Parcelas</span>
                    <input type="number" value={qtdParcelas} onChange={e => setQtdParcelas(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100" />
                  </div>
                </div>
                <div className="space-y-1 mb-4">
                  <label className="text-[8px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><FileText size={10} /> Notas do Contrato</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 min-h-[60px] resize-none" placeholder="Ex: Bolsista 20%, Vencimento dia 10..." />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Gerado:</span>
                  <span className="text-xl font-black text-slate-900">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <button 
              onClick={handleSave} 
              disabled={loading} 
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all mt-4 disabled:opacity-50 text-white shadow-lg ${
                status === 'converted' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 
                'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading ? "Processando..." : "Confirmar Lançamento"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}