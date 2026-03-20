'use client'

import { useMemo } from 'react'
import {
  MessageSquare, Send, CheckCircle2, XCircle,
  Calendar, MapPin, Laptop, UserCheck,
  Users, UserX, TrendingUp,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Lead {
  status?: string | null
  contact_made?: boolean | null
  has_responded?: boolean | null
  scheduled?: boolean | null
  visited?: boolean | null
  is_online?: boolean | null
  no_show?: boolean | null
}

interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  filterable: boolean       // false = não abre filtro na tabela
  subtitle?: string         // linha extra de contexto
}

interface Props {
  leads?: Lead[]
  onFilterClick: (filter: string) => void
  activeFilter: string | null
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CommercialMetrics({ leads = [], onFilterClick, activeFilter }: Props) {

  const stats = useMemo((): StatItem[] => {
    const total            = leads.length
    const mensagensEnv     = leads.filter(l => l.contact_made === true).length
    const faltamEnviar     = leads.filter(l => !l.contact_made && l.status !== 'converted' && l.status !== 'canceled').length
    const responderam      = leads.filter(l => l.has_responded === true).length
    const naoResponderam   = leads.filter(l => !!l.contact_made && !l.has_responded && l.status !== 'converted').length
    const agendados        = leads.filter(l => l.scheduled === true).length
    const presenciais      = leads.filter(l => l.visited === true).length
    const online           = leads.filter(l => l.is_online === true).length
    const naoCompareceram  = leads.filter(l => l.no_show === true).length
    const matriculas       = leads.filter(l => String(l.status ?? '').toLowerCase() === 'converted').length

    // Taxa de conversão — calculada sobre total para contexto
    const taxaConv = total > 0 ? ((matriculas / total) * 100).toFixed(1) : '0.0'

    return [
      {
        label: 'Total Leads',
        value: total,
        icon: <Users size={18} />,
        color: 'bg-blue-600',
        filterable: false,
      },
      {
        label: 'Msgs Enviadas',
        value: mensagensEnv,
        icon: <Send size={18} />,
        color: 'bg-indigo-600',
        filterable: true,
        subtitle: total > 0 ? `${((mensagensEnv / total) * 100).toFixed(0)}% do total` : undefined,
      },
      {
        label: 'Faltam Enviar',
        value: faltamEnviar,
        icon: <MessageSquare size={18} />,
        color: 'bg-amber-500',
        filterable: true,
      },
      {
        label: 'Responderam',
        value: responderam,
        icon: <CheckCircle2 size={18} />,
        color: 'bg-emerald-500',
        filterable: true,
        subtitle: mensagensEnv > 0 ? `${((responderam / mensagensEnv) * 100).toFixed(0)}% das msgs` : undefined,
      },
      {
        label: 'Não Responderam',
        value: naoResponderam,
        icon: <XCircle size={18} />,
        color: 'bg-slate-400',
        filterable: true,
      },
      {
        label: 'Agendados',
        value: agendados,
        icon: <Calendar size={18} />,
        color: 'bg-blue-500',
        filterable: true,
      },
      {
        label: 'Presenciais',
        value: presenciais,
        icon: <MapPin size={18} />,
        color: 'bg-orange-600',
        filterable: true,
        subtitle: agendados > 0 ? `${((presenciais / agendados) * 100).toFixed(0)}% dos agend.` : undefined,
      },
      {
        label: 'Atend. Online',
        value: online,
        icon: <Laptop size={18} />,
        color: 'bg-purple-600',
        filterable: true,
      },
      {
        label: 'Não Compareceu',
        value: naoCompareceram,
        icon: <UserX size={18} />,
        color: 'bg-rose-500',
        filterable: true,
      },
      {
        label: 'Matrículas',
        value: matriculas,
        icon: <UserCheck size={18} />,
        color: 'bg-emerald-600',
        filterable: true,
        subtitle: `${taxaConv}% de conv.`,
      },
    ]
  }, [leads])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const isActive = activeFilter === stat.label
        const isClickable = stat.filterable

        return (
          <button
            key={stat.label}
            onClick={() => isClickable && onFilterClick(stat.label)}
            disabled={!isClickable}
            className={`
              text-left transition-all duration-200 p-5 rounded-[32px] border shadow-sm group
              ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
              ${isActive
                ? 'bg-white border-indigo-600 ring-2 ring-indigo-50 shadow-md'
                : isClickable
                  ? 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                  : 'bg-white border-slate-100'
              }
            `}
          >
            {/* Ícone */}
            <div className={`
              w-9 h-9 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg
              transition-transform
              ${isClickable ? 'group-hover:scale-110' : ''}
              ${isActive ? 'ring-4 ring-indigo-50' : ''}
            `}>
              {stat.icon}
            </div>

            {/* Label */}
            <p className={`
              text-[9px] font-black uppercase tracking-widest mb-1 leading-tight transition-colors
              ${isActive ? 'text-indigo-600' : 'text-slate-400'}
            `}>
              {stat.label}
            </p>

            {/* Valor */}
            <h4 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h4>

            {/* Subtítulo contextual */}
            {stat.subtitle && (
              <p className="text-[9px] text-slate-400 font-bold mt-1 flex items-center gap-0.5">
                <TrendingUp size={9} />
                {stat.subtitle}
              </p>
            )}

            {/* Indicador de filtrável */}
            {isClickable && !isActive && (
              <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                clique p/ filtrar
              </p>
            )}
            {isActive && (
              <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-1">
                ✓ filtrando
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}