'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Sale, PaymentMethod } from './types'
import { PAYMENT_METHOD_LABELS } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const REFERENCE_METHODS: PaymentMethod[] = ['upi', 'card', 'bank_transfer']

interface Props {
  open: boolean
  sale: Sale | null
  onClose: () => void
  onRecord: (
    sale: Sale,
    amount: number,
    method: PaymentMethod,
    referenceNumber: string,
  ) => Promise<boolean>
}

export function RecordPaymentModal({ open, sale, onClose, onRecord }: Props) {
  const [amount,    setAmount]    = useState('')
  const [method,    setMethod]    = useState<PaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  // Pre-fill amount when sale changes
  useEffect(() => {
    if (sale) {
      setAmount(sale.balance_due.toFixed(2))
      setMethod('cash')
      setReference('')
      setError('')
    }
  }, [sale])

  const showReference = REFERENCE_METHODS.includes(method)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sale) return

    const amt = Number(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than ₹0')
      return
    }
    if (amt > sale.balance_due + 0.001) {
      setError(`Cannot exceed balance due (${rupee(sale.balance_due)})`)
      return
    }

    setSaving(true)
    setError('')
    const ok = await onRecord(sale, amt, method, reference)
    setSaving(false)
    if (ok) onClose()
  }

  function handleClose() {
    if (saving) return
    onClose()
  }

  const balanceDue = sale?.balance_due ?? 0
  const paidAmount = Number(amount) || 0
  const remaining  = Math.max(0, balanceDue - paidAmount)

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Record Payment</DialogTitle>
          {sale && (
            <DialogDescription>
              Recording payment for{' '}
              <span className="font-mono font-semibold text-foreground">{sale.invoice_number}</span>
              {' '}· {sale.customer_name}
            </DialogDescription>
          )}
        </DialogHeader>

        {sale && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Outstanding info */}
            <div className="rounded-xl bg-muted/40 border border-border/40 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grand Total</span>
                <span className="tabular-nums font-medium">{rupee(sale.grand_total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                  {rupee(sale.amount_paid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border/40 pt-2">
                <span className="font-semibold text-foreground">Balance Due</span>
                <span className="tabular-nums font-bold text-red-600 dark:text-red-400">
                  {rupee(balanceDue)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method
              </Label>
              <Select value={method} onValueChange={v => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference No. (UPI / Card / Bank) */}
            {showReference && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference No. <span className="normal-case font-normal">(optional)</span>
                </Label>
                <Input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={method === 'upi' ? 'UPI transaction ID' : method === 'card' ? 'Last 4 digits / ref' : 'Transaction ref'}
                />
              </div>
            )}

            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount Paid <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium"
                  onClick={() => { setAmount(balanceDue.toFixed(2)); setError('') }}
                >
                  Pay Full ({rupee(balanceDue)})
                </button>
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={balanceDue}
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError('') }}
                  placeholder="0.00"
                  className={cn('pl-8 tabular-nums', error && 'border-red-400 focus-visible:ring-red-400/40')}
                />
              </div>
              {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />{error}
                </p>
              )}
              {paidAmount > 0 && paidAmount < balanceDue && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Remaining balance after this payment: {rupee(remaining)}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Recording…</> : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
