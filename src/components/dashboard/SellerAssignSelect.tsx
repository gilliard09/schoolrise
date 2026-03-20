'use client'

import { useState } from 'react'
import { useSellerAssign } from '@/hooks/useSellerAssign'
import { CheckCircle2, Loader2, UserCheck } from 'lucide-react'

interface Props {
  leadId: string
  currentAssignedId?: string | null
  onAssigned?: () => void
  disabled?: boolean
}

export function SellerAssignSelect({ leadId, currentAssignedId, onAssigned, disabled }: Props) {
  const { sellers, assignSeller, assigning } = useSellerAssign()
  const [saved, setSaved] = useState(false)

  const isLoading = assigning === leadId

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sellerId = e.target.value
    if (!sellerId) return
    const ok = await assignSeller(leadId, sellerId)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onAssigned?.()
    }
  }

  // Staff — só lê, não edita
  if (disabled) {
    const seller = sellers.find(s => s.id === currentAssignedId)
    return (
      <span className="text-xs font-bold text-muted-foreground">
        {seller?.full_name ?? '—'}   {/* ← era: seller?.name */}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {isLoading ? (
        <Loader2 size={14} className="animate-spin text-indigo-400" />
      ) : saved ? (
        <CheckCircle2 size={14} className="text-emerald-500" />
      ) : (
        <UserCheck size={14} className="text-slate-300" />
      )}

      <select
        value={currentAssignedId ?? ''}
        onChange={handleChange}
        disabled={isLoading}
        className="text-xs font-bold text-foreground bg-transparent outline-none cursor-pointer
                   hover:text-indigo-600 transition-colors disabled:opacity-50 max-w-[120px] truncate"
      >
        <option value="">Atribuir...</option>
        {sellers.map(s => (
          <option key={s.id} value={s.id}>
            {s.full_name || s.email}   {/* ← era: s.name */}
          </option>
        ))}
      </select>
    </div>
  )
}