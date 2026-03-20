'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import {
  MessageCircle, CalendarDays, UserCheck, FileText,
  Laptop, Send, CheckCircle2, UserX, BookOpen, Megaphone, Phone,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  student_name?: string
  campaign?: string
  course?: string
  phone?: string
  status?: string
  value?: number | string | null
  notes?: string
  return_date?: string | null
  contact_made?: boolean
  has_responded?: boolean
  scheduled?: boolean
  visited?: boolean
  is_online?: boolean
  no_show?: boolean
  rejection_reason?: string
}

interface FormData {
  student_name: string
  campaign: string
  course: string
  phone: string
  status: string
  value: string
  notes: string
  return_date: string
  contact_made: boolean
  has_responded: boolean
  scheduled: boolean
  visited: boolean
  is_online: boolean
  no_show: boolean
  rejection_reason: string
}

interface Props {
  lead: Lead
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedData?: Partial<Lead>) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function leadToForm(lead: Lead): FormData {
  return {
    student_name:     lead.student_name     ?? '',
    campaign:         lead.campaign         ?? '',
    course:           lead.course           ?? '',
    phone:            lead.phone            ?? '',
    status:           lead.status           ?? 'lead',
    value:            lead.value != null    ? String(lead.value) : '',
    notes:            lead.notes            ?? '',
    return_date:      lead.return_date      ?? '',
    contact_made:     lead.contact_made     ?? false,
    has_responded:    lead.has_responded    ?? false,
    scheduled:        lead.scheduled        ?? false,
    visited:          lead.visited          ?? false,
    is_online:        lead.is_online        ?? false,
    no_show:          lead.no_show          ?? false,
    rejection_reason: lead.rejection_reason ?? '',
  }
}

// ─── ToggleButton ─────────────────────────────────────────────────────────────

interface ToggleButtonProps {
  label: string
  icon: React.ReactNode
  active: boolean
  activeColor: string
  onClick: () => void
}

function ToggleButton({ label, icon, active, activeColor, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border ${
        active
          ? `${activeColor} border-transparent text-white shadow-inner scale-[0.98]`
          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
      }`}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-tight">{label}</span>
    </button>
  )
}

// ─── EditLeadDialog ───────────────────────────────────────────────────────────

export function EditLeadDialog({ lead, isOpen, onOpenChange, onUpdate }: Props) {
  const [loading,  setLoading]  = useState(false)
  const [formData, setFormData] = useState<FormData>(() => leadToForm(lead))

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Sincroniza form quando a lead muda (ex: abrir dialog com lead diferente)
  useEffect(() => {
    if (lead) setFormData(leadToForm(lead))
  }, [lead])

  // Helper para atualizar campos individualmente
  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: Partial<Lead> = {
        student_name:     formData.student_name.trim()  || undefined,
        campaign:         formData.campaign.trim()       || undefined,
        course:           formData.course.trim()         || undefined,
        phone:            formData.phone.trim()          || undefined,
        status:           formData.status,
        value:            parseFloat(formData.value)     || 0,
        notes:            formData.notes.trim()          || null,
        return_date:      formData.return_date           || null,
        contact_made:     formData.contact_made,
        has_responded:    formData.has_responded,
        scheduled:        formData.scheduled,
        visited:          formData.visited,
        is_online:        formData.is_online,
        no_show:          formData.no_show,
        rejection_reason: formData.status === 'canceled'
          ? formData.rejection_reason || null
          : null,
      }

      const { error } = await supabase
        .from('sales_leads')
        .update(payload)
        .eq('id', lead.id)

      if (error) throw error

      // Celebração ao converter
      if (lead.status !== 'converted' && formData.status === 'converted') {
        try {
          const audio = new Audio('/bell.mp3')
          audio.volume = 0.5
          audio.play().catch(() => {})
        } catch {}
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4F46E5', '#10B981', '#F59E0B'] })
        toast.success('PARABÉNS! Matrícula Realizada! 🔔')
      } else {
        toast.success('Dados atualizados!')
      }

      onUpdate({ ...lead, ...payload })
      onOpenChange(false)
    } catch (e) {
      console.error('[SchoolRise] Erro ao atualizar lead:', e)
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [formData, lead, supabase, onUpdate, onOpenChange])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] bg-white p-6 border-none shadow-2xl max-w-md overflow-y-auto max-h-[90vh] font-sans">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
            Editar Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 mt-2">

          {/* CHECKLIST DE CONVERSÃO */}
          <div className="bg-slate-900 p-5 rounded-[28px] space-y-3 shadow-xl">
            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest text-center border-b border-white/10 pb-2">
              Checklist de Conversão
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton label="Msg Enviada"    icon={<Send size={14}/>}          active={formData.contact_made}  activeColor="bg-indigo-500" onClick={() => set('contact_made',  !formData.contact_made)}  />
              <ToggleButton label="Respondeu"      icon={<CheckCircle2 size={14}/>}  active={formData.has_responded} activeColor="bg-emerald-500" onClick={() => set('has_responded', !formData.has_responded)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton label="Agendado"       icon={<CalendarDays size={14}/>}  active={formData.scheduled}     activeColor="bg-amber-500"   onClick={() => set('scheduled',    !formData.scheduled)}     />
              <ToggleButton label="Não Compareceu" icon={<UserX size={14}/>}         active={formData.no_show}       activeColor="bg-rose-500"    onClick={() => set('no_show',      !formData.no_show)}       />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton
                label="Presencial" icon={<UserCheck size={14}/>} active={formData.visited} activeColor="bg-blue-500"
                onClick={() => setFormData(prev => ({ ...prev, visited: !prev.visited, is_online: false }))}
              />
              <ToggleButton
                label="Online" icon={<Laptop size={14}/>} active={formData.is_online} activeColor="bg-purple-500"
                onClick={() => setFormData(prev => ({ ...prev, is_online: !prev.is_online, visited: false }))}
              />
            </div>
          </div>

          {/* DADOS DO ALUNO */}
          <div className="space-y-3">
            {/* Nome */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 flex items-center gap-1">
                Nome
              </label>
              <Input
                value={formData.student_name}
                onChange={e => set('student_name', e.target.value)}
                className="rounded-xl bg-slate-50 border-none h-10 font-bold"
                placeholder="Nome do aluno"
              />
            </div>

            {/* Curso + Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 flex items-center gap-1">
                  <BookOpen size={10} /> Curso
                </label>
                <Input
                  value={formData.course}
                  onChange={e => set('course', e.target.value)}
                  className="rounded-xl bg-slate-50 border-none h-10 font-bold"
                  placeholder="Ex: Robótica"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 flex items-center gap-1">
                  <Phone size={10} /> Telefone
                </label>
                <Input
                  value={formData.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="rounded-xl bg-slate-50 border-none h-10 font-bold"
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
              </div>
            </div>

            {/* Origem + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 flex items-center gap-1">
                  <Megaphone size={10} /> Origem
                </label>
                <Input
                  value={formData.campaign}
                  onChange={e => set('campaign', e.target.value)}
                  className="rounded-xl bg-slate-50 border-none h-10 font-bold"
                  placeholder="Instagram..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Valor (R$)</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={e => set('value', e.target.value)}
                  className="rounded-xl bg-slate-50 border-none h-10 font-black"
                  placeholder="0,00"
                  min="0"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Status</label>
              <select
                value={formData.status}
                onChange={e => set('status', e.target.value)}
                className="w-full rounded-xl bg-slate-50 border-none h-10 px-3 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="lead">Pendente / Lead</option>
                <option value="contacted">Contatado</option>
                <option value="responded">Respondeu</option>
                <option value="scheduled">Agendado</option>
                <option value="presential">Presencial</option>
                <option value="converted">Matriculado 🔔</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>

            {/* Motivo de cancelamento */}
            {formData.status === 'canceled' && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold uppercase text-red-500 ml-1">Motivo da Perda</label>
                <select
                  value={formData.rejection_reason}
                  onChange={e => set('rejection_reason', e.target.value)}
                  className="w-full rounded-xl bg-red-50 border-none h-10 px-3 text-xs font-bold text-red-700 outline-none cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  <option value="Preço">Preço alto</option>
                  <option value="Horário">Sem horário disponível</option>
                  <option value="Concorrente">Foi para concorrente</option>
                  <option value="Desistiu">Desistiu / Sem interesse</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            )}
          </div>

          {/* FOLLOW-UP */}
          <div className="bg-amber-50/50 p-4 rounded-[24px] border border-amber-100 space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <CalendarDays size={14} />
              <label className="text-[10px] font-black uppercase tracking-widest">Próximo Contato</label>
            </div>
            <Input
              type="date"
              value={formData.return_date}
              onChange={e => set('return_date', e.target.value)}
              className="rounded-xl bg-white border-amber-200 h-10 font-bold"
            />
            <textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full rounded-xl bg-white border border-amber-200 p-3 text-[11px] font-medium min-h-[60px] outline-none resize-none focus:ring-2 focus:ring-amber-300/30"
              placeholder="O que foi conversado?"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {loading ? 'Salvando...' : 'Atualizar Dashboard'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}