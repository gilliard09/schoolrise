'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'   // ← import correto

import { cn } from '@/lib/utils'

// ─── Variante de cor baseada no valor ─────────────────────────────────────────
// Alinhado com os thresholds do ISE e GoalReadCard:
// < 40  → crítico  (vermelho)
// < 75  → atenção  (âmbar)
// ≥ 75  → bom      (verde)
// Pode ser sobrescrito via prop `indicatorClassName`

function getIndicatorColor(value: number): string {
  if (value < 40) return 'bg-red-500'
  if (value < 75) return 'bg-amber-500'
  return 'bg-emerald-500'
}

// ─── Componente ───────────────────────────────────────────────────────────────

function Progress({
  className,
  value,
  indicatorClassName,
  autoColor = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
  autoColor?: boolean       // true → cor automática pelo valor (crítico/atenção/bom)
}) {
  const numValue = value ?? 0

  const indicatorColor = autoColor
    ? getIndicatorColor(numValue)
    : 'bg-primary'

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-muted relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
      value={numValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 rounded-full transition-all duration-700 ease-out',
          indicatorColor,
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - Math.min(Math.max(numValue, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }