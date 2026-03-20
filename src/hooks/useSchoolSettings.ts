'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface GoalState {
  monthlyGoal: number
  annualGoal: number
  enrollmentGoal: number
}

export interface ISEBreakdown {
  score: number
  crescimento: number
  conversao: number
  retencao: number
  engajamento: number
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: GoalState = {
  monthlyGoal: 95000,
  annualGoal: 1140000,
  enrollmentGoal: 50,
}

// ─── Helpers de localStorage (fallback offline) ───────────────────────────────

function loadFromStorage(): Partial<GoalState> {
  try {
    return {
      monthlyGoal:    Number(localStorage.getItem('schoolrise_monthlyGoal'))    || undefined,
      annualGoal:     Number(localStorage.getItem('schoolrise_annualGoal'))     || undefined,
      enrollmentGoal: Number(localStorage.getItem('schoolrise_enrollmentGoal')) || undefined,
    }
  } catch { return {} }
}

function saveToStorage(goals: GoalState) {
  try {
    localStorage.setItem('schoolrise_monthlyGoal',    goals.monthlyGoal.toString())
    localStorage.setItem('schoolrise_annualGoal',     goals.annualGoal.toString())
    localStorage.setItem('schoolrise_enrollmentGoal', goals.enrollmentGoal.toString())
  } catch { /* SSR / privado */ }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSchoolSettings(schoolId: string | null) {
  const [goals, setGoals] = useState<GoalState>(DEFAULTS)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [settingsId, setSettingsId] = useState<string | null>(null) // UUID da row no banco

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── 1. Carregar metas do banco ao montar ──────────────────────────────────
  useEffect(() => {
    if (!schoolId) {
      // Sem school_id (ex: dev local), usa localStorage
      const stored = loadFromStorage()
      setGoals({ ...DEFAULTS, ...stored })
      return
    }

    async function fetchGoals() {
      const { data, error } = await supabase
        .from('school_settings')
        .select('id, monthly_goal, annual_goal, enrollment_goal')
        .eq('school_id', schoolId)
        .single()

      if (error || !data) {
        // Banco sem dados → cai no localStorage como fallback
        const stored = loadFromStorage()
        setGoals({ ...DEFAULTS, ...stored })
        return
      }

      const loaded: GoalState = {
        monthlyGoal:    data.monthly_goal,
        annualGoal:     data.annual_goal,
        enrollmentGoal: data.enrollment_goal,
      }
      setSettingsId(data.id)
      setGoals(loaded)
      saveToStorage(loaded) // sincroniza localStorage como cache offline
    }

    fetchGoals()
  }, [schoolId, supabase])

  // ── 2. Atualizar um campo localmente (instantâneo para UX) ────────────────
  const updateGoal = useCallback((key: keyof GoalState, value: number) => {
    setGoals(prev => {
      const next = { ...prev, [key]: value }
      saveToStorage(next) // cache imediato
      return next
    })
  }, [])

  // ── 3. Persistir no banco (chama no onBlur ou botão salvar) ───────────────
  const persistGoals = useCallback(async () => {
    if (!schoolId) return // modo local, já está no localStorage

    setSaveStatus('saving')
    try {
      const payload = {
        school_id:       schoolId,
        monthly_goal:    goals.monthlyGoal,
        annual_goal:     goals.annualGoal,
        enrollment_goal: goals.enrollmentGoal,
      }

      const { error } = settingsId
        ? await supabase.from('school_settings').update(payload).eq('id', settingsId)
        : await supabase.from('school_settings').insert(payload).select('id').single()

      if (error) throw error

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } catch (e) {
      console.error('[SchoolRise] Erro ao salvar metas:', e)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [schoolId, goals, settingsId, supabase])

  // ── 4. Salvar snapshot do ISE no histórico ────────────────────────────────
  const persistISE = useCallback(async (ise: ISEBreakdown, snapshotSchoolId: string) => {
    try {
      await supabase.from('ise_history').upsert(
        {
          school_id:       snapshotSchoolId,
          recorded_at:     new Date().toISOString().split('T')[0], // YYYY-MM-DD
          ise_score:       parseFloat(ise.score.toFixed(2)),
          ise_crescimento: parseFloat(ise.crescimento.toFixed(2)),
          ise_conversao:   parseFloat(ise.conversao.toFixed(2)),
          ise_retencao:    parseFloat(ise.retencao.toFixed(2)),
          ise_engajamento: parseFloat(ise.engajamento.toFixed(2)),
        },
        { onConflict: 'school_id,recorded_at' } // upsert: atualiza se já existe hoje
      )
    } catch (e) {
      // ISE histórico é não-crítico — falha silenciosa
      console.warn('[SchoolRise] ISE histórico não salvo:', e)
    }
  }, [supabase])

  return { goals, updateGoal, persistGoals, persistISE, saveStatus }
}