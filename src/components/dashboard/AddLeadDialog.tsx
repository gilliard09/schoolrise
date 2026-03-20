'use client'

import { useState, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import {
  Plus, Calculator, Target, User, BookOpen,
  Megaphone, MessageCircle, CalendarDays,
  DollarSign, FileText, X, Phone,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import confetti from 'canvas-confetti'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  nome: string
  curso: string
  campanha: string
  telefone: string
  status: string
  contactMade: boolean
  scheduled: boolean
  notes: string
  returnDate: string
  negotiationValue: string
  matricula: string
  material: string
  vlrParcela: string
  qtdParcelas: string
}

const FORM_INITIAL: FormState = {
  nome: '', curso: '', campanha: '', telefone: '',
  status: 'lead', contactMade: false, scheduled: false,
  notes: '', returnDate: '', negotiationValue: '',
  matricula: '', material: '', vlrParcela: '', qtdParcelas: '1',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(val: string): number {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function calcValorTotal(form: FormState): number {
  return toNumber(form.matricula)
    + toNumber(form.material)
    + toNumber(form.vlrParcela) * Math.max(toNumber(form.qtdParcelas), 1)
}

function dispararCelebracao() {
  try {
    const audio = new Audio('/bell.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {}) // ignora erro de autoplay
  } catch {}

  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#4f46e5', '#FFD700'],
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'converted': return 'bg-emerald-100 text-emerald-600'
    case 'canceled':  return 'bg-red-100 text-red-600'
    case 'graduated': return 'bg-blue-100 text-blue-600'
    default:          return 'bg-amber-100 text-amber-600'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'converted': return 'Matrícula'
    case 'canceled':  return 'Cancelamento'
    case 'graduated': return 'Formando'
    default:          return 'Interesse'
  }
}

// ─── Input Field ──────────────────────────────────────────────────────────────

function Field({
  label, icon, error, children,
}: {
  label: string; icon?: React.ReactNode; error?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className={`text-[10px] font-bold uppercase ml-2 flex items-center gap-1 ${error ? 'text-red-500' : 'text-slate-400'}`}>
        {icon} {label}
      </label>
      {children}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function AddLeadDialog({ onUpdate }: { onUpdate: () => void }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState<FormState>(FORM_INITIAL)
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, boolean>>>({})

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const set = useCallback((key: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: false }))
  }, [])

  const resetForm = useCallback(() => {
    setForm(FORM_INITIAL)
    setErrors({})
  }, [])

  const valorTotal = calcValorTotal(form)

  // ── Validação ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.nome.trim())  newErrors.nome  = true
    if (!form.curso.trim()) newErrors.curso = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Preencha os campos obrigatórios')
      return false
    }
    return true
  }

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Sua sessão expirou. Faça login novamente.')
        return
      }

      const { error } = await supabase.from('sales_leads').insert([{
        student_name:  form.nome.trim(),
        course:        form.curso.trim(),
        campaign:      form.campanha.trim() || 'Direto / Outros',
        phone:         form.telefone.trim() || null,
        status:        form.status,
        value:         form.status === 'converted' ? valorTotal : toNumber(form.negotiationValue),
        notes:         form.notes.trim() || null,
        return_date:   form.returnDate || null,
        contact_made:  form.contactMade,
        scheduled:     form.scheduled,
        user_id:       user.id,
        assigned_to:   user.id,   // por padrão, atribuído a quem criou
        created_at:    new Date().toISOString(),
      }])

      if (error) throw error

      if (form.status === 'converted') {
        dispararCelebracao()
        toast.success('MUITO BEM! Nova matrícula realizada! 🔔')
      } else {
        toast.success('Registro salvo com sucesso!')
      }

      setOpen(false)
      resetForm()
      onUpdate()
    } catch (e) {
      console.error('[SchoolRise] Erro ao salvar lead:', e)
      toast.error('Erro ao salvar no banco de dados')
    } finally {
      setLoading(false)
    }
  }, [form, valorTotal, supabase, onUpdate, resetForm])

  const handleOpenChange = useCallback((val: boolean) => {
    setOpen(val)
    if (!val) resetForm()
  }, [resetForm])

  // ── Input classes ────────────────────────────────────────────────────────────
  const inputClass = (error?: boolean) =>
    `w-full px-5 py-3 bg-slate-50 rounded-2xl border focus:ring-2 focus:ring-indigo-500/30 transition-all outline-none text-sm font-medium ${
      error ? 'border-red-300 bg-red-50' : 'border-transparent'
    }`

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 uppercase text-xs tracking-widest">
        <Plus size={20} /> Novo Aluno
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl z-50 border border-slate-100 overflow-y-auto max-h-[90vh] outline-none font-sans animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <Dialog.Title className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cadastro</Dialog.Title>
              <Dialog.Description className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Preencha os dados do aluno abaixo
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(form.status)}`}>
                {getStatusLabel(form.status)}
              </span>
              <Dialog.Close className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          {/* Passos do funil */}
          <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 mb-6">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center mb-3">Passos Concluídos</p>
            <div className="flex items-center justify-around">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set('contactMade', !form.contactMade)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${form.contactMade ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-300 hover:bg-slate-100'}`}
                >
                  <MessageCircle size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Contatado</span>
              </label>

              <div className="h-8 w-[1px] bg-slate-200" />

              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set('scheduled', !form.scheduled)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${form.scheduled ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-300 hover:bg-slate-100'}`}
                >
                  <CalendarDays size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Agendado</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nome + Curso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do Aluno *" icon={<User size={10} />} error={errors.nome}>
                <input
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className={inputClass(errors.nome)}
                  placeholder="Nome completo"
                />
              </Field>
              <Field label="Curso *" icon={<BookOpen size={10} />} error={errors.curso}>
                <input
                  value={form.curso}
                  onChange={e => set('curso', e.target.value)}
                  className={inputClass(errors.curso)}
                  placeholder="Ex: Robótica"
                />
              </Field>
            </div>

            {/* Telefone + Origem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Telefone" icon={<Phone size={10} />}>
                <input
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  className={inputClass()}
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
              </Field>
              <Field label="Origem" icon={<Megaphone size={10} />}>
                <input
                  value={form.campanha}
                  onChange={e => set('campanha', e.target.value)}
                  className={inputClass()}
                  placeholder="Instagram, WhatsApp..."
                />
              </Field>
            </div>

            {/* Status */}
            <Field label="Status" icon={<Target size={10} />}>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputClass() + ' cursor-pointer appearance-none font-bold text-xs text-slate-700'}
              >
                <option value="lead">APENAS LEAD (INTERESSADO)</option>
                <option value="converted">MATRICULADO (NOVA ENTRADA) 🔔</option>
                <option value="canceled">CANCELADO (SAÍDA/CHURN)</option>
                <option value="graduated">FORMANDO (SAÍDA CONCLUÍDA)</option>
              </select>
            </Field>

            {/* Acompanhamento do Lead */}
            {form.status !== 'converted' && (
              <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100 animate-in fade-in zoom-in-95 duration-300 space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <DollarSign size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Acompanhamento do Lead</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Expectativa Valor (R$)">
                    <input
                      type="number"
                      value={form.negotiationValue}
                      onChange={e => set('negotiationValue', e.target.value)}
                      className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0,00"
                      min="0"
                    />
                  </Field>
                  <Field label="Data de Retorno">
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={e => set('returnDate', e.target.value)}
                      className="w-full bg-white p-3 rounded-xl text-[11px] font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                </div>
                <Field label="Observações da Conversa" icon={<FileText size={10} />}>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 min-h-[80px] resize-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="O que o cliente disse?"
                  />
                </Field>
              </div>
            )}

            {/* Calculadora de Matrícula */}
            {form.status === 'converted' && (
              <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Calculator size={18} />
                  <span className="text-[10px] font-black uppercase">Calculadora de Investimento</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {([
                    { key: 'matricula',   label: 'Matrícula'     },
                    { key: 'material',    label: 'Material'      },
                    { key: 'vlrParcela',  label: 'Vlr. Parcela'  },
                    { key: 'qtdParcelas', label: 'Qtd. Parcelas' },
                  ] as { key: keyof FormState; label: string }[]).map(f => (
                    <div key={f.key} className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">{f.label}</span>
                      <input
                        type="number"
                        value={form[f.key] as string}
                        onChange={e => set(f.key, e.target.value)}
                        min="0"
                        className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  ))}
                </div>
                <Field label="Notas do Contrato" icon={<FileText size={10} />}>
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    className="w-full bg-white p-3 rounded-xl text-sm outline-none border border-slate-100 min-h-[60px] resize-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ex: Bolsista 20%, Vencimento dia 10..."
                  />
                </Field>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Gerado:</span>
                  <span className="text-xl font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all mt-2 disabled:opacity-50 text-white shadow-lg active:scale-95 ${
                form.status === 'converted'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading ? 'Processando...' : 'Confirmar Lançamento'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}