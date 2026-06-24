'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Customer, CustomerFormValues } from './types'
import { EMPTY_CUSTOMER_FORM, INDIAN_STATES } from './types'

interface Props {
  open:       boolean
  customer:   Customer | null   // null = add mode
  onClose:    () => void
  onSubmit:   (values: CustomerFormValues) => Promise<boolean>
}

function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>
}

function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-foreground/80">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
      <AlertCircle className="size-3 shrink-0" />
      {message}
    </p>
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        <SheetHeader className="px-8 py-5 border-b border-border/60 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-lg">
              {isEdit ? 'Edit Customer' : 'Add Customer'}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? `Editing registry profile for "${customer.name}"` : 'Register a new customer master account.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 py-1">

            {/* ── Section 1: Basic Info ─────────────────────────────────── */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
                <p className="text-xs text-muted-foreground">General details and account identifiers.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>Customer Name</FieldLabel>
                  <Input
                    value={values.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className={cn(errors.name && 'border-destructive')}
                  />
                  <FieldError message={errors.name} />
                </Field>

                <Field>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <Input
                    value={values.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className={cn(errors.phone && 'border-destructive')}
                  />
                  <FieldError message={errors.phone} />
                </Field>

                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input
                    value={values.email}
                    onChange={e => set('email', e.target.value)}
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                  />
                </Field>

                <Field>
                  <FieldLabel>GSTIN</FieldLabel>
                  <Input
                    value={values.gstin}
                    onChange={e => set('gstin', e.target.value.toUpperCase())}
                    placeholder="e.g. 08ABCDE1234F1Z5"
                    maxLength={15}
                    className={cn('font-mono', errors.gstin && 'border-destructive')}
                  />
                  <FieldError message={errors.gstin} />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 bg-muted/20 mt-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Active Status</p>
                  <p className="text-[11px] text-muted-foreground">Inactive customers are hidden from checkout auto-completions.</p>
                </div>
                <Switch checked={values.is_active} onCheckedChange={v => set('is_active', v)} />
              </div>
            </div>

            <Separator />

            {/* ── Section 2: Address ────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Address & Location</h3>
                <p className="text-xs text-muted-foreground">Primary billing address and shipping location.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field className="md:col-span-2">
                  <FieldLabel>Street Address</FieldLabel>
                  <Textarea
                    value={values.address}
                    onChange={e => set('address', e.target.value)}
                    rows={2}
                    placeholder="e.g. 123 Main Road, Near City Center"
                    className="resize-none rounded-xl focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </Field>

                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input value={values.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Jaipur" />
                </Field>

                <Field>
                  <FieldLabel>Postal Code</FieldLabel>
                  <Input
                    value={values.postal_code}
                    onChange={e => set('postal_code', e.target.value)}
                    placeholder="e.g. 302001"
                    maxLength={6}
                    className={cn(errors.postal_code && 'border-destructive')}
                  />
                  <FieldError message={errors.postal_code} />
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel>State</FieldLabel>
                  <Input
                    value={values.state}
                    onChange={e => set('state', e.target.value)}
                    list="states-list"
                    placeholder="e.g. Rajasthan"
                  />
                  <datalist id="states-list">
                    {INDIAN_STATES.map(s => <option key={s} value={s} />)}
                  </datalist>
                </Field>
              </div>
            </div>

            <Separator />

            {/* ── Section 3: Credit Settings ────────────────────────────── */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Credit & Ledger Settings</h3>
                <p className="text-xs text-muted-foreground">Accounts balances and credit boundaries.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Credit Limit (₹)</FieldLabel>
                  <Input
                    value={values.credit_limit}
                    onChange={e => set('credit_limit', e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Leave blank for no limit"
                    className={cn(errors.credit_limit && 'border-destructive')}
                  />
                  <FieldError message={errors.credit_limit} />
                </Field>

                {/* Opening balance only on Add form */}
                {!isEdit && (
                  <Field>
                    <FieldLabel>Opening Balance (₹)</FieldLabel>
                    <Input
                      value={values.opening_balance}
                      onChange={e => set('opening_balance', e.target.value)}
                      type="number"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                      Positive = customer owes you. Negative = advance deposit credit.
                    </p>
                  </Field>
                )}
              </div>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-border/60 shrink-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-lg">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-5"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
