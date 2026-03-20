'use client'

import * as React from 'react'
import { XIcon } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'   // ← import correto

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ─── Wrappers simples ─────────────────────────────────────────────────────────

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Animações de entrada/saída
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        // Visual — backdrop desfocado alinhado com AddLeadDialog/EditLeadDialog
        'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm',
        className
      )}
      {...props}
    />
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Posicionamento
          'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          // Tamanho
          'w-full max-w-[calc(100%-2rem)] sm:max-w-lg',
          // Visual — alinhado com SchoolRise (rounded-[32px], bg-card, border-border)
          'bg-card border border-border shadow-2xl',
          'rounded-[32px] p-8',
          // Animações
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-200 outline-none',
          // Layout interno
          'grid gap-4',
          className
        )}
        {...props}
      >
        {children}

        {/* Botão fechar — alinhado com padrão SchoolRise */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              'absolute top-5 right-5',
              'p-2 rounded-xl',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-all',
              'disabled:pointer-events-none',
              '[&_svg]:pointer-events-none [&_svg]:shrink-0',
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Fechar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

// ─── Title ────────────────────────────────────────────────────────────────────

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // Alinhado com padrão SchoolRise — font-black uppercase
        'text-foreground text-2xl font-black uppercase tracking-tight leading-none',
        className
      )}
      {...props}
    />
  )
}

// ─── Description ─────────────────────────────────────────────────────────────

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground text-[10px] font-bold uppercase tracking-widest',
        className
      )}
      {...props}
    />
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}