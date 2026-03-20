'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button }   from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Settings, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SettingsDialogProps {
  onUpdate?: () => void
}

interface GoalForm {
  monthly_goal:    string
  annual_goal:     string
  enrollment_goal: string
}

const EMPTY_FORM: GoalForm = {
  monthly_goal:    '',
  annual_goal:     '',
  enrollment_goal: '',
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SettingsDialog({ onUpdate }: SettingsDialogProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState<GoalForm>(EMPTY_FORM)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [schoolId,   setSchoolId]   = useState<string | null>(null)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // ── Carrega school_id do perfil + metas ao abrir ──────────────────────────
  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Pega school_id do perfil do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

      const sid = profile?.school_id ?? null
      setSchoolId(sid)

      if (!sid) return  // sem school_id, não há metas para carregar

      // 2. Busca metas com as colunas corretas da migration
      const { data, error } = await supabase
        .from('school_settings')
        .select('id, monthly_goal, annual_goal, enrollment_goal')
        .eq('school_id', sid)
        .single()

      if (error || !data) return

      setSettingsId(data.id)
      setForm({
        monthly_goal:    data.monthly_goal?.toString()    ?? '',
        annual_goal:     data.annual_goal?.toString()     ?? '',
        enrollment_goal: data.enrollment_goal?.toString() ?? '',
      })
    } catch (e) {
      console.error('[SchoolRise] Erro ao carregar configurações:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (open) loadSettings()
  }, [open, loadSettings])

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const monthly    = parseFloat(form.monthly_goal)    || 0
    const annual     = parseFloat(form.annual_goal)     || 0
    const enrollment = parseInt(form.enrollment_goal)   || 0

    if (monthly <= 0 || annual <= 0 || enrollment <= 0) {
      toast.error('Preencha todas as metas com valores válidos')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sessão expirada. Faça login novamente.'); return }

      // school_id vem do estado — sem query extra
      const sid = schoolId ?? user.id   // fallback: usa user.id como school_id se não houver school

      const payload = {
        school_id:       sid,
        monthly_goal:    monthly,
        annual_goal:     annual,
        enrollment_goal: enrollment,
        updated_by:      user.id,
      }

      const { error } = settingsId
        ? await supabase.from('school_settings').update(payload).eq('id', settingsId)
        : await supabase.from('school_settings').insert(payload)

      if (error) throw error

      toast.success('Metas atualizadas com sucesso!')
      onUpdate?.()
      setOpen(false)
    } catch (e) {
      console.error('[SchoolRise] Erro ao salvar metas:', e)
      toast.error('Erro ao salvar metas. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [form, schoolId, settingsId, supabase, onUpdate])

  const set = useCallback((key: keyof GoalForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-indigo-600 rounded-full transition-all hover:rotate-90 active:scale-90"
          title="Configurar Metas"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-none shadow-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase">
            Metas da Escola
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Defina seus objetivos financeiros e de captação.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : (
          <div className="grid gap-5 py-4">

            {/* Meta Mensal */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest ml-1">
                Meta Mensal de Receita (R$)
              </Label>
              <Input
                type="number"
                value={form.monthly_goal}
                onChange={e => set('monthly_goal', e.target.value)}
                className="rounded-2xl border-border bg-muted h-12 font-medium focus-visible:ring-indigo-500"
                placeholder="Ex: 95000"
                min="0"
              />
            </div>

            {/* Meta Anual */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest ml-1">
                Meta Anual de Receita (R$)
              </Label>
              <Input
                type="number"
                value={form.annual_goal}
                onChange={e => set('annual_goal', e.target.value)}
                className="rounded-2xl border-border bg-muted h-12 font-medium focus-visible:ring-indigo-500"
                placeholder="Ex: 1140000"
                min="0"
              />
            </div>

            {/* Meta de Matrículas */}
            <div className="grid gap-2">
              <Label className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest ml-1">
                Meta de Matrículas (Qtd/mês)
              </Label>
              <Input
                type="number"
                value={form.enrollment_goal}
                onChange={e => set('enrollment_goal', e.target.value)}
                className="rounded-2xl border-border bg-muted h-12 font-medium focus-visible:ring-indigo-500"
                placeholder="Ex: 50"
                min="0"
              />
            </div>

            {/* Aviso se sem school_id */}
            {!schoolId && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700">
                <AlertTriangle size={14} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wide">
                  Perfil sem escola vinculada. As metas serão salvas localmente.
                </p>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Atualizar Metas
                </span>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}