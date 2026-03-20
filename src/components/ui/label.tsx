'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'   // ← import correto

import { cn } from '@/lib/utils'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Layout
        'flex items-center gap-2',
        // Tipografia — alinhado com padrão SchoolRise
        'text-[10px] font-bold uppercase tracking-widest leading-none',
        'text-muted-foreground',
        // Estados
        'select-none',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Label }