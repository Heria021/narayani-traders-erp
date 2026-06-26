'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin, Calendar, Users, Building2, Layers, Ruler,
  IndianRupee, Image as ImageIcon, Globe, FileText, Quote,
  Pencil, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectWithRelations } from '../../_components/types'
import { PROJECT_TYPES } from '../../_components/types'
import type { PublicListing } from './types'

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

function formatINR(num: number | null) {
  if (num === null || isNaN(num)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const typeColors: Record<string, string> = {
  residential: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  commercial: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  interior: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  visualization_only: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  renovation: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  other: 'bg-muted text-muted-foreground',
}

interface Props {
  project: ProjectWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mediaCount: number
  publicListing: PublicListing | null
  baseFee: number
  approvedExtras: number
  finalTotalFee: number
  onEdit: () => void
  onOpenInvoice: () => void
  onOpenShowcase: () => void
}

export function ProjectDetailSheet({
  project, open, onOpenChange,
  mediaCount, publicListing,
  baseFee, approvedExtras, finalTotalFee,
  onEdit, onOpenInvoice, onOpenShowcase,
}: Props) {
  if (!project) return null

  const location = [project.city, project.state].filter(Boolean).join(', ')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Badge
                  variant="secondary"
                  className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border-none', typeColors[project.type])}
                >
                  {getProjectTypeName(project.type)}
                </Badge>
                {publicListing && (
                  <Badge className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none">
                    Live on site
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-lg font-bold leading-tight">{project.title}</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {location || 'Location not set'}
                {project.year_completed ? ` · Completed ${project.year_completed}` : ' · Ongoing'}
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onOpenChange(false); onEdit() }}
              className="h-8 px-3 text-xs gap-1.5 shrink-0"
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className="px-8 py-6 space-y-6">

            {/* Client */}
            <div className="rounded-xl border bg-card p-5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-4 flex items-center gap-1.5">
                <Users className="size-3" /> Client
              </p>
              {project.client ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{project.client.name}</p>
                    <p className="text-[11px] text-muted-foreground">Assigned client</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 font-medium">No client assigned</p>
              )}
            </div>

            {/* Overview */}
            {(project.description || project.internal_notes || project.client_testimonial) && (
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 flex items-center gap-1.5">
                  <FileText className="size-3" /> Overview
                </p>
                {project.description && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5">Description</p>
                    <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
                  </div>
                )}
                {project.internal_notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5">Internal notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-3 border border-border/40">
                      {project.internal_notes}
                    </p>
                  </div>
                )}
                {project.client_testimonial && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5 flex items-center gap-1">
                      <Quote className="size-3" /> Client testimonial
                    </p>
                    <p className="text-sm italic text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                      {project.client_testimonial}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SpecCell icon={MapPin} label="Location" value={location || '—'} />
              <SpecCell icon={Ruler} label="Area" value={project.area_sqft ? `${Math.round(project.area_sqft).toLocaleString('en-IN')} ft²` : '—'} />
              <SpecCell icon={Layers} label="Floors" value={project.floors != null ? String(project.floors) : '—'} />
              <SpecCell icon={Building2} label="Configuration" value={project.configuration || '—'} />
              <SpecCell icon={IndianRupee} label="Rate / ft²" value={formatINR(project.rate_per_sqft)} />
              <SpecCell icon={ImageIcon} label="Media" value={`${mediaCount} photo${mediaCount !== 1 ? 's' : ''}`} />
            </div>

            {/* Timeline */}
            <div className="rounded-xl border bg-card p-5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-4 flex items-center gap-1.5">
                <Calendar className="size-3" /> Timeline
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Start date</p>
                  <p className="font-semibold">{formatDate(project.start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Completion date</p>
                  <p className="font-semibold">{formatDate(project.completion_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Year completed</p>
                  <p className="font-semibold">{project.year_completed ?? 'Ongoing'}</p>
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 flex items-center gap-1.5">
                  <DollarSign className="size-3" /> Financial summary
                </p>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { onOpenChange(false); onOpenInvoice() }}>
                  Full invoice
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Base fee</p>
                  <p className="text-sm font-bold tabular-nums">{formatINR(baseFee)}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Extras</p>
                  <p className={cn('text-sm font-bold tabular-nums', approvedExtras >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600')}>
                    {approvedExtras === 0 ? '—' : formatINR(approvedExtras)}
                  </p>
                </div>
                <div className="rounded-lg border bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-indigo-500/70 mb-1">Total</p>
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">{formatINR(finalTotalFee)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agreed fee (contract)</span>
                <span className="font-semibold tabular-nums">{formatINR(project.agreed_fee)}</span>
              </div>
            </div>

            {/* Showcase */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 flex items-center gap-1.5 mb-1">
                    <Globe className="size-3" /> Public showcase
                  </p>
                  <p className="text-sm font-semibold">
                    {publicListing ? publicListing.public_title || project.title : 'Not published'}
                  </p>
                  {publicListing?.public_description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{publicListing.public_description}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => { onOpenChange(false); onOpenShowcase() }}>
                  Configure
                </Button>
              </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SpecCell({
  icon: Icon, label, value,
}: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">{label}</p>
      </div>
      <p className="text-sm font-semibold leading-tight truncate">{value}</p>
    </div>
  )
}
