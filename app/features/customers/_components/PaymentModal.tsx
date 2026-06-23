'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CustomerWithStats, Sale, PaymentFormValues } from './types'

const today = () => new Date().toISOString().slice(0, 10)

interface Props {
  open:           boolean
  customer:       CustomerWithStats | null
  unpaidSales:    Sale[]
  onClose:        () => void
  onSubmit:       (values: PaymentFormValues) => Promise<boolean>
}

const EMPTY: PaymentFormValues = {
  amount: '', payment_method: 'cash', reference_number: '',
  sale_id: '', payment_date: today(), note: '',
}

function rupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export function PaymentModal({ open, customer, unpaidSales, onClose, onSubmit }: Props) {
  const [values,  setValues]  = useState<PaymentFormValues>(EMPTY)
  const [errors,  setErrors]  = useState<Partial<Record<keyof PaymentFormValues, string>>>({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (open) { setValues({ ...EMPTY, payment_date: today() }); setErrors({}); setSaving(false) }
  }, [open])

  function set(key: keyof PaymentFormValues, val: string) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  const outstanding = customer?.total_outstanding ?? 0
  const amountNum   = Number(values.amount) || 0

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.amount || amountNum <= 0) errs.amount = 'Enter a valid amount'
    if (amountNum > outstanding + 1) errs.amount = `Exceeds outstanding balance (${rupee(outstanding)})`
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await onSubmit(values)
    if (ok) onClose()
    else setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Record Payment</DialogTitle>
          {customer && (
            <div className="pt-1 space-y-0.5">
              <p className="text-sm font-medium text-foreground">{customer.name}</p>
              <p className="text-sm text-muted-foreground">
                Outstanding: <span className={cn('font-semibold', outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600')}>
                  {rupee(outstanding)}
                </span>
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Amount <span className="text-red-500">*</span></label>
            <Input
              type="number" min="0.01" step="0.01"
              value={values.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0.00"
              className={cn('text-lg font-semibold', errors.amount && 'border-red-400')}
              autoFocus
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
            {amountNum > 0 && amountNum > outstanding && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Amount exceeds outstanding. This will create an advance credit.
              </p>
            )}
          </div>

          {/* Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Payment Method <span className="text-red-500">*</span></label>
            <Select value={values.payment_method} onValueChange={v => set('payment_method', v ?? 'cash')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Reference No.</label>
            <Input value={values.reference_number} onChange={e => set('reference_number', e.target.value)}
              placeholder="UPI txn ID, cheque no., etc." />
          </div>

          {/* Against Bill */}
          {unpaidSales.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Against Bill</label>
              <Select value={values.sale_id} onValueChange={v => set('sale_id', v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="General payment (not linked to a bill)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General payment</SelectItem>
                  {unpaidSales.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.bill_number ?? `Sale #${s.id.slice(0, 6)}`} — {rupee(s.balance_due)} due
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date <span className="text-red-500">*</span></label>
            <Input type="date" value={values.payment_date} onChange={e => set('payment_date', e.target.value)} />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Note</label>
            <Input value={values.note} onChange={e => set('note', e.target.value)}
              placeholder="Optional note" />
          </div>
        </form>

        <DialogFooter className="pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving} onClick={handleSubmit}
            className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-5">
            {saving ? 'Saving…' : 'Save Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
