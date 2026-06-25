'use client'

import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
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
import type { SupplierWithStats, Purchase, SupplierPaymentFormValues } from './types'
import { DatePicker } from '@/components/ui/date-picker'

const today = () => new Date().toISOString().slice(0, 10)

interface Props {
  open:           boolean
  supplier:       SupplierWithStats | null
  purchases:      Purchase[]
  onClose:        () => void
  onSubmit:       (values: SupplierPaymentFormValues) => Promise<boolean>
}

const EMPTY: SupplierPaymentFormValues = {
  amount: '', payment_method: 'cash', reference_number: '',
  purchase_id: '', payment_date: today(), note: '',
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

export function SupplierPaymentSheet({ open, supplier, purchases, onClose, onSubmit }: Props) {
  const [values,  setValues]  = useState<SupplierPaymentFormValues>(EMPTY)
  const [errors,  setErrors]  = useState<Partial<Record<keyof SupplierPaymentFormValues, string>>>({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, payment_date: today() })
      setErrors({})
      setSaving(false)
    }
  }, [open])

  function set(key: keyof SupplierPaymentFormValues, val: string) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  const outstanding = supplier?.amount_owed ?? 0
  const amountNum   = Number(values.amount) || 0
  const remaining   = Math.max(0, outstanding - amountNum)

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.amount || amountNum <= 0) errs.amount = 'Enter a valid amount'
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
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        <SheetHeader className="px-6 py-5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5 text-neutral-900 dark:text-white">
            <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Landmark className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">Record Supplier Payment</SheetTitle>
              <SheetDescription className="text-xs mt-0.5 text-muted-foreground">
                Record an outgoing payment made to this supplier.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [scrollbar-width:thin]">
            {/* Amount Input group */}
            <Field>
              <FieldLabel>Amount Paid</FieldLabel>
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
            </Field>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Payment Method</FieldLabel>
                <Select value={values.payment_method} onValueChange={v => set('payment_method', (v as any) ?? 'cash')}>
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
                <FieldLabel>Payment Date</FieldLabel>
                <DatePicker value={values.payment_date} onChange={val => set('payment_date', val)} />
              </Field>
            </div>

            {/* Reference No */}
            <Field>
              <FieldLabel>Reference Number</FieldLabel>
              <Input
                value={values.reference_number}
                onChange={e => set('reference_number', e.target.value)}
                placeholder="Cheque No, Txn ID, NEFT ref..."
                className="rounded-lg"
              />
            </Field>

            {/* Against Purchase */}
            {purchases.length > 0 && (
              <Field>
                <FieldLabel>Against Purchase Invoice</FieldLabel>
                <Select value={values.purchase_id} onValueChange={v => set('purchase_id', v ?? '')}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="General payment (unlinked)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="">General payment</SelectItem>
                    {purchases.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.purchase_number ?? `Purchase #${p.id.slice(0, 6)}`} — {rupee(p.grand_total)}
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
                placeholder="Memo note details..."
                className="rounded-lg"
              />
            </Field>

            {/* Live Calculations Summary Box */}
            {supplier && (
              <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10 p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Amount Owed</span>
                  <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-300">{rupee(outstanding)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-400">
                  <span>Payment Made</span>
                  <span className="font-bold tabular-nums">− {rupee(amountNum)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-xs font-bold text-neutral-900 dark:text-white">
                  <span>Remaining Balance</span>
                  <span className="tabular-nums">{rupee(remaining)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="p-6 border-t border-border/60 bg-muted/10 shrink-0">
            <Button
              type="submit"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg h-10 font-semibold"
            >
              {saving ? 'Recording…' : 'Confirm & Save Payment'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
