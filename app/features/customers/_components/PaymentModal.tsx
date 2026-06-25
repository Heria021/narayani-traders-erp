'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupText
} from '@/components/ui/input-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomerWithStats, Sale, PaymentFormValues } from './types'
import { DatePicker } from '@/components/ui/date-picker'

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

function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-foreground/80">
      {children}
    </label>
  )
}

export function PaymentModal({ open, customer, unpaidSales, onClose, onSubmit }: Props) {
  const [values,  setValues]  = useState<PaymentFormValues>(EMPTY)
  const [errors,  setErrors]  = useState<Partial<Record<keyof PaymentFormValues, string>>>({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, payment_date: today() })
      setErrors({})
      setSaving(false)
    }
  }, [open])

  function set(key: keyof PaymentFormValues, val: string) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  const netOwed = customer?.total_outstanding ?? 0
  const amountNum = Number(values.amount) || 0
  const linkedSale = values.sale_id
    ? unpaidSales.find(s => s.id === values.sale_id) ?? null
    : null
  const remaining = netOwed - amountNum

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.amount || amountNum <= 0) errs.amount = 'Enter a valid amount'
    if (linkedSale && amountNum > linkedSale.balance_due + 0.001) {
      errs.amount = `Cannot exceed invoice balance (${rupee(linkedSale.balance_due)})`
    }
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
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
            <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Landmark className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Record Payment</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Collect money from customer and record it in ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Amount Input group */}
          <Field>
            <FieldLabel>Amount to Transfer</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>₹</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                min="0.01"
                step="0.01"
                value={values.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                className={cn('text-lg font-bold tabular-nums', errors.amount && 'border-destructive')}
                autoFocus
              />
            </InputGroup>
            {errors.amount && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="size-3 shrink-0" />
                {errors.amount}
              </p>
            )}
            {!linkedSale && amountNum > Math.max(0, netOwed) && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                Amount exceeds net owed — excess will be recorded as advance credit on the ledger.
              </p>
            )}
          </Field>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Payment Method</FieldLabel>
              <Select value={values.payment_method} onValueChange={v => set('payment_method', v ?? 'cash')}>
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Date</FieldLabel>
              <DatePicker value={values.payment_date} onChange={val => set('payment_date', val)} />
            </Field>
          </div>

          {/* Reference No */}
          <Field>
            <FieldLabel>Reference Number</FieldLabel>
            <Input
              value={values.reference_number}
              onChange={e => set('reference_number', e.target.value)}
              placeholder="UPI txn ID, Cheque no, etc."
              className="rounded-lg"
            />
          </Field>

          {/* Against Bill */}
          {unpaidSales.length > 0 && (
            <Field>
              <FieldLabel>Against Invoice / Bill</FieldLabel>
              <Select value={values.sale_id} onValueChange={v => set('sale_id', v ?? '')}>
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="General payment (unlinked)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="">General payment</SelectItem>
                  {unpaidSales.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.invoice_number} — {rupee(s.balance_due)} due
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Note */}
          <Field>
            <FieldLabel>Optional Memo Note</FieldLabel>
            <Input
              value={values.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Memo text..."
              className="rounded-lg"
            />
          </Field>

          {/* Live Calculations Summary Box */}
          {customer && (
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10 p-3.5 space-y-2 mt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Ledger Balance</span>
                <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-300">{rupee(netOwed)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                <span>Payment Amount</span>
                <span className="font-bold tabular-nums">− {rupee(amountNum)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-xs font-bold text-neutral-900 dark:text-white">
                <span>Remaining Balance</span>
                <span className="tabular-nums">{remaining <= 0 ? rupee(0) : rupee(remaining)}</span>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg h-10 font-semibold"
            >
              {saving ? 'Recording…' : 'Confirm & Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
