/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Supplier, SupplierFormValues } from './types'
import { EMPTY_SUPPLIER_FORM, INDIAN_STATES } from './types'

interface Props {
  open:     boolean
  supplier: Supplier | null
  onClose:  () => void
  onSubmit: (values: SupplierFormValues) => Promise<boolean>
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

export function SupplierForm({ open, supplier, onClose, onSubmit }: Props) {
  const isEdit = !!supplier
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (supplier) {
      setValues({
        name:            supplier.name,
        phone:           supplier.phone ?? '',
        email:           supplier.email ?? '',
        gstin:           supplier.gstin ?? '',
        address:         supplier.address ?? '',
        city:            supplier.city ?? '',
        state:           supplier.state ?? '',
        postal_code:     supplier.postal_code ?? '',
        opening_balance: String(supplier.opening_balance ?? '0'),
      })
    } else {
      setValues(EMPTY_SUPPLIER_FORM)
    }
    setErrors({})
    setSaving(false)
  }, [open, supplier])

  function set(key: keyof SupplierFormValues, val: string) {
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
              {isEdit ? 'Edit Supplier' : 'Add Supplier'}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? `Editing registry profile for "${supplier.name}"` : 'Register a new supplier master account.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 py-4">

            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
                <p className="text-xs text-muted-foreground">General details and business identifiers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>Supplier Name</FieldLabel>
                  <Input
                    value={values.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Sharma Stationery Wholesale"
                    className={cn(errors.name && 'border-destructive')}
                  />
                  <FieldError message={errors.name} />
                </Field>

                <Field>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <Input
                    value={values.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="e.g. 9812345678"
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
                    placeholder="e.g. sharma@wholesale.com"
                  />
                </Field>

                <Field>
                  <FieldLabel>GSTIN</FieldLabel>
                  <Input
                    value={values.gstin}
                    onChange={e => set('gstin', e.target.value.toUpperCase())}
                    placeholder="e.g. 08XYZAB1234C1Z2"
                    maxLength={15}
                    className={cn('font-mono', errors.gstin && 'border-destructive')}
                  />
                  <FieldError message={errors.gstin} />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Address & Location Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Address & Location</h3>
                <p className="text-xs text-muted-foreground">Primary warehouse or office location.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field className="md:col-span-2">
                  <FieldLabel>Street Address</FieldLabel>
                  <Textarea
                    value={values.address}
                    onChange={e => set('address', e.target.value)}
                    rows={2}
                    placeholder="e.g. Shop 12, Market Complex"
                    className="resize-none"
                  />
                </Field>

                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input
                    value={values.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="e.g. Jaipur"
                  />
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
                  <FieldLabel>State / Union Territory</FieldLabel>
                  <Input
                    value={values.state}
                    onChange={e => set('state', e.target.value)}
                    list="sup-states-list"
                    placeholder="e.g. Rajasthan"
                  />
                  <datalist id="sup-states-list">
                    {INDIAN_STATES.map(s => <option key={s} value={s} />)}
                  </datalist>
                </Field>
              </div>
            </div>

            {/* Opening Balance — add mode only */}
            {!isEdit && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Opening Balance</h3>
                    <p className="text-xs text-muted-foreground">Owed amount at account setup.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Field>
                      <FieldLabel>Opening Balance (₹)</FieldLabel>
                      <Input
                        value={values.opening_balance}
                        onChange={e => set('opening_balance', e.target.value)}
                        type="number"
                        placeholder="0"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Amount owed to this supplier from before this system. Positive = you owe them. 0 = fresh start.
                      </p>
                    </Field>
                  </div>
                </div>
              </>
            )}

          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-8 py-4 border-t border-border/60 shrink-0 bg-muted/10">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="bg-foreground text-background hover:bg-foreground/90 font-semibold"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
