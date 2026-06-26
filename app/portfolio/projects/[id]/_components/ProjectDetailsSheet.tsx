'use client'

import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Layers, Ruler, Calendar,
  Users, MapPin, Pencil, Check, X,
  Info, Sparkles, Home, Landmark
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROJECT_TYPES } from '../../_components/types'
import { INDIAN_STATES } from '../../../clients/_components/types'
import type { ProjectWithRelations } from '../../_components/types'

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  project: ProjectWithRelations
  clients: { id: string; name: string }[]
  onSave: (values: any) => Promise<boolean>
}

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find((t: any) => t.value === typeVal)
  return item ? item.label : typeVal
}

// ─────────────────────────────────────────────────────────────────────────────

export function ProjectDetailsSheet({
  open, onClose, project, clients, onSave
}: Props) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state (only Specs & Client Association)
  const [values, setValues] = useState({
    client_id: '',
    title: '',
    type: '',
    city: '',
    state: '',
    area_sqft: '',
    floors: '',
    configuration: '',
    year_completed: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize values
  useEffect(() => {
    if (!open) return
    setValues({
      client_id: project.client_id,
      title: project.title,
      type: project.type,
      city: project.city ?? '',
      state: project.state ?? '',
      area_sqft: project.area_sqft ? project.area_sqft.toString() : '',
      floors: project.floors ? project.floors.toString() : '',
      configuration: project.configuration ?? '',
      year_completed: project.year_completed ? project.year_completed.toString() : ''
    })
    setIsEditMode(false)
    setErrors({})
    setSaving(false)
  }, [open, project])

  function set(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!values.client_id) errs.client_id = 'Client is required'
    if (!values.title.trim()) errs.title = 'Title is required'
    if (!values.type) errs.type = 'Type is required'
    
    if (values.area_sqft && isNaN(parseFloat(values.area_sqft))) {
      errs.area_sqft = 'Must be a valid number'
    }
    if (values.floors && (isNaN(parseInt(values.floors)) || parseInt(values.floors) < 0)) {
      errs.floors = 'Must be a valid positive integer'
    }
    if (values.year_completed) {
      const year = parseInt(values.year_completed)
      if (isNaN(year) || year < 1900 || year > 2100) {
        errs.year_completed = 'Must be valid year (1900-2100)'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    
    // Retain existing billing/notes fields from the current project when saving
    const updatePayload = {
      ...project,
      client_id: values.client_id,
      title: values.title,
      type: values.type,
      city: values.city,
      state: values.state,
      area_sqft: values.area_sqft,
      floors: values.floors,
      configuration: values.configuration,
      year_completed: values.year_completed
    }

    const ok = await onSave(updatePayload)
    if (ok) {
      setIsEditMode(false)
    }
    setSaving(false)
  }

  const clientName = clients.find(c => c.id === project.client_id)?.name || project.client?.name || '—'
  const locationText = [project.city, project.state].filter(Boolean).join(', ') || '—'

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[600px] lg:max-w-[600px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-background relative overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                <Info className="size-4 text-indigo-500" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold leading-tight">
                  {isEditMode ? 'Edit Project Specs' : 'Project details & Specs'}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {isEditMode ? 'Update specifications and details' : 'Configure layout scale, client association, and tags'}
                </SheetDescription>
              </div>
            </div>

            <Button
              variant={isEditMode ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => {
                if (isEditMode) {
                  setIsEditMode(false)
                  setErrors({})
                } else {
                  setIsEditMode(true)
                }
              }}
              className="h-8 gap-1.5 text-xs font-semibold shrink-0"
              disabled={saving}
            >
              {isEditMode ? (
                <>
                  <X className="size-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Pencil className="size-3.5" /> Edit Specs
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        {isEditMode ? (
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
              
              {/* Specs and Physical Attributes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Specs & Physical Attributes</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Project Title</label>
                    <Input
                      value={values.title}
                      onChange={e => set('title', e.target.value)}
                      placeholder="e.g. Modern Villa"
                      className={cn(errors.title && 'border-destructive')}
                    />
                    {errors.title && <span className="text-[10px] text-destructive">{errors.title}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Project Type</label>
                      <NativeSelect
                        value={values.type}
                        onChange={e => set('type', e.target.value)}
                        className={cn(errors.type && 'border-destructive')}
                      >
                        <NativeSelectOption value="">Select Type...</NativeSelectOption>
                        {PROJECT_TYPES.map((t: any) => (
                          <NativeSelectOption key={t.value} value={t.value}>{t.label}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                      {errors.type && <span className="text-[10px] text-destructive">{errors.type}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Configuration (BHK)</label>
                      <Input
                        value={values.configuration}
                        onChange={e => set('configuration', e.target.value)}
                        placeholder="e.g. 4BHK + Terrace"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Area (sqft)</label>
                      <Input
                        value={values.area_sqft}
                        onChange={e => set('area_sqft', e.target.value)}
                        placeholder="e.g. 2400"
                        className={cn(errors.area_sqft && 'border-destructive')}
                      />
                      {errors.area_sqft && <span className="text-[10px] text-destructive">{errors.area_sqft}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Floors</label>
                      <Input
                        value={values.floors}
                        onChange={e => set('floors', e.target.value)}
                        placeholder="e.g. 2"
                        className={cn(errors.floors && 'border-destructive')}
                      />
                      {errors.floors && <span className="text-[10px] text-destructive">{errors.floors}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Association */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Users className="size-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Client Association</h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Client Profile</label>
                    <NativeSelect
                      value={values.client_id}
                      onChange={e => set('client_id', e.target.value)}
                      className={cn(errors.client_id && 'border-destructive')}
                    >
                      <NativeSelectOption value="">Choose Client...</NativeSelectOption>
                      {clients.map(c => (
                        <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {errors.client_id && <span className="text-[10px] text-destructive">{errors.client_id}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">City</label>
                      <Input
                        value={values.city}
                        onChange={e => set('city', e.target.value)}
                        placeholder="e.g. Jaipur"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/80">State</label>
                      <NativeSelect
                        value={values.state}
                        onChange={e => set('state', e.target.value)}
                      >
                        <NativeSelectOption value="">Select State...</NativeSelectOption>
                        {INDIAN_STATES.map((s: any) => (
                          <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Year Completed</label>
                    <Input
                      value={values.year_completed}
                      onChange={e => set('year_completed', e.target.value)}
                      placeholder="e.g. 2026"
                      className={cn(errors.year_completed && 'border-destructive')}
                    />
                    {errors.year_completed && <span className="text-[10px] text-destructive">{errors.year_completed}</span>}
                  </div>
                </div>
              </div>

            </div>

            {/* Save Footer */}
            <div className="px-8 py-4 border-t bg-muted/10 shrink-0 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditMode(false)
                  setErrors({})
                }}
                className="h-8 text-xs"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-md px-4"
              >
                {saving ? 'Saving changes…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            
            {/* Specs Row Blocks (Shadcn style - environment variable cards style) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Building2 className="size-4 text-muted-foreground/60" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Specs & Physical Attributes</h4>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Project Title", value: project.title, icon: Sparkles },
                  { label: "Project Type", value: getProjectTypeName(project.type), icon: Home },
                  { label: "Configuration", value: project.configuration || '—', icon: Layers },
                  { label: "Build Area", value: project.area_sqft ? `${Math.round(project.area_sqft).toLocaleString('en-IN')} sqft` : '—', icon: Ruler },
                  { label: "Total Floors", value: project.floors != null ? `${project.floors} floors` : '—', icon: Landmark }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs"
                  >
                    <div className="flex size-6 items-center justify-center rounded-lg bg-foreground/5 shrink-0">
                      <item.icon className="size-3 text-muted-foreground/60" />
                    </div>
                    <span className="font-semibold text-muted-foreground">{item.label}</span>
                    <span className="ml-auto font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Association Row Blocks */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Users className="size-4 text-muted-foreground/60" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Client Association</h4>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  { label: "Assigned Client", value: clientName, icon: Users },
                  { label: "Client ID", value: project.client_id, icon: Info, mono: true },
                  { label: "Project Location", value: locationText, icon: MapPin },
                  { label: "Year Completed", value: project.year_completed || '—', icon: Calendar }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs"
                  >
                    <div className="flex size-6 items-center justify-center rounded-lg bg-foreground/5 shrink-0">
                      <item.icon className="size-3 text-muted-foreground/60" />
                    </div>
                    <span className="font-semibold text-muted-foreground">{item.label}</span>
                    <span className={cn(
                      "ml-auto font-bold text-foreground",
                      item.mono && "font-mono text-[10px] break-all max-w-[200px]"
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
