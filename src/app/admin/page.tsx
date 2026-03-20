'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { GrowthChart } from '@/components/dashboard/GrowthChart'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { AddLeadDialog } from '@/components/dashboard/AddLeadDialog'
import { CommercialMetrics } from '@/components/dashboard/CommercialMetrics'
import { useSchoolSettings } from '@/hooks/useSchoolSettings'
import type { GoalState } from '@/hooks/useSchoolSettings'
import {
  Target, TrendingUp, TrendingDown, DollarSign, Activity,
  Settings2, ShieldCheck, Users, LayoutDashboard, XCircle,
  AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'staff'
type ViewTab  = 'estrategico' | 'comercial' | 'administrativo'

interface Lead {
  id: string
  created_at: string
  status: string
  value: string | number | null
  campaign?: string
  utm_source?: string
  source?: string
}

interface DashboardStats {
  totalMatriculas: number
  matriculadosMes: number
  matriculadosMesAnterior: number
  totalRevenueMonth: number
  totalRevenueMonthAnterior: number
  totalRevenueYear: number
  monthName: string
  conversionRate: number
  conversionRateAnterior: number
  totalLeadsMes: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function parseLeadValue(raw: string | number | null): number {
  if (raw === null || raw === undefined) return 0
  const n = parseFloat(String(raw).replace(/[R$\s.]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function isConverted(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase().trim() === 'converted'
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ─── ISE ──────────────────────────────────────────────────────────────────────

interface ISEInput {
  matriculadosMes: number
  enrollmentGoal: number
  conversionRate: number
  totalRevenueMonth: number
  monthlyGoal: number
  totalLeadsMes: number
}

export interface ISEBreakdown {
  score: number
  crescimento: number
  conversao: number
  retencao: number
  engajamento: number
}

function calcISE(i: ISEInput): ISEBreakdown {
  const crescimento = Math.min((i.matriculadosMes / (i.enrollmentGoal || 1)) * 100, 100)
  const conversao   = Math.min(i.conversionRate, 100)
  const retencao    = Math.min((i.totalRevenueMonth / (i.monthlyGoal || 1)) * 100, 100)
  const engajamento = Math.min((i.totalLeadsMes / ((i.enrollmentGoal || 1) * 3)) * 100, 100)
  const score       = crescimento * 0.4 + conversao * 0.3 + retencao * 0.2 + engajamento * 0.1
  return { score, crescimento, conversao, retencao, engajamento }
}

function getISEMeta(score: number) {
  if (score < 40) return { bg: 'bg-red-500',     text: 'text-red-600',     label: 'Crítico'    }
  if (score < 70) return { bg: 'bg-amber-500',   text: 'text-amber-600',   label: 'Atenção'    }
  if (score < 90) return { bg: 'bg-emerald-500', text: 'text-emerald-600', label: 'Bom'        }
  return               { bg: 'bg-indigo-600',  text: 'text-indigo-600',  label: 'Excelente' }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function AlertBanner({ score }: { score: number }) {
  if (score >= 50) return null
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-red-700 animate-in slide-in-from-top duration-500">
      <AlertTriangle size={18} className="shrink-0" />
      <p className="text-xs font-black uppercase tracking-wide">
        Alerta: ISE crítico ({score.toFixed(0)}/100) — Performance abaixo do esperado. Revise metas e conversão.
      </p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm h-[180px] animate-pulse">
      <div className="h-3 bg-muted rounded w-1/2 mb-4" />
      <div className="h-8 bg-muted rounded w-2/3 mb-6" />
      <div className="h-3 bg-muted rounded w-full" />
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="bg-card rounded-[40px] border border-border shadow-sm h-[450px] animate-pulse" />
    </div>
  )
}

function TrendBadge({ trend }: { trend: number }) {
  const positive = trend >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-black ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(trend).toFixed(1)}%
    </span>
  )
}

function NavButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function ISECard({ ise }: { ise: ISEBreakdown }) {
  const meta = getISEMeta(ise.score)
  const pillars = [
    { label: 'Crescimento', value: ise.crescimento },
    { label: 'Conversão',   value: ise.conversao   },
    { label: 'Retenção',    value: ise.retencao    },
    { label: 'Engajamento', value: ise.engajamento },
  ]
  return (
    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex flex-col justify-between h-[180px]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Índice de Saúde (ISE)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-foreground">{ise.score.toFixed(0)}</h3>
            <span className="text-xs text-muted-foreground font-bold">/100</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-muted ${meta.text}`}>{meta.label}</span>
          </div>
        </div>
        <Activity size={18} className="text-muted-foreground/40" />
      </div>
      <div className="space-y-1.5">
        {pillars.map(p => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground font-black uppercase w-20 shrink-0">{p.label}</span>
            <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
              <div className={`${meta.bg} h-full transition-all duration-1000`} style={{ width: `${Math.min(p.value, 100)}%` }} />
            </div>
            <span className="text-[9px] font-black text-muted-foreground w-8 text-right">{p.value.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCardRing({ title, value, goal, icon, color, strokeColor, isPercent, trend }: {
  title: string; value: number; goal: number; icon: React.ReactNode
  color: string; strokeColor: string; isPercent?: boolean; trend?: number
}) {
  const percentage    = Math.min((value / (goal || 1)) * 100, 100)
  const radius        = 36
  const circumference = 2 * Math.PI * radius
  const offset        = circumference - (percentage / 100) * circumference
  const formatted     = isPercent
    ? `${value.toFixed(1)}%`
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

  return (
    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex items-center justify-between h-[180px]">
      <div className="flex flex-col justify-between h-full py-1">
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{title}</p>
          <div className={`p-2 bg-muted rounded-xl w-fit ${color}`}>{icon}</div>
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground leading-tight">{formatted}</h3>
          {trend !== undefined && <TrendBadge trend={trend} />}
        </div>
      </div>
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="transparent" className="stroke-muted" />
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round" className={strokeColor}
          />
        </svg>
        <span className="absolute text-[12px] font-black text-foreground">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function GoalInputs({ goals, onChange, onSave, saveStatus }: {
  goals: GoalState
  onChange: (key: keyof GoalState, value: number) => void
  onSave: () => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}) {
  const statusIcon = {
    idle:   <Settings2    size={18} />,
    saving: <Loader2      size={18} className="animate-spin" />,
    saved:  <CheckCircle2 size={18} />,
    error:  <AlertTriangle size={18} />,
  }[saveStatus]

  const statusClass = {
    idle:   'bg-muted text-muted-foreground hover:text-indigo-600',
    saving: 'bg-muted text-indigo-400',
    saved:  'bg-emerald-50 text-emerald-500',
    error:  'bg-red-50 text-red-500',
  }[saveStatus]

  const fields: { key: keyof GoalState; label: string; widthPx: number }[] = [
    { key: 'monthlyGoal',    label: 'Meta Mês',    widthPx: 96  },
    { key: 'annualGoal',     label: 'Meta Ano',    widthPx: 112 },
    { key: 'enrollmentGoal', label: 'Meta Alunos', widthPx: 48  },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-[24px] shadow-sm border border-border">
      {fields.map((f, i) => (
        <div key={f.key} className={`flex flex-col ${i < fields.length - 1 ? 'border-r pr-4 border-border' : ''}`}>
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{f.label}</label>
          <input
            type="number"
            value={goals[f.key]}
            onChange={e => onChange(f.key, Number(e.target.value))}
            onBlur={onSave}
            style={{ width: f.widthPx }}
            className="text-sm font-bold outline-none bg-transparent focus:text-indigo-600 transition-colors text-foreground"
          />
        </div>
      ))}
      <button
        onClick={onSave}
        title={saveStatus === 'error' ? 'Erro ao salvar — clique para tentar de novo' : 'Salvo automaticamente'}
        className={`p-2 rounded-xl transition-all ${statusClass}`}
      >
        {statusIcon}
      </button>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [roleLoaded,   setRoleLoaded]   = useState(false)
  const [dataLoading,  setDataLoading]  = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [userRole,     setUserRole]     = useState<UserRole>('staff')
  const [schoolId,     setSchoolId]     = useState<string | null>(null)
  const [view,         setView]         = useState<ViewTab>('comercial')
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null)
  const [allLeads,     setAllLeads]     = useState<Lead[]>([])
  const [chartData,    setChartData]    = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState('2026')

  const [stats, setStats] = useState<DashboardStats>({
    totalMatriculas: 0, matriculadosMes: 0, matriculadosMesAnterior: 0,
    totalRevenueMonth: 0, totalRevenueMonthAnterior: 0, totalRevenueYear: 0,
    monthName: '', conversionRate: 0, conversionRateAnterior: 0, totalLeadsMes: 0,
  })

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const { goals, updateGoal, persistGoals, persistISE, saveStatus } = useSchoolSettings(schoolId)

  // ── Perfil ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setRoleLoaded(true); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, school_id')
          .eq('id', user.id)
          .single()

        const role: UserRole = profile?.role === 'admin' ? 'admin' : 'staff'
        setUserRole(role)
        setSchoolId(profile?.school_id ?? null)
        setView(role === 'admin' ? 'estrategico' : 'comercial')
      } catch (e) {
        console.error('[SchoolRise] Erro ao carregar perfil:', e)
      } finally {
        setRoleLoaded(true)
      }
    }
    getUserProfile()
  }, [supabase])

  // ── Dados ──────────────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    try {
      setDataLoading(true)
      setError(null)

      const { data: leads, error: dbError } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (dbError) throw dbError
      if (!leads) return

      setAllLeads(leads as Lead[])

      const now       = new Date()
      const mesIdx    = now.getMonth()
      const mesAntIdx = mesIdx === 0 ? 11 : mesIdx - 1
      const anoAntStr = mesIdx === 0 ? String(Number(selectedYear) - 1) : selectedYear

      let revenueYear = 0
      const chart = MONTHS.map((monthName, idx) => {
        const converted = leads.filter(l => {
          if (!l.created_at) return false
          const d = new Date(l.created_at)
          return d.getUTCFullYear().toString() === selectedYear && d.getUTCMonth() === idx && isConverted(l.status)
        })
        const faturado = converted.reduce((acc, l) => acc + parseLeadValue(l.value), 0)
        revenueYear += faturado
        const detailsMap: Record<string, { name: string; value: number; count: number }> = {}
        converted.forEach(l => {
          const name = String(l.campaign || l.utm_source || l.source || 'DIRETO').trim().toUpperCase()
          if (!detailsMap[name]) detailsMap[name] = { name, value: 0, count: 0 }
          detailsMap[name].value += parseLeadValue(l.value)
          detailsMap[name].count += 1
        })
        return { month: monthName, faturamento: faturado, details: Object.values(detailsMap) }
      })

      const leadsMes    = leads.filter(l => l.created_at
        && new Date(l.created_at).getUTCMonth() === mesIdx
        && new Date(l.created_at).getUTCFullYear().toString() === selectedYear)
      const leadsMesAnt = leads.filter(l => l.created_at
        && new Date(l.created_at).getUTCMonth() === mesAntIdx
        && new Date(l.created_at).getUTCFullYear().toString() === anoAntStr)
      const matricMes    = leadsMes.filter(l    => isConverted(l.status))
      const matricMesAnt = leadsMesAnt.filter(l => isConverted(l.status))

      setChartData(chart)
      setStats({
        totalMatriculas:           leads.filter(l => isConverted(l.status)).length,
        matriculadosMes:           matricMes.length,
        matriculadosMesAnterior:   matricMesAnt.length,
        totalRevenueMonth:         chart[mesIdx]?.faturamento    ?? 0,
        totalRevenueMonthAnterior: chart[mesAntIdx]?.faturamento ?? 0,
        totalRevenueYear:          revenueYear,
        monthName:                 MONTHS[mesIdx],
        conversionRate:            leadsMes.length    > 0 ? (matricMes.length    / leadsMes.length)    * 100 : 0,
        conversionRateAnterior:    leadsMesAnt.length > 0 ? (matricMesAnt.length / leadsMesAnt.length) * 100 : 0,
        totalLeadsMes:             leadsMes.length,
      })
    } catch (e) {
      console.error('[SchoolRise] Erro ao carregar dados:', e)
      setError('Não foi possível carregar os dados. Verifique sua conexão.')
    } finally {
      setDataLoading(false)
    }
  }, [supabase, selectedYear])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  // ── ISE ────────────────────────────────────────────────────────────────────
  const ise = useMemo(() => calcISE({
    matriculadosMes:   stats.matriculadosMes,
    enrollmentGoal:    goals.enrollmentGoal,
    conversionRate:    stats.conversionRate,
    totalRevenueMonth: stats.totalRevenueMonth,
    monthlyGoal:       goals.monthlyGoal,
    totalLeadsMes:     stats.totalLeadsMes,
  }), [stats, goals])

  useEffect(() => {
    if (!dataLoading && userRole === 'admin' && schoolId) persistISE(ise, schoolId)
  }, [dataLoading, userRole, schoolId, ise, persistISE])

  // ── Tendências ─────────────────────────────────────────────────────────────
  const trends = useMemo(() => ({
    revenue:    calcTrend(stats.totalRevenueMonth, stats.totalRevenueMonthAnterior),
    matriculas: calcTrend(stats.matriculadosMes,   stats.matriculadosMesAnterior),
    conversion: calcTrend(stats.conversionRate,    stats.conversionRateAnterior),
  }), [stats])

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!roleLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6 text-foreground font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-indigo-600">SchoolRise</h1>
          <p className="text-muted-foreground font-medium tracking-wide">Voe com direção! • {selectedYear}</p>
        </div>
        {userRole === 'admin' && (
          <GoalInputs goals={goals} onChange={updateGoal} onSave={persistGoals} saveStatus={saveStatus} />
        )}
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-card px-4 py-2 rounded-2xl border border-border text-xs font-black uppercase outline-none shadow-sm cursor-pointer"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <AddLeadDialog onUpdate={loadDashboardData} />
        </div>
      </div>

      {/* ALERTAS */}
      {userRole === 'admin' && !dataLoading && <AlertBanner score={ise.score} />}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-xs font-black uppercase tracking-wide">{error}</p>
          <button onClick={loadDashboardData} className="ml-auto text-xs font-black underline hover:no-underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* NAVEGAÇÃO */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-muted/50 p-1 rounded-2xl flex gap-1 border border-border shadow-inner">
          {userRole === 'admin' && (
            <NavButton active={view === 'estrategico'} onClick={() => { setView('estrategico'); setActiveMetricFilter(null) }} icon={<LayoutDashboard size={14} />} label="Estratégico" />
          )}
          <NavButton active={view === 'comercial'} onClick={() => { setView('comercial'); setActiveMetricFilter(null) }} icon={<Users size={14} />} label="Comercial" />
          {userRole === 'admin' && (
            <NavButton active={view === 'administrativo'} onClick={() => { setView('administrativo'); setActiveMetricFilter(null) }} icon={<ShieldCheck size={14} />} label="Administrativo" />
          )}
        </div>
      </div>

      {/* ABA ESTRATÉGICO */}
      {view === 'estrategico' && userRole === 'admin' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {dataLoading ? <SkeletonDashboard /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ISECard ise={ise} />
                <StatCardRing title={`Receita ${stats.monthName}`} value={stats.totalRevenueMonth} goal={goals.monthlyGoal} icon={<DollarSign size={16} />} color="text-indigo-600"  strokeColor="stroke-indigo-600"  trend={trends.revenue}    />
                <StatCardRing title="Receita Ano"                   value={stats.totalRevenueYear}  goal={goals.annualGoal}  icon={<Target     size={16} />} color="text-emerald-500" strokeColor="stroke-emerald-500"                           />
                <StatCardRing title="Taxa de Conversão"             value={stats.conversionRate}    goal={100}               icon={<TrendingUp size={16} />} color="text-blue-600"   strokeColor="stroke-blue-600"    isPercent trend={trends.conversion} />
              </div>

              {/* ✅ monthlyGoal passado para linha de meta no gráfico */}
              <div className="bg-card p-2 rounded-[40px] border border-border shadow-sm min-h-[450px]">
                <GrowthChart data={chartData} monthlyGoal={goals.monthlyGoal} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ABA COMERCIAL */}
      {view === 'comercial' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <CommercialMetrics
            leads={allLeads}
            onFilterClick={(f: string) => setActiveMetricFilter(f === activeMetricFilter ? null : f)}
            activeFilter={activeMetricFilter}
          />
          <div className="bg-card rounded-[40px] border border-border shadow-sm p-2">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl"><Users size={16} /></div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                  {activeMetricFilter ? `Filtrando: ${activeMetricFilter}` : 'Prospecção e Novos Leads'}
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
            <LeadsTable
              onUpdate={loadDashboardData}
              externalYear={selectedYear}
              viewMode="leads"
              metricFilter={activeMetricFilter}
              userRole={userRole}
            />
          </div>
        </div>
      )}

      {/* ABA ADMINISTRATIVO */}
      {view === 'administrativo' && userRole === 'admin' && (
        <div className="bg-card rounded-[40px] border border-border shadow-sm p-2 animate-in fade-in duration-500">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl"><ShieldCheck size={16} /></div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                Matrículas e Contratos Confirmados
              </h2>
            </div>
          </div>
          <LeadsTable
            onUpdate={loadDashboardData}
            externalYear={selectedYear}
            viewMode="admin"
            userRole="admin"
          />
        </div>
      )}

    </div>
  )
}