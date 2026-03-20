import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Table ────────────────────────────────────────────────────────────────────

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

// ─── TableHeader ──────────────────────────────────────────────────────────────

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        // Fundo sutil nos headers — alinhado com LeadsTable
        'bg-muted/30 [&_tr]:border-b [&_tr]:border-border',
        className
      )}
      {...props}
    />
  )
}

// ─── TableBody ────────────────────────────────────────────────────────────────

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

// ─── TableFooter ─────────────────────────────────────────────────────────────

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t border-border font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

// ─── TableRow ─────────────────────────────────────────────────────────────────

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Alinhado com LeadsTable — hover suave, border bottom
        'border-b border-border transition-colors',
        'hover:bg-muted/30 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

// ─── TableHead ───────────────────────────────────────────────────────────────

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Alinhado com LeadsTable — text-[10px] font-black uppercase
        'h-10 px-5 text-left align-middle whitespace-nowrap',
        'text-[10px] font-black uppercase tracking-widest text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  )
}

// ─── TableCell ───────────────────────────────────────────────────────────────

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Padding alinhado com LeadsTable (p-5)
        'p-5 align-middle whitespace-nowrap',
        '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  )
}

// ─── TableCaption ─────────────────────────────────────────────────────────────

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        'text-muted-foreground mt-4 text-[10px] font-bold uppercase tracking-widest',
        className
      )}
      {...props}
    />
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}