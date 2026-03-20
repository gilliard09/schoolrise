'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Megaphone, TrendingUp, Target } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChartDetail {
  name: string
  value: number
  count: number
}

interface ChartEntry {
  month: string
  faturamento: number
  details?: ChartDetail[]
}

interface GrowthChartProps {
  data: ChartEntry[]
  monthlyGoal?: number    // linha de meta no gráfico (opcional)
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(value ?? 0)
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload as ChartEntry
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-xl space-y-1">
      <p className="text-slate-400 uppercase tracking-widest text-[9px]">{entry?.month}</p>
      <p className="text-white text-sm">{formatCurrency(entry?.faturamento)}</p>
      {entry?.details && entry.details.length > 0 && (
        <p className="text-indigo-300 text-[9px]">{entry.details.reduce((a, d) => a + d.count, 0)} matrículas</p>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function GrowthChart({ data, monthlyGoal }: GrowthChartProps) {
  const [selected, setSelected] = useState<ChartEntry | null>(null)
  const [open,     setOpen]     = useState(false)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const currentMonthName = MONTHS[new Date().getMonth()]

  const handleBarClick = useCallback((entry: ChartEntry) => {
    if (!entry) return
    setSelected(entry)
    setOpen(true)
  }, [])

  // Total anual para o header
  const totalAnual = data.reduce((acc, d) => acc + (d.faturamento ?? 0), 0)

  // Skeleton enquanto o DOM não está pronto (evita width=-1 do Recharts)
  if (!mounted) {
    return (
      <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm min-h-[450px] animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-8" />
        <div className="h-[350px] bg-muted rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="bg-card p-8 rounded-[40px] border border-border shadow-sm font-sans min-h-[450px]">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Desempenho de Vendas
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
            Clique nas barras para ver detalhes por origem
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Anual</p>
          <p className="text-lg font-black text-foreground">{formatCurrency(totalAnual)}</p>
          {monthlyGoal && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Target size={9} className="text-indigo-400" />
              <p className="text-[9px] font-bold text-muted-foreground">
                Meta mês: {formatCurrency(monthlyGoal)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 'bold' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}
              tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />

            {/* Linha de meta mensal */}
            {monthlyGoal && (
              <ReferenceLine
                y={monthlyGoal}
                stroke="#4F46E5"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{
                  value: 'Meta',
                  position: 'insideTopRight',
                  fill: '#4F46E5',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
            )}

            <Bar dataKey="faturamento" radius={[12, 12, 12, 12]} barSize={45}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  className="cursor-pointer"
                  fill={entry.month === currentMonthName ? '#4F46E5' : '#E2E8F0'}
                  onClick={() => handleBarClick(entry)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[40px] bg-card p-8 border-none shadow-2xl max-w-lg outline-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground uppercase flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block" />
              {selected?.month ?? '—'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              Faturamento Total: {formatCurrency(selected?.faturamento)}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {selected?.details && selected.details.length > 0 ? (
              [...selected.details]
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                .map((item, i) => {
                  const itemValue  = item.value  ?? 0
                  const totalMonth = selected.faturamento ?? 0
                  const pct        = totalMonth > 0 ? (itemValue / totalMonth) * 100 : 0

                  return (
                    <div
                      key={i}
                      className="group p-5 rounded-[28px] border border-border bg-muted/30 hover:bg-card transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-card rounded-2xl text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white shadow-sm transition-colors">
                            <Megaphone size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground uppercase leading-tight">
                              {item.name || 'DIRETO/OUTROS'}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {item.count ?? 0} matrículas
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-indigo-600 text-sm">
                          {formatCurrency(itemValue)}
                        </span>
                      </div>

                      {/* Barra de proporção */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground font-bold mt-1 text-right">
                        {pct.toFixed(1)}% do mês
                      </p>
                    </div>
                  )
                })
            ) : (
              <div className="text-center py-10 text-muted-foreground font-bold text-sm uppercase">
                Nenhuma matrícula detalhada neste mês.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}