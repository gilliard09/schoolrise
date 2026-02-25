'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Edit2, Trash2, Search, Megaphone, 
  Bell, AlertCircle, Users, 
  Target, TrendingUp, MessageCircle, 
  CheckCircle2, Calendar, MapPin, Laptop, Send 
} from 'lucide-react'
import { toast } from 'sonner'
import { EditLeadDialog } from './EditLeadDialog'
import confetti from 'canvas-confetti'

// --- COMPONENTE DE STATUS (SECRETÁRIAS) ---
function StatusTracker({ lead, onUpdate }: { lead: any, onUpdate: () => void }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const updateLeadData = async (updates: any) => {
    const { error } = await supabase
      .from('sales_leads')
      .update(updates)
      .eq('id', lead.id)

    if (error) {
      toast.error("Erro ao atualizar dados")
    } else {
      if (updates.status === 'converted') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#10B981', '#F59E0B']
        });
        toast.success("MATRÍCULA REALIZADA! 🙌🚀")
      } else {
        toast.success("Atualizado!")
      }
      onUpdate()
    }
  }

  if (lead.status === 'converted') return <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Matrícula Efetivada</span>

  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {/* MENSAGEM ENVIADA */}
      <button 
        onClick={() => updateLeadData({ contact_made: !lead.contact_made, status: 'contacted' })}
        className={`p-1.5 rounded-lg transition-all ${lead.contact_made ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        title="Mandei Mensagem"
      >
        <Send size={14} />
      </button>

      {/* RESPONDEU */}
      <button 
        onClick={() => updateLeadData({ has_responded: !lead.has_responded, status: 'responded' })}
        className={`p-1.5 rounded-lg transition-all ${lead.has_responded ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        title="Respondeu"
      >
        <MessageCircle size={14} />
      </button>

      {/* AGENDADO */}
      <button 
        onClick={() => updateLeadData({ scheduled: !lead.scheduled, status: 'scheduled' })}
        className={`p-1.5 rounded-lg transition-all ${lead.scheduled ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        title="Agendou Visita"
      >
        <Calendar size={14} />
      </button>

      <div className="w-[1px] h-4 bg-slate-200 mx-1" />

      {/* PRESENCIAL (visited) */}
      <button 
        onClick={() => updateLeadData({ visited: !lead.visited, is_online: false, status: lead.visited ? 'responded' : 'presential' })}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border ${
          lead.visited 
          ? 'bg-orange-600 text-white border-orange-600' 
          : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white'
        }`}
      >
        <MapPin size={12} /> Presencial
      </button>

      {/* ONLINE (is_online) */}
      <button 
        onClick={() => updateLeadData({ is_online: !lead.is_online, visited: false })}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border ${
          lead.is_online 
          ? 'bg-purple-600 text-white border-purple-600' 
          : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white'
        }`}
      >
        <Laptop size={12} /> Online
      </button>

      <button 
        onClick={() => updateLeadData({ status: 'converted' })}
        className="ml-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
      >
        Matricular
      </button>
    </div>
  )
}

export function LeadsTable({ 
  onUpdate, 
  viewMode = 'all', 
  externalYear,
  metricFilter 
}: { 
  onUpdate: () => void, 
  viewMode?: 'leads' | 'admin' | 'all',
  externalYear?: string,
  metricFilter?: string | null
}) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'lead' | 'converted' | 'presential' | 'scheduled' | 'contacted' | 'responded'>('all')
  const [onlyTodayReturn, setOnlyTodayReturn] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('sales_leads').select('*').order('created_at', { ascending: false })
    if (!error) setLeads(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const isReturnToday = (returnDate: string) => {
    if (!returnDate) return false
    const today = new Date(); today.setHours(0,0,0,0)
    const dReturn = new Date(returnDate); dReturn.setHours(0,0,0,0)
    return dReturn <= today
  }

  const filteredLeads = leads.filter(l => {
    const date = new Date(l.created_at)
    const status = String(l.status || '').toLowerCase().trim()
    
    if (viewMode === 'leads' && (status === 'presential' || status === 'converted')) return false
    if (viewMode === 'admin' && (status !== 'presential' && status !== 'converted')) return false

    const matchesYear = date.getUTCFullYear().toString() === (externalYear || "2026")
    
    let matchesMetric = true;
    if (metricFilter) {
      switch (metricFilter) {
        case 'Msgs Enviadas': matchesMetric = l.contact_made === true; break;
        case 'Faltam Enviar': matchesMetric = !l.contact_made && status !== 'converted' && status !== 'canceled'; break;
        case 'Responderam': matchesMetric = l.has_responded === true; break;
        case 'Não Responderam': matchesMetric = l.contact_made && !l.has_responded && status !== 'converted'; break;
        case 'Agendados': matchesMetric = l.scheduled === true; break;
        case 'Presenciais': matchesMetric = l.visited === true; break;
        case 'Atend. Online': matchesMetric = l.is_online === true; break;
        case 'Não Compareceu': matchesMetric = l.no_show === true; break;
        case 'Matrículas': matchesMetric = status === 'converted'; break;
        default: matchesMetric = true;
      }
    }

    const matchesSearch = l.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.course?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMonth = selectedMonth === 'all' || date.getUTCMonth().toString() === selectedMonth
    const matchesStatus = filterStatus === 'all' ? true : status === filterStatus
    const matchesReturn = onlyTodayReturn ? isReturnToday(l.return_date) && status !== 'converted' : true

    return matchesSearch && matchesMonth && matchesYear && matchesStatus && matchesReturn && matchesMetric
  })

  const getStatusLabel = (status: string) => {
    const map: any = {
      converted: { label: 'Matriculado', class: 'bg-emerald-50 text-emerald-600' },
      presential: { label: 'Presencial', class: 'bg-orange-100 text-orange-600' },
      scheduled: { label: 'Agendado', class: 'bg-amber-100 text-amber-600' },
      contacted: { label: 'Contatado', class: 'bg-indigo-50 text-indigo-600' },
      responded: { label: 'Respondeu', class: 'bg-blue-50 text-blue-600' },
      canceled: { label: 'Cancelado', class: 'bg-red-50 text-red-600' }
    }
    return map[status] || { label: 'Novo Lead', class: 'bg-slate-50 text-slate-500' }
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
              placeholder="Pesquisar aluno..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setOnlyTodayReturn(!onlyTodayReturn)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${onlyTodayReturn ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400'}`}
            >
              <Bell size={14} /> Retornos
            </button>
            <select 
              className="px-4 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none border-none"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="all">Mês: Todos</option>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                <option key={m} value={i.toString()}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                <th className="p-5 w-10">Status</th>
                <th className="p-5">Aluno</th>
                <th className="p-5">Ações Rápidas</th>
                <th className="p-5">Curso/Origem</th>
                <th className="p-5">Valor Esperado</th>
                <th className="p-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(l => {
                const statusInfo = getStatusLabel(l.status)
                const needsReturn = isReturnToday(l.return_date) && l.status !== 'converted'
                return (
                  <tr key={l.id} className={`border-b border-slate-50 group transition-all ${needsReturn ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-5">
                      {needsReturn ? (
                        <div className="relative">
                          <AlertCircle className="text-amber-500 animate-pulse" size={20} />
                        </div>
                      ) : (
                        <div className={`w-3 h-3 rounded-full ${l.status === 'converted' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      )}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{l.student_name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(l.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`mt-1 w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <StatusTracker lead={l} onUpdate={() => { fetchLeads(); onUpdate(); }} />
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-600">{l.course}</span>
                        <span className="flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase mt-0.5">
                          <Megaphone size={10}/> {l.campaign || l.source || 'Direto'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.value || 0)}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setSelectedLead(l); setIsEditOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => { if(confirm("Eliminar este lead?")) { supabase.from('sales_leads').delete().eq('id', l.id).then(() => { fetchLeads(); onUpdate(); }) } }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center">
              <Users className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nenhum registo em {metricFilter || 'esta categoria'}</p>
            </div>
          )}
        </div>
      </div>

      {isEditOpen && (
        <EditLeadDialog 
          lead={selectedLead} 
          isOpen={isEditOpen} 
          onOpenChange={setIsEditOpen} 
          onUpdate={() => { fetchLeads(); onUpdate(); }} 
        />
      )}
    </div>
  )
}