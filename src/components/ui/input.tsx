import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Layout
        'h-10 w-full min-w-0 px-4 py-2',
        // Visual — alinhado com SchoolRise (bg-muted, rounded-2xl, sem sombra)
        'rounded-2xl border border-border bg-muted',
        // Tipografia
        'text-sm font-medium text-foreground placeholder:text-muted-foreground',
        // File input
        'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Estados
        'transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-background',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // Validação
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        // Seleção de texto
        'selection:bg-primary selection:text-primary-foreground',
        className
      )}
      {...props}
    />
  )
}

export { Input }
