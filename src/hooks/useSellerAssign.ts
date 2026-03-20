'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Seller {
  id: string
  full_name: string   // ← era: name
  email: string
  role: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSellerAssign() {
  const [sellers,   setSellers]   = useState<Seller[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Carrega vendedores ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSellers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')   // ← era: name
        .in('role', ['admin', 'staff'])
        .order('full_name')                      // ← era: name

      if (!error && data) setSellers(data as Seller[])
    }
    loadSellers()
  }, [supabase])

  // ── Atribui vendedor a uma lead ───────────────────────────────────────────
  const assignSeller = useCallback(async (leadId: string, sellerId: string): Promise<boolean> => {
    setAssigning(leadId)
    try {
      const { error } = await supabase
        .from('sales_leads')
        .update({ assigned_to: sellerId })
        .eq('id', leadId)

      if (error) throw error
      return true
    } catch (e) {
      console.error('[SchoolRise] Erro ao atribuir vendedor:', e)
      return false
    } finally {
      setAssigning(null)
    }
  }, [supabase])

  return { sellers, assignSeller, assigning }
}