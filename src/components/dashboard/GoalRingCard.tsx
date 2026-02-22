'use client'

interface GoalRingProps {
  current: number
  target: number
  label: string
}

export function GoalRingCard({ current, target, label }: GoalRingProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100) || 0
  
  // Lógica de Cores solicitada
  // 0-50% Vermelho | 60-75% Amarelo | 80-100% Verde
  const getProgressColor = (percent: number) => {
    if (percent <= 50) return '#EF4444' // Vermelho
    if (percent > 50 && percent <= 75) return '#F59E0B' // Amarelo/Laranja
    return '#10B981' // Verde
  }

  const color = getProgressColor(percentage)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4 transition-all hover:shadow-md">
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64" cy="64" r={radius}
            stroke="#F1F5F9" strokeWidth="10" fill="transparent"
          />
          <circle
            cx="64" cy="64" r={radius}
            stroke={color} strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-black text-slate-900">{percentage}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-lg font-extrabold text-slate-900">
          {label.includes('Leads') ? current : `R$ ${current.toLocaleString('pt-BR')}`}
        </p>
        <p className="text-slate-400 text-[10px] font-medium mt-1">Meta: {label.includes('Leads') ? target : `R$ ${target.toLocaleString('pt-BR')}`}</p>
      </div>
    </div>
  )
}