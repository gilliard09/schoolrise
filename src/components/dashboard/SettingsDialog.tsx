'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Loader2 } from "lucide-react"

interface SettingsDialogProps {
  onUpdate: () => void;
}

export function SettingsDialog({ onUpdate }: SettingsDialogProps) {
  const [monthly, setMonthly] = useState('')
  const [annual, setAnnual] = useState('')
  const [leads, setLeads] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Carrega as metas atuais quando o modal abre
  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single()
      
      if (data) {
        setMonthly(data.monthly_revenue_goal.toString())
        setAnnual(data.annual_revenue_goal.toString())
        setLeads(data.leads_goal.toString())
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      // Busca o ID da escola
      const { data: school } = await supabase.from('schools').select('id').single()
      
      if (!school) throw new Error("Escola não identificada.")

      // Salva ou Atualiza as metas (Upsert)
      const { error } = await supabase
        .from('school_settings')
        .upsert({
          school_id: school.id,
          monthly_revenue_goal: parseFloat(monthly) || 0,
          annual_revenue_goal: parseFloat(annual) || 0,
          leads_goal: parseInt(leads) || 0
        }, { onConflict: 'school_id' })

      if (error) throw error
      
      // Feedback visual e atualização do dashboard
      onUpdate()
      setOpen(false)
    } catch (err) {
      console.error("Erro ao salvar metas:", err)
      alert("Houve um erro ao salvar as metas. Verifique o banco de dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-appleBlue rounded-full transition-all hover:rotate-90 active:scale-90"
          title="Configurar Metas"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Metas da Escola
          </DialogTitle>
          <p className="text-slate-500 text-sm italic">Defina seus objetivos financeiros e de captação.</p>
        </DialogHeader>
        
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
              Meta Mensal Realizada (R$)
            </Label>
            <Input 
              type="number" 
              value={monthly} 
              onChange={(e) => setMonthly(e.target.value)} 
              className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:ring-appleBlue font-medium"
              placeholder="Ex: 10000"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
              Meta Anual Realizada (R$)
            </Label>
            <Input 
              type="number" 
              value={annual} 
              onChange={(e) => setAnnual(e.target.value)} 
              className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:ring-appleBlue font-medium"
              placeholder="Ex: 120000"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">
              Meta de Novos Leads (Qtd)
            </Label>
            <Input 
              type="number" 
              value={leads} 
              onChange={(e) => setLeads(e.target.value)} 
              className="rounded-2xl border-slate-100 bg-slate-50 h-12 focus:ring-appleBlue font-medium"
              placeholder="Ex: 30"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl h-14 font-bold text-lg transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Sincronizando...
            </div>
          ) : 'Atualizar Objetivos'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}