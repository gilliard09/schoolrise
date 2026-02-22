'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Megaphone, TrendingUp } from 'lucide-react'

interface GrowthChartProps {
  data: any[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)

  const currentMonthIndex = new Date().getMonth()
  const monthsLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const currentMonthName = monthsLabels[currentMonthIndex]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Desempenho de Vendas
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Faturamento por Mês</p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} tickFormatter={(v) => `R$ ${v / 1000}k`} />
            <Tooltip cursor={{fill: '#F8FAFC'}} content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
                    {formatCurrency(payload[0].value as number)}
                  </div>
                )
              }
              return null
            }} />
            
            {/* O onClick voltou para dentro do Bar para evitar erro de TypeScript */}
            <Bar 
              dataKey="faturamento" 
              radius={[12, 12, 12, 12]} 
              barSize={45}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  className="cursor-pointer transition-all hover:opacity-80"
                  fill={entry.month === currentMonthName ? '#4F46E5' : '#E2E8F0'} 
                  onClick={() => {
                    console.log("Barra clicada:", entry);
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

          <div className="py-6 space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {selected?.details && selected.details.length > 0 ? (
              selected.details.map((item: any, i: number) => {
                const itemValue = Number(item.value) || 0;
                const totalMonth = Number(selected.faturamento) || 1;
                const percentage = (itemValue / totalMonth) * 100;

                return (
                  <div key={i} className="group p-5 rounded-[28px] border border-slate-50 bg-slate-50/30 hover:bg-white transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white shadow-sm transition-colors">
                          <Megaphone size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 uppercase leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.count} Matrículas
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-indigo-600">
                          {formatCurrency(itemValue)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 font-bold text-sm uppercase">Nenhum detalhe encontrado.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}