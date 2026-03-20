'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { AddLeadDialog } from '@/components/dashboard/AddLeadDialog'
import { CommercialMetrics } from '@/components/dashboard/CommercialMetrics'
import { useSchoolSettings } from '@/hooks/useSchoolSettings'
import {
  Target, Users, Trophy, Medal,
  AlertTriangle, XCircle,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  created_at: string
  status: string | null
  value?: string | number | null
  assigned_to?: string | null
  user_id?: string | null
}

interface Profile {
  id: string
  full_name: string
  school_id?: string | null
}

interface SellerRank {
  id: string
  name: string
  converted: number
  revenue: number
  totalLeads: number
  conversionRate: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function parseLeadValue(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0
  const n = parseFloat(String(raw).replace(/[R$\s.]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function isConverted(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase().trim() === 'converted'
}

function getResponsibleId(lead: Lead): string {
  return lead.assigned_to || lead.user_id || 'desconhecido'
}

// ─── Componente: Meta Card ────────────────────────────────────────────────────

function GoalReadCard({
  label, current, goal, isPercent = false,
}: {
  label: string; current: number; goal: number; isPercent?: boolean
}) {
  const pct = Math.min((current / (goal || 1)) * 100, 100)

  const formatted = isPercent
    ? `${current.toFixed(1)}%`
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(current)

  const goalFormatted = isPercent
    ? `${goal}%`
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(goal)

  const barColor = pct < 40 ? 'bg-red-500' : pct < 75 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="bg-card p-5 rounded-[28px] border border-border shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <Target size={14} className="text-muted-foreground/40" />
      </div>
      <div>
        <h3 className="text-2xl font-black text-foreground">{formatted}</h3>
        <p className="text-[10px] text-muted-foreground font-bold mt-0.5">meta: {goalFormatted}</p>
      </div>
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div className={`${barColor} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] font-black text-muted-foreground -mt-1">{pct.toFixed(0)}% da meta</p>
    </div>
  )
}

// ─── Componente: Ranking ──────────────────────────────────────────────────────

function SellerRanking({ sellers }: { sellers: SellerRank[] }) {
  const medals = [
    { color: 'text-amber-500',  bg: 'bg-amber-50'  },
    { color: 'text-slate-400',  bg: 'bg-slate-50'  },
    { color: 'text-orange-400', bg: 'bg-orange-50' },
  ]

  if (sellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
        <Trophy size={32} className="mb-2" />
        <p className="text-xs font-black uppercase tracking-wide">Nenhum dado ainda</p>
      </div>
    )
  }

  const maxConv = sellers[0]?.converted || 1

  return (
    <div className="space-y-1 p-2">
      {sellers.map((seller, i) => {
        const medal  = medals[i] ?? { color: 'text-muted-foreground/40', bg: 'bg-muted' }
        const barPct = (seller.converted / maxConv) * 100
        return (
          <div key={seller.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted/50 transition-colors">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${medal.bg} ${medal.color}`}>
              {i === 0 ? <Trophy size={15} /> : i === 1 ? <Medal size={15} /> : i === 2 ? <Medal size={15} /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-black text-foreground truncate">{seller.name}</p>
                <span className="text-xs font-black text-muted-foreground shrink-0 ml-2">{seller.converted} matr.</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-black text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(seller.revenue)}
              </p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase">{seller.conversionRate.toFixed(0)}% conv.</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonGoals() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card p-5 rounded-[28px] border border-border h-[140px] animate-pulse">
          <div className="h-2 bg-muted rounded w-1/2 mb-3" />
          <div className="h-7 bg-muted rounded w-2/3 mb-4" />
          <div className="h-2 bg-muted rounded w-full" />
        </div>
      ))}
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="p-6 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  )
}

function SkeletonRanking() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  )
}

// ─── Página Staff ─────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const [dataLoading,  setDataLoading]  = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [allLeads,     setAllLeads]     = useState<Lead[]>([])
  const [profiles,     setProfiles]     = useState<Profile[]>([])
  const [schoolId,     setSchoolId]     = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState('2026')
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null)

  const { goals } = useSchoolSettings(schoolId)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Perfil ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single()
        setSchoolId(profile?.school_id ?? null)
      } catch (e) {
        console.error('[SchoolRise] Erro ao carregar perfil:', e)
      }
    }
    loadProfile()
  }, [supabase])

  // ── Dados ─────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setDataLoading(true)
      setError(null)

      const [leadsRes, profilesRes] = await Promise.all([
        supabase.from('sales_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, school_id'),
      ])

      if (leadsRes.error)    throw leadsRes.error
      if (profilesRes.error) throw profilesRes.error

      setAllLeads((leadsRes.data   ?? []) as Lead[])
      setProfiles((profilesRes.data ?? []) as Profile[])
    } catch (e) {
      console.error('[SchoolRise] Erro ao carregar dados:', e)
      setError('Não foi possível carregar os dados. Verifique sua conexão.')
    } finally {
      setDataLoading(false)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // ── Mapa id → nome ────────────────────────────────────────────────────────
  const profileMap = useMemo(() => {
    const map: Record<string, string> = {}
    profiles.forEach(p => { map[p.id] = p.full_name || 'Vendedor' })
    return map
  }, [profiles])

  // ── Stats do mês ──────────────────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const now      = new Date()
    const mesIdx   = now.getMonth()
    const leadsMes = allLeads.filter(l => {
      if (!l.created_at) return false
      const d = new Date(l.created_at)
      return d.getUTCMonth() === mesIdx && d.getUTCFullYear().toString() === selectedYear
    })
    const convertidos = leadsMes.filter(l => isConverted(l.status))
    const revenue     = convertidos.reduce((acc, l) => acc + parseLeadValue(l.value), 0)
    const conversion  = leadsMes.length > 0 ? (convertidos.length / leadsMes.length) * 100 : 0
    return { leadsMes: leadsMes.length, convertidos: convertidos.length, revenue, conversion, monthName: MONTHS[mesIdx] }
  }, [allLeads, selectedYear])

  // ── Ranking ───────────────────────────────────────────────────────────────
  const sellerRanking = useMemo((): SellerRank[] => {
    const now    = new Date()
    const mesIdx = now.getMonth()
    const leadsMes = allLeads.filter(l => {
      if (!l.created_at) return false
      const d = new Date(l.created_at)
      return d.getUTCMonth() === mesIdx && d.getUTCFullYear().toString() === selectedYear
    })

    const map: Record<string, { converted: number; revenue: number; total: number }> = {}
    leadsMes.forEach(l => {
      const id = getResponsibleId(l)
      if (!map[id]) map[id] = { converted: 0, revenue: 0, total: 0 }
      map[id].total += 1
      if (isConverted(l.status)) {
        map[id].converted += 1
        map[id].revenue   += parseLeadValue(l.value)
      }
    })

    return Object.entries(map)
      .map(([id, data]) => ({
        id,
        name:           profileMap[id] ?? 'Vendedor desconhecido',
        converted:      data.converted,
        revenue:        data.revenue,
        totalLeads:     data.total,
        conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.converted - a.converted || b.revenue - a.revenue)
  }, [allLeads, selectedYear, profileMap])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6 text-foreground font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-indigo-600">SchoolRise</h1>
          <p className="text-muted-foreground font-medium tracking-wide">
            Comercial • {monthStats.monthName} {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-card px-4 py-2 rounded-2xl border border-border text-xs font-black uppercase outline-none shadow-sm cursor-pointer"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <AddLeadDialog onUpdate={loadData} />
        </div>
      </div>

      {/* ERRO */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-xs font-black uppercase tracking-wide">{error}</p>
          <button onClick={loadData} className="ml-auto text-xs font-black underline hover:no-underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* METAS */}
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 px-1">
          Metas do Mês
        </p>
        {dataLoading ? <SkeletonGoals /> : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GoalReadCard label={`Matrículas — ${monthStats.monthName}`} current={monthStats.convertidos} goal={goals.enrollmentGoal} />
            <GoalReadCard label={`Receita — ${monthStats.monthName}`}    current={monthStats.revenue}     goal={goals.monthlyGoal}    />
            <GoalReadCard label="Conversão de Leads" current={monthStats.conversion} goal={30} isPercent />
          </div>
        )}
      </div>

      {/* ✅ CommercialMetrics — staff vê os cards de funil e pode filtrar leads */}
      {!dataLoading && (
        <CommercialMetrics
          leads={allLeads}
          onFilterClick={(f: string) => setActiveMetricFilter(f === activeMetricFilter ? null : f)}
          activeFilter={activeMetricFilter}
        />
      )}

      {/* GRID: Leads + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEADS */}
        <div className="lg:col-span-2 bg-card rounded-[40px] border border-border shadow-sm p-2">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl"><Users size={16} /></div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                {activeMetricFilter ? `Filtrando: ${activeMetricFilter}` : 'Prospecção e Leads'}
              </h2>
            </div>
            {activeMetricFilter && (
              <button
                onClick={() => setActiveMetricFilter(null)}
                className="flex items-center gap-2 px-3 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-[10px] font-black uppercase transition-all"
              >
                <XCircle size={14} /> Limpar Filtro
              </button>
            )}
          </div>
          {dataLoading ? <SkeletonTable /> : (
            <LeadsTable
              onUpdate={loadData}
              externalYear={selectedYear}
              viewMode="leads"
              metricFilter={activeMetricFilter}
              userRole="staff"
            />
          )}
        </div>

        {/* RANKING */}
        <div className="bg-card rounded-[40px] border border-border shadow-sm p-2 flex flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl"><Trophy size={16} /></div>
            <div>
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight leading-none">Ranking</h2>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                {monthStats.monthName} {selectedYear}
              </p>
            </div>
          </div>
          {dataLoading ? <SkeletonRanking /> : (
            <>
              <SellerRanking sellers={sellerRanking} />
              <div className="mt-auto p-4 pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Leads</p>
                  <p className="text-xl font-black text-foreground">{monthStats.leadsMes}</p>
                </div>
                <div className="bg-indigo-50 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Conversão</p>
                  <p className="text-xl font-black text-indigo-600">{monthStats.conversion.toFixed(0)}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}