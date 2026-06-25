'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Phone, Mail, MapPin, FileText, FolderOpen, ArrowUpRight,
  User, Calendar, Building2, Pencil, Layers, IndianRupee
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { ClientWithStats } from './types'
import { PROJECT_TYPES } from '../../projects/_components/types'

// ─────────────────────────────────────────────────────────────────────────────

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

function formatINR(num: number | null) {
  if (!num) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(num)
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────

interface LinkedProject {
  id: string
  title: string
  type: string
  city: string | null
  state: string | null
  year_completed: number | null
  agreed_fee: number | null
}

interface Props {
  client: ClientWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
}

// ─────────────────────────────────────────────────────────────────────────────

export function ClientDetailSheet({ client, open, onOpenChange, onEdit }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState<LinkedProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  useEffect(() => {
    if (!open || !client) { setProjects([]); return }
    setProjectsLoading(true)
    supabase
      .from('arch_projects')
      .select('id, title, type, city, state, year_completed, agreed_fee')
      .eq('client_id', client.id)
      .order('year_completed', { ascending: false })
      .then(({ data }) => {
        setProjects((data || []).map((p: any) => ({
          ...p,
          agreed_fee: p.agreed_fee ? Number(p.agreed_fee) : null,
        })))
        setProjectsLoading(false)
      })
  }, [open, client?.id])

  if (!client) return null

  const location = [client.city, client.state].filter(Boolean).join(', ')
  const initials = getInitials(client.name)
  const totalPortfolio = projects.reduce((s, p) => s + (p.agreed_fee ?? 0), 0)

  // Type pill colors
  const typeColors: Record<string, string> = {
    residential:        'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    commercial:         'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    interior:           'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    visualization_only: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
    renovation:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    other:              'bg-muted text-muted-foreground',
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground/8 border border-border text-base font-bold text-foreground">
                {initials}
              </div>
              <div>
                <SheetTitle className="text-lg font-bold leading-tight">{client.name}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  {client.project_count} project{client.project_count !== 1 ? 's' : ''} recorded
                  {location && ` · ${location}`}
                </SheetDescription>
              </div>
            </div>
            {/* Edit button */}
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">

            {/* ── Contact & Info card ── */}
            <div className="rounded-xl border bg-card p-5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-4 flex items-center gap-1.5">
                <User className="size-3" /> Contact Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Phone</p>
                    <a href={`tel:${client.phone}`} className="font-semibold text-foreground hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Email</p>
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="font-semibold text-foreground hover:underline truncate block max-w-[180px]">
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/40 font-medium">Not provided</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">Location</p>
                    <span className="font-semibold text-foreground">
                      {location || <span className="text-muted-foreground/40 font-medium">Not specified</span>}
                    </span>
                  </div>
                </div>

                {/* GSTIN */}
                <div className="flex items-start gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                    <FileText className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-0.5">GSTIN</p>
                    {client.gstin ? (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{client.gstin}</span>
                    ) : (
                      <span className="text-muted-foreground/40 font-medium text-sm">Not registered</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {client.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-2">Internal Notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-3 border border-border/40">
                      {client.notes}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ── Portfolio stats strip ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Projects</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{client.project_count}</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {projects.filter(p => p.year_completed).length}
                </p>
              </div>
              <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20 p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-indigo-500/70 mb-1">Portfolio Value</p>
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {formatINR(totalPortfolio)}
                </p>
              </div>
            </div>

            {/* ── Projects list ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 flex items-center gap-1.5">
                  <FolderOpen className="size-3" /> Linked Projects
                </p>
                {projects.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0.5">
                    {projects.length}
                  </Badge>
                )}
              </div>

              {projectsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                      <Skeleton className="size-9 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-xl text-center bg-muted/10">
                  <FolderOpen className="size-8 text-muted-foreground/25 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Projects linked to this client will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => {
                    const loc = [p.city, p.state].filter(Boolean).join(', ')
                    return (
                      <button
                        key={p.id}
                        onClick={() => { onOpenChange(false); router.push(`/portfolio/projects/${p.id}`) }}
                        className={cn(
                          'w-full text-left rounded-xl border bg-card p-4',
                          'flex items-center gap-3',
                          'hover:border-foreground/20 hover:shadow-sm hover:bg-muted/20',
                          'transition-all duration-200 group',
                        )}
                      >
                        {/* Icon */}
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize',
                              typeColors[p.type] ?? 'bg-muted text-muted-foreground'
                            )}>
                              {getProjectTypeName(p.type)}
                            </span>
                            {loc && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="size-2.5" />{loc}
                              </span>
                            )}
                            {p.year_completed && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="size-2.5" />{p.year_completed}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fee + arrow */}
                        <div className="shrink-0 flex items-center gap-2">
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Fee</p>
                            <p className="text-xs font-bold text-foreground tabular-nums">{formatINR(p.agreed_fee)}</p>
                          </div>
                          <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
