'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormatType = 'currency' | 'number' | 'percent'

interface GoalRingProps {
  current: number
  target: number
  label: string
  format?: FormatType    // como formatar o valor — padrão: 'currency'
  trend?: number         // % de variação vs período anterior (opcional)
  size?: 'sm' | 'md'    // tamanho do ring — padrão: 'md'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: number, format: FormatType): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR').format(value)
  }
}

function getProgressColor(percent: number): string {
  if (percent <= 50) return 'text-red-500'
  if (percent <= 75) return 'text-amber-500'
  return 'text-emerald-500'
}

function getProgressStroke(percent: number): string {
  if (percent <= 50) return '#EF4444'
  if (percent <= 75) return '#F59E0B'
  return '#10B981'
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function GoalRingCard({
  current,
  target,
  label,
  format = 'currency',
  trend,
  size = 'md',
}: GoalRingProps) {
  // Guard contra divisão por zero
  const percentage = target > 0
    ? Math.min(Math.round((current / target) * 100), 100)
    : 0

  const strokeColor  = getProgressStroke(percentage)
  const percentColor = getProgressColor(percentage)

  // Dimensões por tamanho
  const dim = size === 'sm'
    ? { svgSize: 96,  cx: 48, cy: 48, r: 28, sw: 8,  textSize: 'text-lg'  }
    : { svgSize: 128, cx: 64, cy: 64, r: 36, sw: 10, textSize: 'text-2xl' }

  const circumference    = 2 * Math.PI * dim.r
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const formattedCurrent = formatValue(current, format)
  const formattedTarget  = formatValue(target,  format)

  return (
    <div className="bg-card rounded-[32px] p-8 shadow-sm border border-border flex flex-col items-center justify-center space-y-4 transition-all hover:shadow-md">

      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={dim.svgSize}
          height={dim.svgSize}
          viewBox={`0 0 ${dim.svgSize} ${dim.svgSize}`}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={dim.cx} cy={dim.cy} r={dim.r}
            stroke="#F1F5F9" strokeWidth={dim.sw} fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={dim.cx} cy={dim.cy} r={dim.r}
            stroke={strokeColor}
            strokeWidth={dim.sw}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute flex flex-col items-center">
          <span className={`${dim.textSize} font-black ${percentColor}`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Informações */}
      <div className="text-center space-y-1">
        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">
          {label}
        </p>
        <p className="text-lg font-extrabold text-foreground">
          {formattedCurrent}
        </p>
        <p className="text-muted-foreground text-[10px] font-medium">
          Meta: {formattedTarget}
        </p>

        {/* Tendência */}
        {trend !== undefined && (
          <div className={`flex items-center justify-center gap-0.5 text-[10px] font-black mt-1 ${
            trend >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {trend >= 0
              ? <TrendingUp  size={11} />
              : <TrendingDown size={11} />
            }
            {Math.abs(trend).toFixed(1)}% vs mês anterior
          </div>
        )}
      </div>
    </div>
  )
}