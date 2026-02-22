'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { GrowthChart } from '@/components/dashboard/GrowthChart'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { AddLeadDialog } from '@/components/dashboard/AddLeadDialog'
import { Calendar, Target, TrendingUp, DollarSign, Activity, Settings2, Megaphone, Zap } from 'lucide-react'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [topOrigin, setTopOrigin] = useState({ name: '', percent: 0 })

  const [monthlyGoal, setMonthlyGoal] = useState(95000)
  const [annualGoal, setAnnualGoal] = useState(1140000)
  const [enrollmentGoal, setEnrollmentGoal] = useState(50)

  const [stats, setStats] = useState({
    negotiatingLeads: 0,
    matriculadosMes: 0,
    totalRevenueMonth: 0,
    totalRevenueYear: 0,
    monthName: '',
    conversionRate: 0
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: allLeads, error } = await supabase.from('sales_leads').select('*')
      if (error) throw error

      if (allLeads) {
        const currentYearNum = parseInt(selectedYear)
        const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        let revenueYearTotal = 0
        let currentMonthDetailsArray: any[] = []
        
        const updatedChartData = monthsLabels.map((monthName, index) => {
          // 1. Filtra apenas convertidos para este mês e ano
          const leadsDoMesConvertidos = allLeads.filter(l => {
            const d = new Date(l.created_at)
            return d.getFullYear() === currentYearNum && d.getMonth() === index && l.status === 'converted'
          })

          // 2. Soma o faturamento total do mês
          const faturado = leadsDoMesConvertidos.reduce((acc, l) => acc + (Number(l.value) || 0), 0)
          revenueYearTotal += faturado

          // 3. Agrupamento Robusto por Origem
          const detailsMap: Record<string, any> = {}
          
          leadsDoMesConvertidos.forEach(l => {
            // Busca exaustiva de colunas: tenta todas as variações de nomes comuns
            const rawOrigin = l.campaign || l.utm_source || l.source || l.origem || l.canal || l.origin || 'DIRETO/ORGÂNICO'
            const originName = String(rawOrigin).trim().toUpperCase()
            
            if (!detailsMap[originName]) {
              detailsMap[originName] = { 
                name: originName, 
                value: 0, 
                count: 0 
              }
            }
            detailsMap[originName].value += Number(l.value) || 0
            detailsMap[originName].count += 1
          })

          const detailsArray = Object.values(detailsMap)
          
          // Captura os detalhes do mês de hoje (tempo real) para os avisos do topo
          if (index === new Date().getMonth()) {
            currentMonthDetailsArray = detailsArray
          }

          return { 
            month: monthName, 
            faturamento: faturado, 
            details: detailsArray // ESSENCIAL: Envia o array para o GrowthChart
          }
        })
        
        setChartData(updatedChartData)

        // Lógica de "Melhor Origem" (Avisos Rápidos)
        if (currentMonthDetailsArray.length > 0) {
          const sorted = [...currentMonthDetailsArray].sort((a, b) => b.value - a.value)
          const best = sorted[0]
          const totalMonth = currentMonthDetailsArray.reduce((acc, curr) => acc + curr.value, 0)
          setTopOrigin({ 
            name: best.name, 
            percent: totalMonth > 0 ? (best.value / totalMonth) * 100 : 0 
          })
        }

        // Estatísticas do Cabeçalho (Cards)
        const now = new Date()
        const dataMesAtual = allLeads.filter(l => {
          const d = new Date(l.created_at)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const matriculas = dataMesAtual.filter(l => l.status === 'converted')

        setStats({
          negotiatingLeads: dataMesAtual.filter(l => l.status === 'lead').length,
          matriculadosMes: matriculas.length,
          totalRevenueMonth: matriculas.reduce((acc, l) => acc + (Number(l.value) || 0), 0),
          totalRevenueYear: revenueYearTotal,
          monthName: monthsLabels[now.getMonth()],
          conversionRate: dataMesAtual.length > 0 ? (matriculas.length / dataMesAtual.length) * 100 : 0
        })
      }
    } catch (e) { 
      console.error("Erro BI:", e) 
    } finally { 
      setLoading(false) 
    }
  }, [supabase, selectedYear])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-8 space-y-6 font-sans">
      
      {/* ⚡ AVISOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-600 p-5 rounded-[28px] flex items-center gap-4 text-white shadow-xl shadow-indigo-100">
          <div className="bg-white/20 p-3 rounded-2xl"><Megaphone size={22} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Insights de Origem</p>
            <p className="text-sm font-bold">
              {topOrigin.name ? (
                <>O <span className="bg-white text-indigo-600 px-1 rounded mx-1">{topOrigin.name}</span> domina {topOrigin.percent.toFixed(0)}% das vendas!</>
              ) : "Sem dados de origem para este mês..."}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[28px] flex items-center gap-4 border border-slate-100 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><Zap size={22} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status da Meta</p>
            <p className="text-sm font-bold text-slate-700">
              {stats.totalRevenueMonth >= monthlyGoal 
                ? "🚀 Meta batida! Parabéns, Pastor!" 
                : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyGoal - stats.totalRevenueMonth)} para a meta.`}
            </p>
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">SchoolRise</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Business Intelligence</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-slate-100">
          <div className="flex flex-col border-r pr-4 border-slate-100">
            <label className="text-[9px] font-black text-slate-400 uppercase">Meta Mensal R$</label>
            <input type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(Number(e.target.value))} className="text-sm font-black outline-none w-24 text-indigo-600 focus:ring-0" />
          </div>
          <div className="flex flex-col border-r pr-4 border-slate-100">
            <label className="text-[9px] font-black text-slate-400 uppercase">Meta Alunos</label>
            <input type="number" value={enrollmentGoal} onChange={(e) => setEnrollmentGoal(Number(e.target.value))} className="text-sm font-black outline-none w-16 text-amber-600 focus:ring-0" />
          </div>
          <div className="bg-slate-50 p-2 rounded-xl text-slate-300 hover:text-indigo-500 transition-colors cursor-pointer"><Settings2 size={18} /></div>
        </div>

        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white px-4 py-2 rounded-2xl border border-slate-100 text-xs font-black uppercase outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <AddLeadDialog onUpdate={loadDashboardData} />
        </div>
      </div>

      {/* GRID DE CARDS COM ANÉIS DE PROGRESSO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardRing title="Saúde da Escola" value={(stats.matriculadosMes / (enrollmentGoal || 1)) * 100} goal={100} icon={<Activity size={16} />} color="text-slate-900" strokeColor="stroke-indigo-600" isPercent />
        <StatCardRing title="Receita Mês" value={stats.totalRevenueMonth} goal={monthlyGoal} icon={<DollarSign size={16} />} color="text-indigo-600" strokeColor="stroke-indigo-600" />
        <StatCardRing title="Receita Ano" value={stats.totalRevenueYear} goal={annualGoal} icon={<Target size={16} />} color="text-emerald-500" strokeColor="stroke-emerald-500" />
        <StatCardRing title="Conversão" value={stats.conversionRate} goal={100} icon={<TrendingUp size={16} />} color="text-blue-500" strokeColor="stroke-blue-500" isPercent />
      </div>

      {/* ÁREA DO GRÁFICO (RECHART) */}
      <div className="bg-white p-2 rounded-[40px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <GrowthChart data={chartData} />
      </div>

      {/* TABELA DE LEADS */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-2">
        <LeadsTable onUpdate={loadDashboardData} />
      </div>
    </div>
  )
}

function StatCardRing({ title, value, goal, icon, color, strokeColor, isPercent }: any) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between h-[160px] hover:border-indigo-100 transition-all group">
      <div className="flex flex-col justify-between h-full py-1">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</p>
          <div className={`p-2 bg-slate-50 rounded-xl w-fit group-hover:bg-indigo-50 transition-colors ${color}`}>{icon}</div>
        </div>
        <h3 className="text-xl font-black text-slate-900 leading-tight">
          {isPercent ? `${value.toFixed(1)}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)}
        </h3>
      </div>
      <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-50" />
          <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} strokeLinecap="round" className={`${strokeColor}`} />
        </svg>
        <span className="absolute text-[11px] font-black text-slate-900">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}