import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'   // ← import correto

import { cn } from '@/lib/utils'

// ─── Variantes ────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  // Base
  'inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        // ── Shadcn padrão ───────────────────────────────────────────────────
        default:     'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:   'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive: 'bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:     'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost:       '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link:        'text-primary underline-offset-4 [a&]:hover:underline',

        // ── SchoolRise — Módulos ────────────────────────────────────────────
        growth:  'bg-indigo-50  text-indigo-600  border-indigo-100  font-black uppercase tracking-widest text-[9px]',
        engage:  'bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase tracking-widest text-[9px]',

        // ── SchoolRise — Status de Lead ────────────────────────────────────
        converted:  'bg-emerald-50  text-emerald-600  border-emerald-100',
        presential: 'bg-orange-50   text-orange-600   border-orange-100',
        scheduled:  'bg-amber-50    text-amber-600    border-amber-100',
        contacted:  'bg-indigo-50   text-indigo-600   border-indigo-100',
        responded:  'bg-blue-50     text-blue-600     border-blue-100',
        canceled:   'bg-red-50      text-red-600      border-red-100',
        lead:       'bg-slate-50    text-slate-500    border-slate-100',

        // ── SchoolRise — ISE / Performance ────────────────────────────────
        excellent: 'bg-indigo-50  text-indigo-600  border-indigo-100  font-black uppercase tracking-widest text-[9px]',
        good:      'bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase tracking-widest text-[9px]',
        warning:   'bg-amber-50   text-amber-600   border-amber-100   font-black uppercase tracking-widest text-[9px]',
        critical:  'bg-red-50     text-red-600     border-red-100     font-black uppercase tracking-widest text-[9px]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// ─── Componente ───────────────────────────────────────────────────────────────

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'   // ← Slot direto, sem .Root

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }