'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PurchasePaymentStatus } from '../../suppliers/_components/types'

const PAYMENT_STATUS_STYLE: Record<PurchasePaymentStatus, string> = {
  paid:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  partial: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
  pending: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900',
}

/** 60+ days unpaid — row-level aging cue on the Purchases list. */
export function isPurchaseAgedUnpaid(
  purchaseDate: string,
  balanceDue: number,
  paymentStatus: PurchasePaymentStatus,
): boolean {
  if (paymentStatus === 'paid' || balanceDue <= 0) return false
  const days = Math.floor(
    (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  return days > 60
}

interface Props {
  status: PurchasePaymentStatus
  /** Amber border + clock icon for 60+ day unpaid POs */
  aged?: boolean
  className?: string
}

export function PaymentStatusBadge({ status, aged = false, className }: Props) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
        PAYMENT_STATUS_STYLE[status],
        aged && 'ring-2 ring-amber-400/60 dark:ring-amber-500/50',
      )}>
        {label}
      </span>
      {aged && (
        <Clock className="size-3 text-amber-600 dark:text-amber-400 shrink-0" aria-label="Aged payable" />
      )}
    </span>
  )
}
