'use client'

import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, User, MapPin, FileText, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Client, ClientFormValues } from './types'
import { EMPTY_CLIENT_FORM, INDIAN_STATES } from './types'

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  client: Client | null
  onClose: () => void
  onSubmit: (values: ClientFormValues) => Promise<boolean>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
      <AlertCircle className="size-3 shrink-0" /> {message}
    </p>
  )
}

function SectionCard({
  icon: Icon, title, description, children
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/5 border shrink-0">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// ─────────────────────────────────────────────────────────────────────────────

export function ClientForm({ open, client, onClose, onSubmit }: Props) {
  const isEdit = !!client
  const [values, setValues] = useState<ClientFormValues>(EMPTY_CLIENT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

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
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground/5 border">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold leading-tight">
                {isEdit ? 'Edit Client Profile' : 'Add New Client'}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {isEdit
                  ? `Updating records for "${client.name}"`
                  : 'Register a new client to link to projects.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

            {/* ── Section 1: Basic Info ── */}
            <SectionCard
              icon={User}
              title="Basic Information"
              description="Client name and primary contact identifiers."
            >
              <div className="space-y-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={values.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={cn('text-sm', errors.name && 'border-destructive')}
                  />
                  <FieldError message={errors.name} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">
                      Phone <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={values.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="10-digit number"
                      maxLength={10}
                      className={cn('text-sm font-mono', errors.phone && 'border-destructive')}
                    />
                    <FieldError message={errors.phone} />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">Email</label>
                    <Input
                      value={values.email}
                      onChange={e => set('email', e.target.value)}
                      type="email"
                      placeholder="e.g. rahul@email.com"
                      className={cn('text-sm', errors.email && 'border-destructive')}
                    />
                    <FieldError message={errors.email} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Section 2: Location & GST ── */}
            <SectionCard
              icon={MapPin}
              title="Location & Tax"
              description="Billing address and GST registration details."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">City</label>
                    <Input
                      value={values.city}
                      onChange={e => set('city', e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="text-sm"
                    />
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/70">State</label>
                    <Input
                      value={values.state}
                      onChange={e => set('state', e.target.value)}
                      list="states-datalist"
                      placeholder="e.g. Rajasthan"
                      className="text-sm"
                    />
                    <datalist id="states-datalist">
                      {INDIAN_STATES.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>

                {/* GSTIN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/70">GSTIN</label>
                  <div className="flex items-center rounded-lg border bg-muted/10 overflow-hidden focus-within:ring-2 focus-within:ring-ring/30">
                    <span className="px-3 text-xs text-muted-foreground border-r bg-muted/40 h-9 flex items-center shrink-0 font-mono">GST</span>
                    <Input
                      value={values.gstin}
                      onChange={e => set('gstin', e.target.value.toUpperCase())}
                      placeholder="08ABCDE1234F1Z5"
                      maxLength={15}
                      className={cn(
                        'border-0 bg-transparent rounded-none shadow-none focus-visible:ring-0 font-mono text-sm h-9',
                        errors.gstin && 'text-destructive'
                      )}
                    />
                  </div>
                  <FieldError message={errors.gstin} />
                </div>
              </div>
            </SectionCard>

            {/* ── Section 3: Notes ── */}
            <SectionCard
              icon={StickyNote}
              title="Internal Notes"
              description="Private context — referral source, preferences, history."
            >
              <Textarea
                value={values.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Notes about client background, referred by, design preferences…"
                rows={4}
                className="resize-none text-sm"
              />
            </SectionCard>

          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t bg-muted/10 flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              {isEdit ? 'Changes will update this client record.' : 'Client will be added to your portfolio.'}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" type="button" onClick={onClose} disabled={saving} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-5 font-semibold rounded-lg text-sm"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
