'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Megaphone, TrendingUp } from 'lucide-react'

interface GrowthChartProps {
  data: any[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 1. Resolve o erro de width(-1) garantindo que o DOM está pronto
  useEffect(() => {
    setMounted(true)
  }, [])

  // 2. Garante que o Recharts sempre tenha um array válido, mesmo que vazio
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : []
  }, [data])

  const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const currentMonthName = monthsLabels[new Date().getMonth()]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  if (!mounted) {
    return <div className="h-[450px] w-full bg-slate-50 animate-pulse rounded-[40px]" />
  }

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm font-sans min-h-[450px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Desempenho de Vendas
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
            Clique nas barras para detalhes
          </p>
        </div>
      </div>
      
      <div className="h-[350px] w-full" style={{ minWidth: '100%' }}>
        {/* Adicionamos debounce para evitar o erro de redimensionamento */}
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 'bold'}} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} 
              tickFormatter={(v) => `R$ ${v / 1000}k`} 
            />
            <Tooltip 
              cursor={{fill: '#F8FAFC'}} 
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl border-none">
                      {formatCurrency(payload[0].value as number)}
                    </div>
                  )
                }
                return null
              }} 
            />
            
            <Bar dataKey="faturamento" radius={[12, 12, 12, 12]} barSize={45}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  className="cursor-pointer transition-all hover:opacity-80"
                  fill={entry.month === currentMonthName ? '#4F46E5' : '#E2E8F0'} 
                  onClick={() => {
                    setSelected(entry);
                    setOpen(true);
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[40px] bg-white p-8 border-none shadow-2xl max-w-lg outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block"></span>
              Detalhamento: {selected?.month}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Faturamento Total: {formatCurrency(selected?.faturamento)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {/* Proteção contra detalhes nulos ou indefinidos */}
            {selected?.details && selected.details.length > 0 ? (
              [...selected.details].sort((a: any, b: any) => (b.value || 0) - (a.value || 0)).map((item: any, i: number) => {
                const itemValue = Number(item.value) || 0;
                const totalMonth = Number(selected.faturamento) || 0;
                const percentage = totalMonth > 0 ? (itemValue / totalMonth) * 100 : 0;

                return (
                  <div key={i} className="group p-5 rounded-[28px] border border-slate-50 bg-slate-50/30 hover:bg-white transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white shadow-sm transition-colors">
                          <Megaphone size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 uppercase leading-tight">
                            {item.name || 'DIRETO/OUTROS'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.count || 0} Matrículas
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-black text-indigo-600">
                        {formatCurrency(itemValue)}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 text-slate-400 font-bold text-sm uppercase italic">
                Nenhuma matrícula detalhada.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}