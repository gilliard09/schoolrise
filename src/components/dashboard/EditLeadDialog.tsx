'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { 
  MessageCircle, 
  CalendarDays, 
  UserCheck, 
  FileText, 
  Laptop, 
  XCircle, 
  Send, 
  CheckCircle2,
  AlertTriangle,
  UserX
} from 'lucide-react'

interface EditLeadDialogProps {
  lead: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (updatedData?: any) => void 
}

export function EditLeadDialog({ lead, isOpen, onOpenChange, onUpdate }: EditLeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    student_name: '',
    campaign: '', 
    course: '',
    status: '',
    value: '',
    notes: '',
    return_date: '',
    contact_made: false, // Msgs Enviadas
    has_responded: false, // Responderam
    scheduled: false,     // Agendados
    visited: false,       // Presenciais
    is_online: false,     // Online
    no_show: false,       // Não Compareceu
    rejection_reason: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (lead) {
      setFormData({
        student_name: lead.student_name || '',
        campaign: lead.campaign || '', 
        course: lead.course || '',
        status: lead.status || 'lead',
        value: lead.value?.toString() || '0',
        notes: lead.notes || '',
        return_date: lead.return_date || '',
        contact_made: lead.contact_made || false,
        has_responded: lead.has_responded || false,
        scheduled: lead.scheduled || false,
        visited: lead.visited || false,
        is_online: lead.is_online || false,
        no_show: lead.no_show || false,
        rejection_reason: lead.rejection_reason || ''
      })
    }
  }, [lead])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updatedPayload = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        return_date: formData.return_date || null,
        rejection_reason: formData.status === 'canceled' ? formData.rejection_reason : null
      }

      const { error } = await supabase
        .from('sales_leads')
        .update(updatedPayload)
        .eq('id', lead.id)

      if (error) throw error

      if (lead.status !== 'converted' && formData.status === 'converted') {
        new Audio('/bell.mp3').play().catch(() => {});
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
        toast.success("PARABÉNS! Matrícula Realizada! 🔔")
      } else {
        toast.success("Dados atualizados!")
      }

      onUpdate({ ...lead, ...updatedPayload })
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Erro: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] bg-white p-6 border-none shadow-2xl max-w-md overflow-y-auto max-h-[90vh] font-sans">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Ações da Secretária</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
          
          {/* PAINEL DE CONTROLE DE INDICADORES (O CORAÇÃO DO COMERCIAL) */}
          <div className="bg-slate-900 p-5 rounded-[28px] space-y-3 shadow-xl">
            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest text-center border-b border-white/10 pb-2">Checklist de Conversão</p>
            
            {/* LINHA 1: CONTATO INICIAL */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton 
                label="Msg Enviada" 
                icon={<Send size={14}/>} 
                active={formData.contact_made} 
                activeColor="bg-indigo-500"
                onClick={() => setFormData({...formData, contact_made: !formData.contact_made})} 
              />
              <ToggleButton 
                label="Respondeu" 
                icon={<CheckCircle2 size={14}/>} 
                active={formData.has_responded} 
                activeColor="bg-emerald-500"
                onClick={() => setFormData({...formData, has_responded: !formData.has_responded})} 
              />
            </div>

            {/* LINHA 2: AGENDAMENTO */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton 
                label="Agendado" 
                icon={<CalendarDays size={14}/>} 
                active={formData.scheduled} 
                activeColor="bg-amber-500"
                onClick={() => setFormData({...formData, scheduled: !formData.scheduled})} 
              />
              <ToggleButton 
                label="Não Compareceu" 
                icon={<UserX size={14}/>} 
                active={formData.no_show} 
                activeColor="bg-rose-500"
                onClick={() => setFormData({...formData, no_show: !formData.no_show})} 
              />
            </div>

            {/* LINHA 3: TIPO DE ATENDIMENTO */}
            <div className="grid grid-cols-2 gap-3">
              <ToggleButton 
                label="Presencial" 
                icon={<UserCheck size={14}/>} 
                active={formData.visited} 
                activeColor="bg-blue-500"
                onClick={() => setFormData({...formData, visited: !formData.visited, is_online: false})} 
              />
              <ToggleButton 
                label="Online" 
                icon={<Laptop size={14}/>} 
                active={formData.is_online} 
                activeColor="bg-purple-500"
                onClick={() => setFormData({...formData, is_online: !formData.is_online, visited: false})} 
              />
            </div>
          </div>

          {/* DADOS DO ALUNO */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nome</label>
              <Input value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} className="rounded-xl bg-slate-50 border-none h-10 font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full rounded-xl bg-slate-50 border-none h-10 px-3 text-xs font-bold outline-none">
                  <option value="lead">Pendente</option>
                  <option value="converted">Matriculado 🔔</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Valor</label>
                <Input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="rounded-xl bg-slate-50 border-none h-10 font-black" />
              </div>
            </div>

            {formData.status === 'canceled' && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold uppercase text-red-500 ml-1">Motivo da Perda</label>
                <select value={formData.rejection_reason} onChange={e => setFormData({...formData, rejection_reason: e.target.value})} className="w-full rounded-xl bg-red-50 border-none h-10 px-3 text-xs font-bold text-red-700 outline-none">
                  <option value="">Selecione...</option>
                  <option value="Preço">Preço alto</option>
                  <option value="Horário">Sem horário</option>
                  <option value="Concorrente">Concorrente</option>
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
            <Input type="date" value={formData.return_date} onChange={e => setFormData({...formData, return_date: e.target.value})} className="rounded-xl bg-white border-amber-200 h-10 font-bold" />
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full rounded-xl bg-white border-amber-200 p-3 text-[11px] font-medium min-h-[60px] outline-none" placeholder="O que foi conversado?" />
          </div>

          <Button disabled={loading} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100">
            {loading ? "Salvando..." : "Atualizar Dashboard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente de botão de alternância estilizado
function ToggleButton({ label, icon, active, activeColor, onClick }: any) {
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