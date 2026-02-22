'use client'

import { MessageCircle, CalendarCheck, UserCheck, GraduationCap, Users } from 'lucide-react'

export function CommercialMetrics({ leads = [] }: { leads: any[] }) {
  // Cálculos baseados nos dados do banco
  const stats = [
    { 
      label: 'Total Leads', 
      value: leads.length, 
      icon: <Users size={18} />, 
      color: 'bg-blue-600' 
    },
    { 
      label: 'Contatos', 
      value: leads.filter(l => l.contact_made).length, 
      icon: <MessageCircle size={18} />, 
      color: 'bg-indigo-600' 
    },
    { 
      label: 'Agendados', 
      value: leads.filter(l => l.scheduled).length, 
      icon: <CalendarCheck size={18} />, 
      color: 'bg-amber-600' 
    },
    { 
      label: 'Visitas', 
      value: leads.filter(l => l.visited).length, 
      icon: <UserCheck size={18} />, 
      color: 'bg-violet-600' 
    },
    { 
      label: 'Matrículas', 
      value: leads.filter(l => l.status === 'converted').length, 
      icon: <GraduationCap size={18} />, 
      color: 'bg-emerald-600' 
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
          <div className={`w-9 h-9 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-slate-200`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
          </div>
        </div>
      ))}
    </div>
  )
}