'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { GrowthChart } from '@/components/dashboard/GrowthChart'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { AddLeadDialog } from '@/components/dashboard/AddLeadDialog'
import { CommercialMetrics } from '@/components/dashboard/CommercialMetrics'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Settings2, 
  ShieldCheck, 
  Filter
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'estrategico' | 'administrativo'>('estrategico')
  
  // ESTADO PARA O FUNIL
  const [allLeads, setAllLeads] = useState<any[]>([])
  
  const [chartData, setChartData] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  
  // METAS COM PERSISTÊNCIA (LocalStorage)
  const [monthlyGoal, setMonthlyGoal] = useState(95000)
  const [annualGoal, setAnnualGoal] = useState(1140000)
  const [enrollmentGoal, setEnrollmentGoal] = useState(50)

  const [stats, setStats] = useState({
    totalMatriculas: 0,
    matriculadosMes: 0,
    totalRevenueMonth: 0,
    totalRevenueYear: 0,
    monthName: '',
    conversionRate: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Efeito para carregar metas salvas ao iniciar
  useEffect(() => {
    const savedMonthly = localStorage.getItem('schoolrise_monthlyGoal')
    const savedAnnual = localStorage.getItem('schoolrise_annualGoal')
    const savedEnrollment = localStorage.getItem('schoolrise_enrollmentGoal')

    if (savedMonthly) setMonthlyGoal(Number(savedMonthly))
    if (savedAnnual) setAnnualGoal(Number(savedAnnual))
    if (savedEnrollment) setEnrollmentGoal(Number(savedEnrollment))
  }, [])

  // 2. Efeitos para salvar metas quando alteradas
  useEffect(() => { localStorage.setItem('schoolrise_monthlyGoal', monthlyGoal.toString()) }, [monthlyGoal])
  useEffect(() => { localStorage.setItem('schoolrise_annualGoal', annualGoal.toString()) }, [annualGoal])
  useEffect(() => { localStorage.setItem('schoolrise_enrollmentGoal', enrollmentGoal.toString()) }, [enrollmentGoal])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: leads, error } = await supabase.from('sales_leads').select('*').order('created_at', { ascending: false })
      if (error) throw error

      if (leads) {
        setAllLeads(leads)
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = parseInt(selectedYear)

        const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

        let revenueYear = 0
        const updatedChartData = monthsLabels.map((monthName, index) => {
          const leadsDoMesConvertidos = leads.filter(l => {
            const d = new Date(l.created_at)
            return d.getFullYear() === currentYear && d.getMonth() === index && l.status === 'converted'
          })

          const faturado = leadsDoMesConvertidos.reduce((acc, l) => acc + (Number(l.value) || 0), 0)
          revenueYear += faturado

          // AGRUPAMENTO POR ORIGEM (Para o clique no gráfico funcionar)
          const detailsMap: Record<string, any> = {}
          leadsDoMesConvertidos.forEach(l => {
            const rawOrigin = l.campaign || l.utm_source || l.source || l.origem || l.canal || l.origin || 'DIRETO/ORGÂNICO'
            const originName = String(rawOrigin).trim().toUpperCase()
            
            if (!detailsMap[originName]) {
              detailsMap[originName] = { name: originName, value: 0, count: 0 }
            }
            detailsMap[originName].value += Number(l.value) || 0
            detailsMap[originName].count += 1
          })

          return { 
            month: monthName, 
            faturamento: faturado,
            details: Object.values(detailsMap) 
          }
        })

        const dataMesAtual = leads.filter(l => {
          const d = new Date(l.created_at)
          return d.getMonth() === currentMonth && d.getFullYear() === now.getFullYear()
        })
        const matriculasMes = dataMesAtual.filter(l => l.status === 'converted')
        
        setChartData(updatedChartData)
        setStats({
          totalMatriculas: leads.filter(l => l.status === 'converted').length,
          matriculadosMes: matriculasMes.length,
          totalRevenueMonth: matriculasMes.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
          totalRevenueYear: revenueYear,
          monthName: monthsLabels[currentMonth],
          conversionRate: dataMesAtual.length > 0 ? (matriculasMes.length / dataMesAtual.length) * 100 : 0,
        })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [supabase, selectedYear])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  const healthScore = (stats.matriculadosMes / (enrollmentGoal || 1)) * 100
  const getHealthColor = () => {
    if (healthScore < 50) return 'bg-red-500'
    if (healthScore < 85) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-8 space-y-8 text-slate-900 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-indigo-600">SchoolRise</h1>
          <p className="text-slate-500 font-medium">Gestão Descomplicada • {stats.monthName}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
          <div className="flex flex-col border-r pr-4 border-slate-100">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Meta Mensal</label>
            <input type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(Number(e.target.value))} className="text-sm font-bold outline-none w-24 bg-transparent focus:text-indigo-600 transition-colors" />
          </div>
          <div className="flex flex-col border-r pr-4 border-slate-100">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Meta Anual</label>
            <input type="number" value={annualGoal} onChange={(e) => setAnnualGoal(Number(e.target.value))} className="text-sm font-bold outline-none w-28 bg-transparent focus:text-indigo-600 transition-colors" />
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Meta Alunos</label>
            <input type="number" value={enrollmentGoal} onChange={(e) => setEnrollmentGoal(Number(e.target.value))} className="text-sm font-bold outline-none w-12 bg-transparent focus:text-indigo-600 transition-colors" />
          </div>
          <div className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-indigo-600 cursor-help"><Settings2 size={18} /></div>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white px-4 py-2 rounded-2xl border border-slate-100 text-xs font-black uppercase outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <AddLeadDialog onUpdate={loadDashboardData} />
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <div className="flex justify-center md:justify-start mb-6">
        <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1 border border-slate-200">
          <button onClick={() => setView('estrategico')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'estrategico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Activity size={14} /> Estratégico
          </button>
          <button onClick={() => setView('administrativo')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'administrativo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <ShieldCheck size={14} /> Administrativo
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA ESTRATÉGICO */}
      {view === 'estrategico' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between h-[180px]">
              <div className="flex justify-between items-center"><p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Saúde da Escola</p><Activity size={18} className="text-slate-300" /></div>
              <div><h3 className="text-3xl font-black text-slate-900">{healthScore.toFixed(0)}%</h3><p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{stats.matriculadosMes} de {enrollmentGoal} matrículas</p></div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><div className={`${getHealthColor()} h-full transition-all duration-1000`} style={{ width: `${Math.min(healthScore, 100)}%` }} /></div>
            </div>
            <StatCardRing title="Faturamento Mês" value={stats.totalRevenueMonth} goal={monthlyGoal} icon={<DollarSign size={16} />} color="text-indigo-600" strokeColor="stroke-indigo-600" />
            <StatCardRing title="Faturamento Ano" value={stats.totalRevenueYear} goal={annualGoal} icon={<Target size={16} />} color="text-emerald-500" strokeColor="stroke-emerald-500" />
            <StatCardRing title="Conversão" value={stats.conversionRate} goal={100} icon={<TrendingUp size={16} />} color="text-blue-600" strokeColor="stroke-blue-600" isPercent />
          </div>
          <div className="bg-white p-2 rounded-[40px] border border-slate-100 shadow-sm">
            <GrowthChart data={chartData} />
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA ADMINISTRATIVO */}
      {view === 'administrativo' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Funil de Vendas</h2>
            <CommercialMetrics leads={allLeads} />
          </div>

          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-2">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-xl"><Filter size={16}/></div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão de Leads</h2>
              </div>
            </div>
            <LeadsTable onUpdate={loadDashboardData} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCardRing({ title, value, goal, icon, color, strokeColor, isPercent }: any) {
  const percentage = Math.min((value / (goal || 1)) * 100, 100)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between h-[180px]">
      <div className="flex flex-col justify-between h-full py-1">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">{title}</p>
          <div className={`p-2 bg-slate-50 rounded-xl w-fit ${color}`}>{icon}</div>
        </div>
        <h3 className="text-xl font-black text-slate-900">
          {isPercent ? `${value.toFixed(1)}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)}
        </h3>
      </div>
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} strokeLinecap="round" className={`${strokeColor}`} />
        </svg>
        <span className="absolute text-[12px] font-black text-slate-900">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}