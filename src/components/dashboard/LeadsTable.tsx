'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Edit2, Trash2, Search, Megaphone,
  Bell, AlertCircle, Users,
  MessageCircle, CheckCircle2, Calendar,
  MapPin, Laptop, Send, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { EditLeadDialog } from './EditLeadDialog'
import { SellerAssignSelect } from './SellerAssignSelect'
import confetti from 'canvas-confetti'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  created_at: string
  status: string | null
  student_name?: string
  course?: string
  value?: number | string | null
  campaign?: string
  source?: string
  return_date?: string | null
  contact_made?: boolean
  has_responded?: boolean
  scheduled?: boolean
  visited?: boolean
  is_online?: boolean
  no_show?: boolean
  assigned_to?: string | null
  user_id?: string | null
}

type ViewMode    = 'leads' | 'admin' | 'all'
type FilterStatus = 'all' | 'lead' | 'converted' | 'presential' | 'scheduled' | 'contacted' | 'responded'

interface StatusInfo {
  label: string
  class: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function isReturnToday(returnDate: string | null | undefined): boolean {
  if (!returnDate) return false
  const today  = new Date(); today.setHours(0, 0, 0, 0)
  const dReturn = new Date(returnDate); dReturn.setHours(0, 0, 0, 0)
  return dReturn <= today
}

function getStatusInfo(status: string | null | undefined): StatusInfo {
  const map: Record<string, StatusInfo> = {
    converted:  { label: 'Matriculado', class: 'bg-emerald-50 text-emerald-600'  },
    presential: { label: 'Presencial',  class: 'bg-orange-100 text-orange-600'   },
    scheduled:  { label: 'Agendado',    class: 'bg-amber-100 text-amber-600'     },
    contacted:  { label: 'Contatado',   class: 'bg-indigo-50 text-indigo-600'    },
    responded:  { label: 'Respondeu',   class: 'bg-blue-50 text-blue-600'        },
    canceled:   { label: 'Cancelado',   class: 'bg-red-50 text-red-600'          },
  }
  return map[String(status ?? '').toLowerCase().trim()] ?? { label: 'Novo Lead', class: 'bg-slate-50 text-slate-500' }
}

// ─── StatusTracker ────────────────────────────────────────────────────────────

interface StatusTrackerProps {
  lead: Lead
  onUpdate: () => void
  supabase: ReturnType<typeof createBrowserClient>
}

function StatusTracker({ lead, onUpdate, supabase }: StatusTrackerProps) {
  const [saving, setSaving] = useState(false)

  const updateLead = useCallback(async (updates: Partial<Lead>) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('sales_leads')
        .update(updates)
        .eq('id', lead.id)

      if (error) throw error

      if (updates.status === 'converted') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4F46E5', '#10B981', '#F59E0B'] })
        toast.success('MATRÍCULA REALIZADA! 🙌🚀')
      } else {
        toast.success('Atualizado!')
      }
      onUpdate()
    } catch (e) {
      console.error('[SchoolRise] Erro ao atualizar lead:', e)
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [lead.id, supabase, onUpdate])

  if (lead.status === 'converted') {
    return (
      <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
        <CheckCircle2 size={12} /> Matrícula Efetivada
      </span>
    )
  }

  const btnBase   = 'p-1.5 rounded-lg transition-all disabled:opacity-40'
  const btnActive = (active: boolean, activeClass: string) =>
    `${btnBase} ${active ? activeClass : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`

  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {saving && <Loader2 size={12} className="animate-spin text-indigo-400 mr-1" />}

      <button
        disabled={saving}
        onClick={() => updateLead({ contact_made: !lead.contact_made, status: 'contacted' })}
        className={btnActive(!!lead.contact_made, 'bg-indigo-600 text-white')}
        title="Mensagem enviada"
      >
        <Send size={14} />
      </button>

      <button
        disabled={saving}
        onClick={() => updateLead({ has_responded: !lead.has_responded, status: 'responded' })}
        className={btnActive(!!lead.has_responded, 'bg-blue-500 text-white')}
        title="Respondeu"
      >
        <MessageCircle size={14} />
      </button>

      <button
        disabled={saving}
        onClick={() => updateLead({ scheduled: !lead.scheduled, status: lead.scheduled ? 'responded' : 'scheduled' })}
        className={btnActive(!!lead.scheduled, 'bg-amber-500 text-white')}
        title="Agendou visita"
      >
        <Calendar size={14} />
      </button>

      <div className="w-[1px] h-4 bg-slate-200 mx-1" />

      <button
        disabled={saving}
        onClick={() => updateLead({
          visited:   !lead.visited,
          is_online: false,
          status:    lead.visited ? 'responded' : 'presential',
        })}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border disabled:opacity-40 ${
          lead.visited
            ? 'bg-orange-600 text-white border-orange-600'
            : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white'
        }`}
      >
        <MapPin size={12} /> Presencial
      </button>

      <button
        disabled={saving}
        onClick={() => updateLead({ is_online: !lead.is_online, visited: false })}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border disabled:opacity-40 ${
          lead.is_online
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white'
        }`}
      >
        <Laptop size={12} /> Online
      </button>

      <button
        disabled={saving}
        onClick={() => updateLead({ status: 'converted' })}
        className="ml-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 disabled:opacity-40"
      >
        Matricular
      </button>
    </div>
  )
}

// ─── DeleteButton ─────────────────────────────────────────────────────────────

function DeleteButton({ leadId, onDeleted, supabase }: {
  leadId: string
  onDeleted: () => void
  supabase: ReturnType<typeof createBrowserClient>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase.from('sales_leads').delete().eq('id', leadId)
      if (error) throw error
      toast.success('Lead removido.')
      onDeleted()
    } catch (e) {
      console.error('[SchoolRise] Erro ao deletar:', e)
      toast.error('Erro ao remover lead.')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-red-700 transition-all disabled:opacity-50"
        >
          {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:bg-slate-200 transition-all"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
    >
      <Trash2 size={16} />
    </button>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}

// ─── LeadsTable ───────────────────────────────────────────────────────────────

interface LeadsTableProps {
  onUpdate: () => void
  viewMode?: ViewMode
  externalYear?: string
  metricFilter?: string | null
  userRole?: 'admin' | 'staff'   // controla visibilidade do SellerAssignSelect
}

export function LeadsTable({
  onUpdate,
  viewMode = 'all',
  externalYear,
  metricFilter,
  userRole = 'staff',
}: LeadsTableProps) {
  const [leads,           setLeads]           = useState<Lead[]>([])
  const [loading,         setLoading]         = useState(true)
  const [searchTerm,      setSearchTerm]      = useState('')
  const [selectedMonth,   setSelectedMonth]   = useState('all')
  const [filterStatus,    setFilterStatus]    = useState<FilterStatus>('all')
  const [onlyTodayReturn, setOnlyTodayReturn] = useState(false)
  const [selectedLead,    setSelectedLead]    = useState<Lead | null>(null)
  const [isEditOpen,      setIsEditOpen]      = useState(false)

  // ── Cliente único por instância do componente ─────────────────────────────
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setLeads((data ?? []) as Lead[])
    } catch (e) {
      console.error('[SchoolRise] Erro ao buscar leads:', e)
      toast.error('Erro ao carregar leads.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleUpdate = useCallback(() => {
    fetchLeads()
    onUpdate()
  }, [fetchLeads, onUpdate])

  // ── Filtros ───────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const year = externalYear ?? '2026'

    return leads.filter(l => {
      const date   = new Date(l.created_at)
      const status = String(l.status ?? '').toLowerCase().trim()

      // viewMode guard
      if (viewMode === 'leads' && (status === 'presential' || status === 'converted')) return false
      if (viewMode === 'admin' && status !== 'presential' && status !== 'converted')   return false

      // ano
      if (date.getUTCFullYear().toString() !== year) return false

      // mês
      if (selectedMonth !== 'all' && date.getUTCMonth().toString() !== selectedMonth) return false

      // status dropdown
      if (filterStatus !== 'all' && status !== filterStatus) return false

      // retorno hoje
      if (onlyTodayReturn && !(isReturnToday(l.return_date) && status !== 'converted')) return false

      // busca
      const q = searchTerm.toLowerCase()
      if (q && !l.student_name?.toLowerCase().includes(q) && !l.course?.toLowerCase().includes(q)) return false

      // metricFilter
      if (metricFilter) {
        switch (metricFilter) {
          case 'Msgs Enviadas':    return !!l.contact_made
          case 'Faltam Enviar':   return !l.contact_made && status !== 'converted' && status !== 'canceled'
          case 'Responderam':     return !!l.has_responded
          case 'Não Responderam': return !!l.contact_made && !l.has_responded && status !== 'converted'
          case 'Agendados':       return !!l.scheduled
          case 'Presenciais':     return !!l.visited
          case 'Atend. Online':   return !!l.is_online
          case 'Não Compareceu':  return !!l.no_show
          case 'Matrículas':      return status === 'converted'
          default:                return true
        }
      }

      return true
    })
  }, [leads, viewMode, externalYear, selectedMonth, filterStatus, onlyTodayReturn, searchTerm, metricFilter])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* FILTROS */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Pesquisar aluno ou curso..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOnlyTodayReturn(!onlyTodayReturn)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
              onlyTodayReturn ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Bell size={14} /> Retornos Hoje
          </button>
          <select
            className="px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none hover:bg-slate-100 transition-all"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="all">Todos os meses</option>
            {MONTHS.map((m, i) => <option key={m} value={i.toString()}>{m}</option>)}
          </select>
          <select
            className="px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none hover:bg-slate-100 transition-all"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="all">Todos os status</option>
            <option value="contacted">Contatado</option>
            <option value="responded">Respondeu</option>
            <option value="scheduled">Agendado</option>
            <option value="presential">Presencial</option>
            <option value="converted">Matriculado</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* TABELA */}
      {loading ? <TableSkeleton /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <th className="p-5 w-8">   </th>
                <th className="p-5">Aluno</th>
                <th className="p-5">Ações Rápidas</th>
                <th className="p-5">Curso / Origem</th>
                <th className="p-5">Vendedor</th>
                <th className="p-5">Valor</th>
                <th className="p-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(l => {
                const statusInfo  = getStatusInfo(l.status)
                const needsReturn = isReturnToday(l.return_date) && l.status !== 'converted'

                return (
                  <tr
                    key={l.id}
                    className={`border-b border-slate-50 group transition-all ${
                      needsReturn ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Indicador */}
                    <td className="p-5">
                      {needsReturn
                        ? <AlertCircle className="text-amber-500 animate-pulse" size={18} />
                        : <div className={`w-2.5 h-2.5 rounded-full ${l.status === 'converted' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      }
                    </td>

                    {/* Aluno */}
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{l.student_name ?? '—'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(l.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`mt-1 w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>

                    {/* Ações rápidas */}
                    <td className="p-5">
                      <StatusTracker lead={l} onUpdate={handleUpdate} supabase={supabase} />
                    </td>

                    {/* Curso / Origem */}
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-600">{l.course ?? '—'}</span>
                        <span className="flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase mt-0.5">
                          <Megaphone size={10} /> {l.campaign || l.source || 'Direto'}
                        </span>
                      </div>
                    </td>

                    {/* Vendedor — admin atribui, staff só vê */}
                    <td className="p-5">
                      <SellerAssignSelect
                        leadId={l.id}
                        currentAssignedId={l.assigned_to}
                        onAssigned={handleUpdate}
                        disabled={userRole !== 'admin'}
                      />
                    </td>

                    {/* Valor */}
                    <td className="p-5 font-black text-slate-900 whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        Number(l.value) || 0
                      )}
                    </td>

                    {/* Ações */}
                    <td className="p-5 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setSelectedLead(l); setIsEditOpen(true) }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <DeleteButton leadId={l.id} onDeleted={handleUpdate} supabase={supabase} />
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
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                Nenhum registro em {metricFilter ?? 'esta categoria'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* EDIT DIALOG */}
      {isEditOpen && selectedLead && (
        <EditLeadDialog
          lead={selectedLead}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}