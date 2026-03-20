import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── cn — shadcn padrão ───────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Formatação monetária ─────────────────────────────────────────────────────

/**
 * Formata um número como moeda BRL.
 * @example formatCurrency(3775) → "R$ 3.775"
 * @example formatCurrency(3775, true) → "R$ 3.775,00"
 */
export function formatCurrency(value: number, cents = false): string {
  return new Intl.NumberFormat('pt-BR', {
    style:                 'currency',
    currency:              'BRL',
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value ?? 0)
}

// ─── Parse de valor de lead ───────────────────────────────────────────────────

/**
 * Converte strings de valor monetário (ex: "R$ 3.775,00") para número.
 * Seguro contra null, undefined e NaN.
 * @example parseLeadValue("R$ 3.775,00") → 3775
 * @example parseLeadValue(3775) → 3775
 */
export function parseLeadValue(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0
  const n = parseFloat(String(raw).replace(/[R$\s.]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

// ─── Status de lead ───────────────────────────────────────────────────────────

/**
 * Verifica se o status de uma lead é 'converted'.
 */
export function isConverted(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase().trim() === 'converted'
}

// ─── Cálculo de tendência ─────────────────────────────────────────────────────

/**
 * Calcula a variação percentual entre dois valores.
 * @example calcTrend(120, 100) → 20
 * @example calcTrend(80, 100)  → -20
 */
export function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// ─── Formatação de data ───────────────────────────────────────────────────────

/**
 * Formata uma data ISO para o padrão brasileiro.
 * @example formatDate("2026-03-19T...") → "19/03/2026"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Clamp numérico ───────────────────────────────────────────────────────────

/**
 * Garante que um número fique entre min e max.
 * @example clamp(150, 0, 100) → 100
 */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max)
}