'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { AlertCircle, Image as ImageIcon, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectWithRelations, ProjectFormValues } from './types'
import { EMPTY_PROJECT_FORM, PROJECT_TYPES } from './types'
import { INDIAN_STATES } from '../../clients/_components/types'

interface Props {
  open: boolean
  project: ProjectWithRelations | null // null = add mode
  clients: { id: string; name: string }[]
  onClose: () => void
  onSubmit: (values: ProjectFormValues, file: File | null) => Promise<boolean>
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

export function ProjectForm({ open, project, clients, onClose, onSubmit }: Props) {
  const isEdit = !!project
  const [values, setValues] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  // Local state for image upload handling
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Reset form when opening
  useEffect(() => {
    if (!open) return
    if (project) {
      // Find cover image if it exists in media list
      const coverMediaItem = project.media?.find(m => m.caption === 'Cover Image' || m.sort_order === 0)
      const coverUrl = coverMediaItem?.file_url ?? ''

      setValues({
        client_id: project.client_id,
        title: project.title,
        type: project.type,
        city: project.city ?? '',
        state: project.state ?? '',
        area_sqft: project.area_sqft ? project.area_sqft.toString() : '',
        floors: project.floors ? project.floors.toString() : '',
        configuration: project.configuration ?? '',
        rate_per_sqft: project.rate_per_sqft ? project.rate_per_sqft.toString() : '',
        agreed_fee: project.agreed_fee ? project.agreed_fee.toString() : '',
        year_completed: project.year_completed ? project.year_completed.toString() : '',
        start_date: project.start_date ?? '',
        completion_date: project.completion_date ?? '',
        description: project.description ?? '',
        internal_notes: project.internal_notes ?? '',
        client_testimonial: project.client_testimonial ?? '',
        cover_image_url: coverUrl,
      })
      setImagePreview(coverUrl || null)
    } else {
      setValues(EMPTY_PROJECT_FORM)
      setImagePreview(null)
    }
    setImageFile(null)
    setErrors({})
    setSaving(false)
  }, [open, project])

  function set(key: keyof ProjectFormValues, val: string) {
    setValues(v => {
      const next = { ...v, [key]: val }
      
      // Auto-compute Agreed Fee if Area and Rate are provided
      if (key === 'area_sqft' || key === 'rate_per_sqft') {
        const area = parseFloat(next.area_sqft)
        const rate = parseFloat(next.rate_per_sqft)
        if (!isNaN(area) && !isNaN(rate)) {
          next.agreed_fee = Math.round(area * rate).toString()
        }
      }
      return next
    })
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      // Clear cover_image_url field when a local file is picked
      setValues(v => ({ ...v, cover_image_url: '' }))
    }
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setValues(v => ({ ...v, cover_image_url: '' }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!values.client_id) errs.client_id = 'Client is required'
    if (!values.title.trim()) errs.title = 'Project title is required'
    if (!values.type) errs.type = 'Project type is required'

    if (values.area_sqft && isNaN(parseFloat(values.area_sqft))) {
      errs.area_sqft = 'Must be a valid number'
    }
    if (values.floors && (isNaN(parseInt(values.floors)) || parseInt(values.floors) < 0)) {
      errs.floors = 'Must be a valid positive integer'
    }
    if (values.rate_per_sqft && isNaN(parseFloat(values.rate_per_sqft))) {
      errs.rate_per_sqft = 'Must be a valid number'
    }
    if (values.agreed_fee && isNaN(parseFloat(values.agreed_fee))) {
      errs.agreed_fee = 'Must be a valid number'
    }
    if (values.year_completed) {
      const year = parseInt(values.year_completed)
      if (isNaN(year) || year < 1900 || year > 2100) {
        errs.year_completed = 'Must be a valid year (1900-2100)'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await onSubmit(values, imageFile)
    if (ok) onClose()
    else setSaving(false)
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[650px] lg:max-w-[650px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        <SheetHeader className="px-8 py-5 border-b border-border/60 shrink-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-lg font-bold">
              {isEdit ? 'Edit Project Record' : 'Create Project Record'}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? `Modifying project record: "${project.title}"` : 'Log a newly completed project into the portfolio records.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 px-8 py-6">
            
            {/* Owner/Client association */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Client Association</h3>
                <p className="text-[11px] text-muted-foreground">Every project record must be linked to a registered client.</p>
              </div>

              {clients.length === 0 ? (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">No clients registered.</span> You must create a client profile before logging projects.
                  </div>
                </div>
              ) : (
                <Field>
                  <FieldLabel required>Select Client</FieldLabel>
                  <NativeSelect
                    value={values.client_id}
                    onChange={e => set('client_id', e.target.value)}
                    className={cn('w-full', errors.client_id && 'border-destructive')}
                  >
                    <NativeSelectOption value="">Choose Client...</NativeSelectOption>
                    {clients.map(c => (
                      <NativeSelectOption key={c.id} value={c.id}>
                        {c.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError message={errors.client_id} />
                </Field>
              )}
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Project Identity</h3>
                <p className="text-[11px] text-muted-foreground">Details that identify this project listing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field className="md:col-span-2">
                  <FieldLabel required>Project Title</FieldLabel>
                  <Input
                    value={values.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Modern Villa Jaipur"
                    className={cn(errors.title && 'border-destructive')}
                  />
                  <FieldError message={errors.title} />
                </Field>

                <Field>
                  <FieldLabel required>Project Type</FieldLabel>
                  <NativeSelect
                    value={values.type}
                    onChange={e => set('type', e.target.value)}
                    className={cn('w-full', errors.type && 'border-destructive')}
                  >
                    {PROJECT_TYPES.map(t => (
                      <NativeSelectOption key={t.value} value={t.value}>
                        {t.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError message={errors.type} />
                </Field>

                <Field>
                  <FieldLabel>Completion Year</FieldLabel>
                  <Input
                    value={values.year_completed}
                    onChange={e => set('year_completed', e.target.value)}
                    placeholder="e.g. 2024"
                    maxLength={4}
                    className={cn(errors.year_completed && 'border-destructive')}
                  />
                  <FieldError message={errors.year_completed} />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Location & Specs */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Location & Scale Specs</h3>
                <p className="text-[11px] text-muted-foreground">Physical details, locations, and size attributes.</p>
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
                    list="project-states-list"
                    placeholder="e.g. Rajasthan"
                  />
                  <datalist id="project-states-list">
                    {INDIAN_STATES.map(s => <option key={s} value={s} />)}
                  </datalist>
                </Field>

                <Field>
                  <FieldLabel>Area (Sq. Ft.)</FieldLabel>
                  <Input
                    value={values.area_sqft}
                    onChange={e => set('area_sqft', e.target.value)}
                    placeholder="e.g. 3200"
                    type="number"
                    step="any"
                    className={cn(errors.area_sqft && 'border-destructive')}
                  />
                  <FieldError message={errors.area_sqft} />
                </Field>

                <Field>
                  <FieldLabel>Total Floors</FieldLabel>
                  <Input
                    value={values.floors}
                    onChange={e => set('floors', e.target.value)}
                    placeholder="e.g. 2"
                    type="number"
                    className={cn(errors.floors && 'border-destructive')}
                  />
                  <FieldError message={errors.floors} />
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel>Configuration</FieldLabel>
                  <Input
                    value={values.configuration}
                    onChange={e => set('configuration', e.target.value)}
                    placeholder="e.g. 3BHK + Home Theater, Office Duplex"
                  />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Financial Details */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Financial Parameters</h3>
                <p className="text-[11px] text-muted-foreground">Internal budget details. Agreed fee can auto-calculate if Area and Rate are filled.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Rate (per Sq. Ft. in ₹)</FieldLabel>
                  <Input
                    value={values.rate_per_sqft}
                    onChange={e => set('rate_per_sqft', e.target.value)}
                    placeholder="e.g. 150"
                    type="number"
                    step="any"
                    className={cn(errors.rate_per_sqft && 'border-destructive')}
                  />
                  <FieldError message={errors.rate_per_sqft} />
                </Field>

                <Field>
                  <FieldLabel>Agreed Fee (₹)</FieldLabel>
                  <Input
                    value={values.agreed_fee}
                    onChange={e => set('agreed_fee', e.target.value)}
                    placeholder="e.g. 450000"
                    type="number"
                    step="any"
                    className={cn(errors.agreed_fee && 'border-destructive')}
                  />
                  <FieldError message={errors.agreed_fee} />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Project Dates */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Timeline</h3>
                <p className="text-[11px] text-muted-foreground">Historical project dates (optional record keeping).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Start Date</FieldLabel>
                  <Input
                    type="date"
                    value={values.start_date}
                    onChange={e => set('start_date', e.target.value)}
                    className="w-full text-sm"
                  />
                </Field>

                <Field>
                  <FieldLabel>Completion Date</FieldLabel>
                  <Input
                    type="date"
                    value={values.completion_date}
                    onChange={e => set('completion_date', e.target.value)}
                    className="w-full text-sm"
                  />
                </Field>
              </div>
            </div>

            <Separator />

            {/* Media Upload & URL */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Project Cover Image</h3>
                <p className="text-[11px] text-muted-foreground">Choose a local file to upload to Supabase, or paste a public image URL directly.</p>
              </div>

              {imagePreview ? (
                <div className="relative group/preview rounded-xl overflow-hidden border bg-muted/40 aspect-video flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    onClick={clearImage}
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 size-8 rounded-full shadow-lg opacity-90 hover:opacity-100"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* File Upload Zone */}
                  <div className="relative border-2 border-dashed border-border/80 hover:border-foreground/30 hover:bg-muted/10 transition-all rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-card">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Upload className="size-5" />
                    </div>
                    <span className="text-sm font-medium">Upload Project Image</span>
                    <span className="text-[10px] text-muted-foreground">Drag & drop or click to browse (PNG, JPG up to 10MB)</span>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground/60 gap-3">
                    <span className="h-px bg-border flex-1" />
                    <span>OR PASTE URL</span>
                    <span className="h-px bg-border flex-1" />
                  </div>

                  {/* URL Text Input */}
                  <Field>
                    <FieldLabel>Cover Image URL</FieldLabel>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                      <Input
                        value={values.cover_image_url}
                        onChange={e => {
                          set('cover_image_url', e.target.value)
                          setImagePreview(e.target.value.trim() || null)
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="pl-10"
                      />
                    </div>
                  </Field>
                </div>
              )}
            </div>

            <Separator />

            {/* Project Content / Details */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Narrative & Notes</h3>
                <p className="text-[11px] text-muted-foreground">Details about the architectural narrative, private notes, and optional client testimonial.</p>
              </div>

              <Field>
                <FieldLabel>Project Description / Design Approach</FieldLabel>
                <Textarea
                  value={values.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Explain design approach, layout planning, and materials used..."
                  rows={4}
                  className="resize-none rounded-xl"
                />
              </Field>

              <Field>
                <FieldLabel>Internal / Studio Notes (Private)</FieldLabel>
                <Textarea
                  value={values.internal_notes}
                  onChange={e => set('internal_notes', e.target.value)}
                  placeholder="Record-keeping notes, subcontractor details, referral info, etc. Never visible to clients."
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </Field>

              <Field>
                <FieldLabel>Client Testimonial</FieldLabel>
                <Textarea
                  value={values.client_testimonial}
                  onChange={e => set('client_testimonial', e.target.value)}
                  placeholder='"Working with the studio was an absolute dream. The attention to details..."'
                  rows={3}
                  className="resize-none rounded-xl font-serif text-sm italic"
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
            disabled={saving || clients.length === 0}
            onClick={handleSubmit}
            className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-5 font-semibold"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
