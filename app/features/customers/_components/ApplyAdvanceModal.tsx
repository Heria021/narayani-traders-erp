'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowRightLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Payment, Sale } from './types'
import { PAYMENT_METHOD_LABELS } from '../../sales/_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  open: boolean
  payment: Payment | null
  openInvoices: Sale[]
  onClose: () => void
  onApply: (saleId: string, applyAmount: number) => Promise<boolean>
}

export function ApplyAdvanceModal({ open, payment, openInvoices, onClose, onApply }: Props) {
  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [applyAmount, setApplyAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedSale = openInvoices.find(s => s.id === selectedSaleId) ?? null
  const maxApply = payment && selectedSale
    ? Math.min(payment.amount, selectedSale.balance_due)
    : payment?.amount ?? 0
  const willSplit = payment && Number(applyAmount) > 0
    && Number(applyAmount) < payment.amount - 0.001

  useEffect(() => {
    if (!open || !payment) return
    setSelectedSaleId('')
    setApplyAmount('')
    setError('')
    setSaving(false)
  }, [open, payment])

  useEffect(() => {
    if (!selectedSale || !payment) return
    setApplyAmount(Math.min(payment.amount, selectedSale.balance_due).toFixed(2))
    setError('')
  }, [selectedSaleId, selectedSale, payment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!payment || !selectedSaleId) {
      setError('Select an invoice to apply this payment to')
      return
    }

    const amt = Number(applyAmount)
    if (!applyAmount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than ₹0')
      return
    }
    if (amt > payment.amount + 0.001) {
      setError(`Cannot apply more than the payment amount (${rupee(payment.amount)})`)
      return
    }
    if (selectedSale && amt > selectedSale.balance_due + 0.001) {
      setError(`Cannot apply more than invoice balance (${rupee(selectedSale.balance_due)})`)
      return
    }

    setSaving(true)
    setError('')
    const ok = await onApply(selectedSaleId, amt)
    setSaving(false)
    if (ok) onClose()
  }

  function handleClose() {
    if (saving) return
    onClose()
  }

  const methodLabel = payment
    ? (PAYMENT_METHOD_LABELS[payment.payment_method as keyof typeof PAYMENT_METHOD_LABELS]
      ?? payment.payment_method.replace('_', ' '))
    : ''

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <ArrowRightLeft className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold">Apply Advance to Invoice</DialogTitle>
          </div>
          {payment && (
            <DialogDescription>
              {rupee(payment.amount)} — {methodLabel.toUpperCase()} — {fmtDate(payment.payment_date)}
            </DialogDescription>
          )}
        </DialogHeader>

        {payment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Link this unapplied payment to an open invoice. Applying only part of a larger
              advance will split it into two records — the applied portion and the remaining advance.
            </p>

            {openInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No open invoices with a balance due for this customer.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Open Invoices
                  </Label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border divide-y [scrollbar-width:thin]">
                    {openInvoices.map(s => {
                      const isSelected = selectedSaleId === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSaleId(s.id)}
                          className={cn(
                            'w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-primary/5 border-l-2 border-l-primary'
                              : 'hover:bg-muted/40',
                          )}
                        >
                          <div>
                            <span className="font-mono font-semibold text-xs">{s.invoice_number}</span>
                            <span className="text-xs text-muted-foreground ml-2">{fmtDate(s.sale_date)}</span>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                            {rupee(s.balance_due)} due
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedSale && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount to Apply
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline font-medium"
                        onClick={() => setApplyAmount(maxApply.toFixed(2))}
                      >
                        Apply max ({rupee(maxApply)})
                      </button>
                    </div>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={maxApply}
                      value={applyAmount}
                      onChange={e => { setApplyAmount(e.target.value); setError('') }}
                      className={cn('tabular-nums', error && 'border-red-400')}
                    />
                    {willSplit && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                        <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                        Applying {rupee(Number(applyAmount))} will split this payment —{' '}
                        {rupee(payment.amount - Number(applyAmount))} will remain as unapplied advance.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />{error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || openInvoices.length === 0 || !selectedSaleId}
              >
                {saving
                  ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Applying…</>
                  : 'Apply to Invoice'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
