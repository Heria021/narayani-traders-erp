'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Client, ClientFormValues } from './types'
import { EMPTY_CLIENT_FORM, INDIAN_STATES } from './types'

interface Props {
  open: boolean
  client: Client | null // null = add mode
  onClose: () => void
  onSubmit: (values: ClientFormValues) => Promise<boolean>
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

export function ClientForm({ open, client, onClose, onSubmit }: Props) {
  const isEdit = !!client
  const [values, setValues] = useState<ClientFormValues>(EMPTY_CLIENT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  // Reset form when opening
  useEffect(() => {
    if (!open) return
    if (client) {
      setValues({
        name: client.name,
        phone: client.phone ?? '',
        email: client.email ?? '',
        city: client.city ?? '',
        state: client.state ?? '',
        gstin: client.gstin ?? '',
        notes: client.notes ?? '',
      })
    } else {
      setValues(EMPTY_CLIENT_FORM)
    }
    setErrors({})
    setSaving(false)
  }, [open, client])

  function set(key: keyof ClientFormValues, val: string) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.name.trim()) errs.name = 'Name is required'
    if (!values.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(values.phone.trim())) errs.phone = 'Must be exactly 10 digits'
    
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errs.email = 'Invalid email address'
    }

    if (values.gstin.trim() && !GSTIN_RE.test(values.gstin.trim().toUpperCase())) {
      errs.gstin = 'Invalid GSTIN format (e.g. 08ABCDE1234F1Z5)'
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
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[600px] lg:max-w-[600px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        <SheetHeader className="px-8 py-5 border-b border-border/60 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-lg">
              {isEdit ? 'Edit Client Profile' : 'Add New Client'}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? `Modifying records for "${client.name}"` : 'Register a new client profile for project records.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 py-6">
            
            {/* Basic Section */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Basic Information</h3>
                <p className="text-[11px] text-muted-foreground">General details and communication identifiers.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field>
                  <FieldLabel required>Client Name</FieldLabel>
                  <Input
                    value={values.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
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
                    placeholder="e.g. rahul@example.com"
                    className={cn(errors.email && 'border-destructive')}
                  />
                  <FieldError message={errors.email} />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Address & GST Section */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Location & GST</h3>
                <p className="text-[11px] text-muted-foreground">For billing location and official invoicing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input
                    value={values.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="e.g. Jaipur"
                  />
                </Field>

                <Field>
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

                <Field className="md:col-span-2">
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
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Internal Notes</h3>
                <p className="text-[11px] text-muted-foreground">Private details, referral sources, or studio specific preferences.</p>
              </div>

              <Field>
                <Textarea
                  value={values.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Notes about client background, referred by, etc..."
                  rows={4}
                  className="resize-none rounded-xl focus-visible:ring-1 focus-visible:ring-ring"
                />
              </Field>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-border/60 shrink-0 bg-background">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="rounded-lg">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-5"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
