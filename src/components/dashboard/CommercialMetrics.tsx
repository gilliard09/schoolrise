'use client'

import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  Laptop, 
  UserCheck,
  Users,
  UserX
} from 'lucide-react'

// Adicionamos onFilterClick e activeFilter nas props
export function CommercialMetrics({ 
  leads = [], 
  onFilterClick, 
  activeFilter 
}: { 
  leads: any[], 
  onFilterClick: (filter: string) => void,
  activeFilter: string | null 
}) {
  
  // 1. Total de leads
  const totalLeads = leads.length

  // 2. Q. Mensagens enviadas
  const mensagensEnviadas = leads.filter(l => l.contact_made === true).length

  // 3. Q. Mensagens faltam enviar
  const faltamEnviar = leads.filter(l => !l.contact_made && l.status !== 'converted' && l.status !== 'canceled').length

  // 4. Q. Responderam
  const responderam = leads.filter(l => l.has_responded === true).length

  // 5. Q. Não responderam
  const naoResponderam = leads.filter(l => l.contact_made && !l.has_responded && l.status !== 'converted').length

  // 6. Q. Agendados
  const agendados = leads.filter(l => l.scheduled === true).length

  // 7. Q. Vieram presenciais
  const vieramPresenciais = leads.filter(l => l.visited === true).length

  // 8. Q. Atendimentos online
  const atendimentosOnline = leads.filter(l => l.is_online === true).length

  // 9. Q. Não compareceram
  const naoCompareceram = leads.filter(l => l.no_show === true).length

  // 10. Q. Matrículas
  const matriculas = leads.filter(l => l.status === 'converted').length

  const stats = [
    { label: 'Total Leads', value: totalLeads, icon: <Users size={18} />, color: 'bg-blue-600' },
    { label: 'Msgs Enviadas', value: mensagensEnviadas, icon: <Send size={18} />, color: 'bg-indigo-600' },
    { label: 'Faltam Enviar', value: faltamEnviar, icon: <MessageSquare size={18} />, color: 'bg-amber-500' },
    { label: 'Responderam', value: responderam, icon: <CheckCircle2 size={18} />, color: 'bg-emerald-500' },
    { label: 'Não Responderam', value: naoResponderam, icon: <XCircle size={18} />, color: 'bg-slate-400' },
    { label: 'Agendados', value: agendados, icon: <Calendar size={18} />, color: 'bg-blue-500' },
    { label: 'Presenciais', value: vieramPresenciais, icon: <MapPin size={18} />, color: 'bg-orange-600' },
    { label: 'Atend. Online', value: atendimentosOnline, icon: <Laptop size={18} />, color: 'bg-purple-600' },
    { label: 'Não Compareceu', value: naoCompareceram, icon: <UserX size={18} />, color: 'bg-rose-500' },
    { label: 'Matrículas', value: matriculas, icon: <UserCheck size={18} />, color: 'bg-emerald-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {stats.map((stat) => {
        const isActive = activeFilter === stat.label;
        
        return (
          <button 
            key={stat.label} 
            onClick={() => onFilterClick(stat.label)}
            className={`
              text-left transition-all duration-200 p-5 rounded-[32px] border shadow-sm
              active:scale-95 group
              ${isActive 
                ? 'bg-white border-indigo-600 ring-2 ring-indigo-50 shadow-md' 
                : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
              }
            `}
          >
            <div className={`
              w-9 h-9 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg 
              transition-transform group-hover:scale-110
              ${isActive ? 'ring-4 ring-indigo-50' : 'shadow-slate-100'}
            `}>
              {stat.icon}
            </div>
            <div>
              <p className={`
                text-[9px] font-black uppercase tracking-widest mb-1 leading-tight transition-colors
                ${isActive ? 'text-indigo-600' : 'text-slate-400'}
              `}>
                {stat.label}
              </p>
              <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
            </div>
          </button>
        )
      })}
    </div>
  )
}