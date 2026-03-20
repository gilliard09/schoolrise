'use client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ISEBreakdown {
  score: number
  crescimento: number
  conversao: number
  retencao: number
  engajamento: number
}

interface HealthIndexCardProps {
  // Aceita score simples OU breakdown completo
  score?: number
  ise?: ISEBreakdown
  showPillars?: boolean    // exibe os 4 pilares — padrão: true se ise for passado
  compact?: boolean        // versão reduzida sem descrição — padrão: false
}

// ─── Thresholds alinhados com admin/page.tsx ──────────────────────────────────

function getTheme(s: number) {
  if (s >= 90) return { text: 'text-indigo-600',  bg: 'bg-indigo-600',  label: 'Excelente', desc: 'Performance acima da meta' }
  if (s >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Bom',        desc: 'Escola no caminho certo'  }
  if (s >= 40) return { text: 'text-amber-600',   bg: 'bg-amber-500',   label: 'Atenção',    desc: 'Revisar metas e conversão'}
  return             { text: 'text-red-600',      bg: 'bg-red-500',     label: 'Crítico',    desc: 'Ação imediata necessária' }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function HealthIndexCard({
  score,
  ise,
  showPillars = true,
  compact = false,
}: HealthIndexCardProps) {

  // Resolve o score: usa ISE se disponível, fallback para score simples
  const resolvedScore = ise?.score ?? score ?? 0
  const validScore    = isNaN(resolvedScore)
    ? 0
    : Math.min(Math.max(resolvedScore, 0), 100)

  const theme = getTheme(validScore)

  // Pilares disponíveis apenas quando ISEBreakdown é passado
  const pillars = ise && showPillars ? [
    { label: 'Crescimento', value: ise.crescimento, weight: '40%' },
    { label: 'Conversão',   value: ise.conversao,   weight: '30%' },
    { label: 'Retenção',    value: ise.retencao,    weight: '20%' },
    { label: 'Engajamento', value: ise.engajamento, weight: '10%' },
  ] : null

  return (
    <div className="bg-card p-6 rounded-[28px] border border-border shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mb-1">
            Saúde da Escola (ISE)
          </h3>
          <div className="flex items-baseline gap-1.5">
            <p className={`text-3xl font-black ${theme.text}`}>{validScore.toFixed(0)}</p>
            <span className="text-muted-foreground text-sm font-bold">/100</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase bg-muted ${theme.text}`}>
          {theme.label}
        </span>
      </div>

      {/* Barra principal */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${theme.bg} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${validScore}%` }}
        />
      </div>

      {/* Descrição contextual */}
      {!compact && (
        <p className={`text-[10px] font-black uppercase tracking-wide mt-1 mb-4 ${theme.text}`}>
          {theme.desc}
        </p>
      )}

      {/* Pilares do ISE */}
      {pillars && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          {pillars.map(p => {
            const pVal = isNaN(p.value) ? 0 : Math.min(Math.max(p.value, 0), 100)
            return (
              <div key={p.label} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground font-black uppercase w-20 shrink-0">
                  {p.label}
                </span>
                <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${theme.bg} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${pVal}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-muted-foreground w-8 text-right">
                  {pVal.toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Nota de ponderação */}
      {pillars && !compact && (
        <p className="text-[9px] text-muted-foreground mt-3 leading-tight">
          Análise ponderada: Crescimento 40% · Conversão 30% · Retenção 20% · Engajamento 10%
        </p>
      )}
    </div>
  )
}