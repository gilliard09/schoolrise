'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { MessageCircle, CalendarDays, UserCheck, FileText, DollarSign } from 'lucide-react'

interface EditLeadDialogProps {
  lead: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function EditLeadDialog({ lead, isOpen, onOpenChange, onUpdate }: EditLeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    student_name: '',
    campaign: '', 
    course: '',
    status: '',
    value: '',
    notes: '',          // Novo campo
    return_date: '',    // Novo campo
    contact_made: false,
    scheduled: false,
    visited: false
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
        scheduled: lead.scheduled || false,
        visited: lead.visited || false
      })
    }
  }, [lead])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('sales_leads')
        .update({
          student_name: formData.student_name,
          campaign: formData.campaign, 
          course: formData.course,
          status: formData.status,
          value: parseFloat(formData.value) || 0,
          notes: formData.notes,
          return_date: formData.return_date || null,
          contact_made: formData.contact_made,
          scheduled: formData.scheduled,
          visited: formData.visited
        })
        .eq('id', lead.id)

      if (error) throw error

      // Efeito de celebração se mudar para Matriculado
      if (lead.status !== 'converted' && formData.status === 'converted') {
        const audio = new Audio('/success-sound.mp3');
        audio.play().catch(() => {}); 

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#ffffff']
        })
        toast.success("PARABÉNS! Mais uma conversão realizada! 🎉")
      } else {
        toast.success("Cadastro atualizado com sucesso!")
      }

      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] bg-white p-8 border-none shadow-2xl outline-none max-w-md overflow-y-auto max-h-[90vh] font-sans">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Editar Registro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4 mt-4">
          
          {/* SEÇÃO DE PROGRESSO COMERCIAL */}
          <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 space-y-3">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 text-center">Progresso Comercial</p>
            
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className={formData.contact_made ? "text-indigo-600" : "text-slate-300"} />
                <span className="text-[11px] font-bold text-slate-700">Contatado</span>
              </div>
              <input 
                type="checkbox" 
                checked={formData.contact_made}
                onChange={e => setFormData({...formData, contact_made: e.target.checked})}
                className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className={formData.scheduled ? "text-amber-500" : "text-slate-300"} />
                <span className="text-[11px] font-bold text-slate-700">Agendado</span>
              </div>
              <input 
                type="checkbox" 
                checked={formData.scheduled}
                onChange={e => setFormData({...formData, scheduled: e.target.checked})}
                className="w-5 h-5 accent-amber-500 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className={formData.visited ? "text-emerald-500" : "text-slate-300"} />
                <span className="text-[11px] font-bold text-slate-700">Visitou a Escola</span>
              </div>
              <input 
                type="checkbox" 
                checked={formData.visited}
                onChange={e => setFormData({...formData, visited: e.target.checked})}
                className="w-5 h-5 accent-emerald-500 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* DADOS BÁSICOS */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nome do Aluno</label>
            <Input 
              value={formData.student_name} 
              onChange={e => setFormData({...formData, student_name: e.target.value})} 
              className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus:ring-2 focus:ring-indigo-500/20" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Origem</label>
              <Input 
                value={formData.campaign} 
                onChange={e => setFormData({...formData, campaign: e.target.value})} 
                className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Curso</label>
              <Input 
                value={formData.course} 
                onChange={e => setFormData({...formData, course: e.target.value})} 
                className="rounded-2xl bg-slate-50 border-none h-12 font-medium focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
          </div>

          {/* STATUS E VALOR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full rounded-2xl bg-slate-50 border-none h-12 px-3 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700"
              >
                <option value="lead">Pendente (Lead)</option>
                <option value="converted">Matriculado</option>
                <option value="canceled">Cancelado</option>
                <option value="graduated">Formando</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">
                {formData.status === 'converted' ? 'Valor Contrato' : 'Valor Negociado'}
              </label>
              <Input 
                type="number" 
                value={formData.value} 
                onChange={e => setFormData({...formData, value: e.target.value})} 
                className="rounded-2xl bg-slate-50 border-none h-12 font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
          </div>

          {/* ANOTAÇÕES E DATA DE RETORNO */}
          <div className="bg-amber-50/30 p-4 rounded-[24px] border border-amber-100 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-amber-600 ml-1 flex items-center gap-1">
                <CalendarDays size={12} /> Próximo Contato (Follow-up)
              </label>
              <Input 
                type="date" 
                value={formData.return_date} 
                onChange={e => setFormData({...formData, return_date: e.target.value})} 
                className="rounded-xl bg-white border-amber-100 h-10 font-bold text-xs" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-amber-600 ml-1 flex items-center gap-1">
                <FileText size={12} /> Observações
              </label>
              <textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                className="w-full rounded-xl bg-white border-amber-100 p-3 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[80px] resize-none"
                placeholder="Detalhes da última conversa..."
              />
            </div>
          </div>

          <Button 
            disabled={loading} 
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-2 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
          >
            {loading ? "Salvando Alterações..." : "Atualizar Cadastro"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}