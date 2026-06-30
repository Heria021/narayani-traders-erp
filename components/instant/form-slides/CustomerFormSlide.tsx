'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCustomers } from '@/app/features/customers/_components/useCustomers'
import type { CustomerFormValues } from '@/app/features/customers/_components/types'
import { EMPTY_CUSTOMER_FORM, INDIAN_STATES } from '@/app/features/customers/_components/types'

// ─── tiny helpers ──────────────────────────────────────────────────────────────

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

interface Props {
  onSuccess?: () => void
}

export function CustomerFormSlide({ onSuccess }: Props) {
  const { addCustomer } = useCustomers()
  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setValues(EMPTY_CUSTOMER_FORM)
    setErrors({})
    setSaving(false)
    setSubmitted(false)
  }, [])

  function set(key: keyof CustomerFormValues, val: string | boolean) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key as keyof typeof errors]) setErrors(e => ({ ...e, [key]: undefined }))
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
    const ok = await addCustomer(values)
    setSaving(false)
    if (ok) {
      setSubmitted(true)
      setValues(EMPTY_CUSTOMER_FORM)
      setErrors({})
      setTimeout(() => setSubmitted(false), 2000)
      onSuccess?.()
    }
  }

  return (
    <form id="instant-customer-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {submitted && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          Customer added successfully! Form ready for another entry.
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
          <p className="text-xs text-muted-foreground">General details and account identifiers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="ic-name" required>Customer Name</FieldLabel>
            <Input
              id="ic-name"
              value={values.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className={cn(errors.name && 'border-destructive')}
            />
            <FieldError message={errors.name} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-phone" required>Phone Number</FieldLabel>
            <Input
              id="ic-phone"
              value={values.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className={cn(errors.phone && 'border-destructive')}
            />
            <FieldError message={errors.phone} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-email">Email Address</FieldLabel>
            <Input
              id="ic-email"
              value={values.email}
              onChange={e => set('email', e.target.value)}
              type="email"
              placeholder="e.g. ramesh@example.com"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-gstin">GSTIN</FieldLabel>
            <Input
              id="ic-gstin"
              value={values.gstin}
              onChange={e => set('gstin', e.target.value.toUpperCase())}
              placeholder="e.g. 08ABCDE1234F1Z5"
              maxLength={15}
              className={cn('font-mono', errors.gstin && 'border-destructive')}
            />
            <FieldError message={errors.gstin} />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">Active Status</p>
            <p className="text-[11px] text-muted-foreground">Inactive customers are hidden from checkout auto-completions.</p>
          </div>
          <Switch
            checked={values.is_active}
            onCheckedChange={v => set('is_active', v)}
          />
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Address & Location</h3>
          <p className="text-xs text-muted-foreground">Primary billing address and shipping location.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field className="md:col-span-2">
            <FieldLabel htmlFor="ic-address">Street Address</FieldLabel>
            <Textarea
              id="ic-address"
              value={values.address}
              onChange={e => set('address', e.target.value)}
              rows={2}
              placeholder="e.g. 123 Main Road, Near City Center"
              className="resize-none"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-city">City</FieldLabel>
            <Input
              id="ic-city"
              value={values.city}
              onChange={e => set('city', e.target.value)}
              placeholder="e.g. Jaipur"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-postal-code">Postal Code</FieldLabel>
            <Input
              id="ic-postal-code"
              value={values.postal_code}
              onChange={e => set('postal_code', e.target.value)}
              placeholder="e.g. 302001"
              maxLength={6}
              className={cn(errors.postal_code && 'border-destructive')}
            />
            <FieldError message={errors.postal_code} />
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="ic-state">State</FieldLabel>
            <Input
              id="ic-state"
              value={values.state}
              onChange={e => set('state', e.target.value)}
              list="ic-states-list"
              placeholder="e.g. Rajasthan"
            />
            <datalist id="ic-states-list">
              {INDIAN_STATES.map(s => <option key={s} value={s} />)}
            </datalist>
          </Field>
        </div>
      </div>

      <Separator />

      {/* Credit & Ledger */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Credit & Ledger Settings</h3>
          <p className="text-xs text-muted-foreground">Account balances and credit boundaries.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="ic-credit-limit">Credit Limit (₹)</FieldLabel>
            <Input
              id="ic-credit-limit"
              value={values.credit_limit}
              onChange={e => set('credit_limit', e.target.value)}
              type="number"
              min="0"
              placeholder="Leave blank for no limit"
              className={cn(errors.credit_limit && 'border-destructive')}
            />
            <FieldError message={errors.credit_limit} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ic-opening-balance">Opening Balance (₹)</FieldLabel>
            <Input
              id="ic-opening-balance"
              value={values.opening_balance}
              onChange={e => set('opening_balance', e.target.value)}
              type="number"
              placeholder="0"
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
              Positive = customer owes you. Negative = advance deposit credit.
            </p>
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="w-full h-11 text-sm font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Adding Customer…
            </>
          ) : 'Add Customer'}
        </Button>
      </div>
    </form>
  )
}
