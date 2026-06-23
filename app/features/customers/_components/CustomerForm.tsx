'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Customer, CustomerFormValues } from './types'
import { EMPTY_CUSTOMER_FORM, INDIAN_STATES } from './types'

interface Props {
  open:       boolean
  customer:   Customer | null   // null = add mode
  onClose:    () => void
  onSubmit:   (values: CustomerFormValues) => Promise<boolean>
}

function FieldRow({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const PIN_RE   = /^\d{6}$/

export function CustomerForm({ open, customer, onClose, onSubmit }: Props) {
  const isEdit = !!customer
  const [values,  setValues]  = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM)
  const [errors,  setErrors]  = useState<Partial<Record<keyof CustomerFormValues, string>>>({})
  const [saving,  setSaving]  = useState(false)

  // Reset form when opening
  useEffect(() => {
    if (!open) return
    if (customer) {
      setValues({
        name:            customer.name,
        phone:           customer.phone ?? '',
        email:           customer.email ?? '',
        gstin:           customer.gstin ?? '',
        address:         customer.address ?? '',
        city:            customer.city ?? '',
        state:           customer.state ?? '',
        postal_code:     customer.postal_code ?? '',
        credit_limit:    customer.credit_limit ? String(customer.credit_limit) : '',
        opening_balance: String(customer.opening_balance ?? '0'),
        is_active:       customer.is_active,
      })
    } else {
      setValues(EMPTY_CUSTOMER_FORM)
    }
    setErrors({})
    setSaving(false)
  }, [open, customer])

  function set(key: keyof CustomerFormValues, val: string | boolean) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.name.trim())  errs.name  = 'Name is required'
    if (!values.phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\d{10}$/.test(values.phone.trim())) errs.phone = 'Must be 10 digits'
    if (values.gstin.trim() && !GSTIN_RE.test(values.gstin.trim().toUpperCase()))
      errs.gstin = 'Invalid GSTIN format'
    if (values.postal_code.trim() && !PIN_RE.test(values.postal_code.trim()))
      errs.postal_code = 'Must be 6 digits'
    if (values.credit_limit && Number(values.credit_limit) < 0)
      errs.credit_limit = 'Must be ≥ 0'
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
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border/60 shrink-0">
          <SheetTitle className="text-lg font-bold">
            {isEdit ? `Edit — ${customer.name}` : 'Add Customer'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-6 py-5">

            {/* ── Section 1: Basic Info ─────────────────────────────────── */}
            <Section title="Basic Info">
              <FieldRow label="Name" required error={errors.name}>
                <Input value={values.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ramesh Kumar" className={cn(errors.name && 'border-red-400')} />
              </FieldRow>

              <FieldRow label="Phone" required error={errors.phone}>
                <Input value={values.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="9876543210" maxLength={10}
                  className={cn(errors.phone && 'border-red-400')} />
              </FieldRow>

              <FieldRow label="Email" error={errors.email}>
                <Input value={values.email} onChange={e => set('email', e.target.value)}
                  type="email" placeholder="ramesh@example.com" />
              </FieldRow>

              <FieldRow label="GSTIN" error={errors.gstin}>
                <Input value={values.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())}
                  placeholder="08ABCDE1234F1Z5" maxLength={15}
                  className={cn('font-mono', errors.gstin && 'border-red-400')} />
              </FieldRow>

              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive customers are hidden from sales search</p>
                </div>
                <Switch checked={values.is_active} onCheckedChange={v => set('is_active', v)} />
              </div>
            </Section>

            <Separator />

            {/* ── Section 2: Address ────────────────────────────────────── */}
            <Section title="Address">
              <FieldRow label="Street / Area">
                <textarea
                  value={values.address}
                  onChange={e => set('address', e.target.value)}
                  rows={2}
                  placeholder="123 Main Road, Near City Center"
                  className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </FieldRow>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="City">
                  <Input value={values.city} onChange={e => set('city', e.target.value)} placeholder="Jaipur" />
                </FieldRow>
                <FieldRow label="Postal Code" error={errors.postal_code}>
                  <Input value={values.postal_code} onChange={e => set('postal_code', e.target.value)}
                    placeholder="302001" maxLength={6}
                    className={cn(errors.postal_code && 'border-red-400')} />
                </FieldRow>
              </div>

              <FieldRow label="State">
                <Input value={values.state} onChange={e => set('state', e.target.value)}
                  list="states-list" placeholder="Rajasthan" />
                <datalist id="states-list">
                  {INDIAN_STATES.map(s => <option key={s} value={s} />)}
                </datalist>
              </FieldRow>
            </Section>

            <Separator />

            {/* ── Section 3: Credit Settings ────────────────────────────── */}
            <Section title="Credit Settings">
              <FieldRow label="Credit Limit (₹)" error={errors.credit_limit}>
                <Input value={values.credit_limit} onChange={e => set('credit_limit', e.target.value)}
                  type="number" min="0" placeholder="Leave blank for no limit"
                  className={cn(errors.credit_limit && 'border-red-400')} />
              </FieldRow>

              {/* Opening balance only on Add form */}
              {!isEdit && (
                <FieldRow label="Opening Balance (₹)">
                  <Input value={values.opening_balance} onChange={e => set('opening_balance', e.target.value)}
                    type="number" placeholder="0" />
                  <p className="text-xs text-muted-foreground">
                    Positive = they owe you. Negative = advance received. 0 = fresh start.
                  </p>
                </FieldRow>
              )}
            </Section>

          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 shrink-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} onClick={handleSubmit}
            className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-5">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
