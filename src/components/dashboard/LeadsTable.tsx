'use client'



import { useState, useEffect, useCallback } from 'react'

import { createBrowserClient } from '@supabase/ssr'

import { Edit2, Trash2, Search, Megaphone, FileCheck, Bell, AlertCircle, Users, Target, TrendingUp } from 'lucide-react'

import { toast } from 'sonner'

import { EditLeadDialog } from './EditLeadDialog'

import confetti from 'canvas-confetti'



const META_FATURAMENTO_MENSAL = 10000

const META_FATURAMENTO_ANUAL = 120000



export function LeadsTable({ onUpdate }: { onUpdate: () => void }) {

const [leads, setLeads] = useState<any[]>([])

const [loading, setLoading] = useState(true)

const [searchTerm, setSearchTerm] = useState('')

const [selectedMonth, setSelectedMonth] = useState('all')

const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

const [filterStatus, setFilterStatus] = useState<'all' | 'lead' | 'converted'>('all')

const [onlyTodayReturn, setOnlyTodayReturn] = useState(false)

const [selectedLead, setSelectedLead] = useState<any>(null)

const [isEditOpen, setIsEditOpen] = useState(false)



const supabase = createBrowserClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,

process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

)



const fetchLeads = useCallback(async () => {

setLoading(true)

const { data, error } = await supabase

.from('sales_leads')

.select('*')

.order('created_at', { ascending: false })


if (!error) {

setLeads(data || [])

}

setLoading(false)

}, [supabase])



useEffect(() => {

fetchLeads()

}, [fetchLeads])



const isReturnToday = (returnDate: string) => {

if (!returnDate) return false

const today = new Date()

today.setHours(0, 0, 0, 0)

const dateToReturn = new Date(returnDate)

dateToReturn.setHours(0, 0, 0, 0)

return dateToReturn <= today

}



// Cálculos de faturamento

const faturamentoMensal = leads

.filter(l => {

const d = new Date(l.created_at)

const now = new Date()

return l.status === 'converted' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()

})

.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)



const faturamentoAnual = leads

.filter(l => {

const d = new Date(l.created_at)

const now = new Date()

return l.status === 'converted' && d.getFullYear() === now.getFullYear()

})

.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)



const stats = {

totalLeads: leads.filter(l => l.status === 'lead').length,

returnsToday: leads.filter(l => l.status === 'lead' && isReturnToday(l.return_date)).length,

conversionsMonth: leads.filter(l => {

const d = new Date(l.created_at)

const now = new Date()

return l.status === 'converted' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()

}).length,

faturamentoMensal,

faturamentoAnual

}



// --- EFEITO DE CELEBRAÇÃO COM SOM ---

useEffect(() => {

if (loading || leads.length === 0) return;



const dispararCelebracao = () => {

const mes = new Date().getMonth();

const ano = new Date().getFullYear();



// Função para tocar o sino de matrículas

const tocarSino = () => {

const audio = new Audio('/bell.mp3');

audio.volume = 0.4;

audio.play().catch(err => console.log("Áudio bloqueado pelo navegador até interação do usuário."));

};



// Meta Mensal

if (faturamentoMensal >= META_FATURAMENTO_MENSAL) {

const keyM = `celebrat_m_${mes}_${ano}`;

if (!sessionStorage.getItem(keyM)) {

tocarSino();

confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

toast.success("META MENSAL ATINGIDA! 🚀");

sessionStorage.setItem(keyM, 'true');

}

}



// Meta Anual

if (faturamentoAnual >= META_FATURAMENTO_ANUAL) {

const keyA = `celebrat_a_${ano}`;

if (!sessionStorage.getItem(keyA)) {

tocarSino();

confetti({ particleCount: 200, spread: 160, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500'] });

toast.success("🏆 META ANUAL ALCANÇADA!!!");

sessionStorage.setItem(keyA, 'true');

}

}

};



const timer = setTimeout(dispararCelebracao, 1500);

return () => clearTimeout(timer);

}, [loading, faturamentoMensal, faturamentoAnual, leads.length]);



// Filtros da tabela

const filteredLeads = leads.filter(l => {

const date = new Date(l.created_at)

const matchesSearch = l.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||

l.course?.toLowerCase().includes(searchTerm.toLowerCase())

const matchesMonth = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth

const matchesYear = date.getFullYear().toString() === selectedYear

const matchesReturn = onlyTodayReturn ? isReturnToday(l.return_date) && l.status === 'lead' : true

const matchesStatus = filterStatus === 'all' ? true : l.status === filterStatus

return matchesSearch && matchesMonth && matchesYear && matchesReturn && matchesStatus

})



const formatCurrency = (value: number) => {

return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

}



const getStatusLabel = (status: string) => {

switch(status) {

case 'converted': return { label: 'Matriculado', class: 'bg-emerald-50 text-emerald-600' }

case 'canceled': return { label: 'Cancelado', class: 'bg-red-50 text-red-600' }

case 'graduated': return { label: 'Formando', class: 'bg-blue-50 text-blue-600' }

default: return { label: 'Lead', class: 'bg-amber-50 text-amber-600' }

}

}



const handleDelete = async (id: string) => {

if (!confirm("Deseja realmente excluir?")) return

const { error } = await supabase.from('sales_leads').delete().eq('id', id)

if (error) toast.error("Erro ao excluir")

else {

toast.success("Excluído!")

fetchLeads()

onUpdate()

}

}



return (

<div className="w-full space-y-6 font-sans">

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

{/* Card Leads */}

<div onClick={() => { setOnlyTodayReturn(false); setFilterStatus('lead'); }} className={`bg-white p-6 rounded-[32px] border flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${filterStatus === 'lead' && !onlyTodayReturn ? 'ring-2 ring-indigo-500 border-indigo-100' : 'border-slate-100'}`}>

<div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>

<div>

<p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Leads Ativos</p>

<p className="text-2xl font-black text-slate-900">{stats.totalLeads}</p>

</div>

</div>



{/* Card Retornos */}

<div onClick={() => { setOnlyTodayReturn(!onlyTodayReturn); setFilterStatus('all'); }} className={`p-6 rounded-[32px] border flex items-center gap-4 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${onlyTodayReturn ? 'bg-amber-600 border-amber-400 text-white shadow-xl shadow-amber-200' : stats.returnsToday > 0 ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-100' : 'bg-white border-slate-100 text-slate-400'}`}>

<div className={`p-4 rounded-2xl ${stats.returnsToday > 0 || onlyTodayReturn ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300'}`}><Bell size={24} className={stats.returnsToday > 0 && !onlyTodayReturn ? 'animate-bounce' : ''} /></div>

<div className="flex-1">

<p className={`text-[10px] font-black uppercase tracking-widest ${stats.returnsToday > 0 || onlyTodayReturn ? 'text-white/80' : 'text-slate-400'}`}>Retornos Hoje</p>

<p className={`text-2xl font-black ${stats.returnsToday > 0 || onlyTodayReturn ? 'text-white' : 'text-slate-900'}`}>{stats.returnsToday}</p>

</div>

</div>



{/* Card Matrículas */}

<div onClick={() => { setFilterStatus('converted'); setOnlyTodayReturn(false); }} className={`p-6 rounded-[32px] border flex items-center gap-4 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${filterStatus === 'converted' ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-200' : 'bg-white border-slate-100'}`}>

<div className={`p-4 rounded-2xl ${filterStatus === 'converted' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}><Target size={24} /></div>

<div className="flex-1">

<p className={`text-[10px] font-black uppercase tracking-widest ${filterStatus === 'converted' ? 'text-white/80' : 'text-slate-400'}`}>Matrículas / Mês</p>

<div className="flex items-center gap-2">

<p className={`text-2xl font-black ${filterStatus === 'converted' ? 'text-white' : 'text-slate-900'}`}>{stats.conversionsMonth}</p>

<TrendingUp size={16} className={filterStatus === 'converted' ? 'text-white' : 'text-emerald-500'} />

</div>

</div>

</div>

</div>



<div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">

<div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-4">

<div className="flex flex-col md:flex-row w-full lg:w-auto gap-3 items-center">

<div className="relative w-full md:w-64">

<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />

<input className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

</div>

{(onlyTodayReturn || filterStatus !== 'all') && (

<button onClick={() => { setOnlyTodayReturn(false); setFilterStatus('all'); }} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 underline underline-offset-4">Limpar Filtros</button>

)}

</div>

<div className="flex gap-2">

<select className="pl-4 pr-8 py-2.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none appearance-none cursor-pointer border-r-8 border-transparent" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>

<option value="all">Mês: Todos</option>

{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (<option key={m} value={i.toString()}>{m}</option>))}

</select>

<select className="px-4 py-2.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none appearance-none cursor-pointer" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>

<option value="2025">2025</option>

<option value="2026">2026</option>

</select>

</div>

</div>



<div className="overflow-x-auto">

<table className="w-full text-left border-collapse">

<thead>

<tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">

<th className="p-5 text-center w-10">#</th>

<th className="p-5">Aluno</th>

<th className="p-5">Curso / Campanha</th>

<th className="p-5">Status</th>

<th className="p-5">Investimento</th>

<th className="p-5 text-right">Ações</th>

</tr>

</thead>

<tbody>

{filteredLeads.map(l => {

const statusData = getStatusLabel(l.status)

const needsReturn = isReturnToday(l.return_date) && l.status === 'lead'

return (

<tr key={l.id} className={`border-b border-slate-50 group hover:bg-slate-50/50 transition-colors ${needsReturn ? 'bg-amber-50/30' : ''}`}>

<td className="p-5 text-center">

{needsReturn ? <AlertCircle className="text-amber-500 animate-pulse mx-auto" size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-200 mx-auto" />}

</td>

<td className="p-5 font-bold text-slate-800">

<div className="flex flex-col">

<span className="flex items-center gap-2">{l.student_name}{needsReturn && <span className="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black">Hoje</span>}</span>

<span className="text-[10px] text-slate-400 font-normal">{new Date(l.created_at).toLocaleDateString('pt-BR')}</span>

</div>

</td>

<td className="p-5">

<div className="flex flex-col">

<span className="text-sm text-slate-700 font-medium">{l.course}</span>

<span className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold uppercase tracking-tight"><Megaphone size={10} /> {l.campaign || 'Orgânico/Direto'}</span>

</div>

</td>

<td className="p-5"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusData.class}`}>{statusData.label}</span></td>

<td className="p-5 font-black text-slate-900">{formatCurrency(l.value)}</td>

<td className="p-5 text-right">

<div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">

<button onClick={() => { toast.success(`Abrindo Autentique para ${l.student_name}`); window.open('https://app.autentique.com.br/documentos/novo', '_blank') }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><FileCheck size={16} /></button>

<button onClick={() => { setSelectedLead(l); setIsEditOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={16} /></button>

<button onClick={() => handleDelete(l.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>

</div>

</td>

</tr>

)

})}

</tbody>

</table>

{filteredLeads.length === 0 && (

<div className="p-20 text-center text-slate-400 text-sm font-medium">Nenhum registro encontrado para este filtro.</div>

)}

</div>

</div>



{isEditOpen && <EditLeadDialog lead={selectedLead} isOpen={isEditOpen} onOpenChange={setIsEditOpen} onUpdate={() => { fetchLeads(); onUpdate(); }} />}

</div>

)

}