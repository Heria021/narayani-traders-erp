'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Plus, Search, MapPin, Trash2, Pencil, Calendar,
  MoreHorizontal, Building2, Briefcase, Ruler, Layers,
  ArrowUpRight, IndianRupee, FolderOpen, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from './_components/useProjects'
import { ProjectForm } from './_components/ProjectForm'
import { PROJECT_TYPES } from './_components/types'
import type { ProjectFormValues, ProjectWithRelations } from './_components/types'

// ─────────────────────────────────────────────────────────────────────────────

function formatINR(num: number | null) {
  if (num === null || isNaN(num)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num)
}

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

// ── Blueprint placeholder ─────────────────────────────────────────────────────

const BlueprintPlaceholder = () => (
  <div className="w-full h-full bg-neutral-900 dark:bg-neutral-950 relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:18px_18px]" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] [background-size:54px_54px]" />
    <div className="absolute size-56 rounded-full border border-white/[0.04] -top-12 -left-12" />
    <div className="absolute size-36 rounded-full border border-white/[0.04] -bottom-8 -right-8" />
    <div className="flex flex-col items-center gap-2 text-neutral-600 relative z-10">
      <svg className="size-9 stroke-[1] text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20 20v-8H4v8m16-8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6" />
        <path d="M12 4v16M4 12h16" />
      </svg>
      <span className="text-[9px] uppercase tracking-[0.2em] font-bold font-mono text-neutral-700">No Media</span>
    </div>
  </div>
)

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({
  p, onNavigate, onEdit, onDelete
}: {
  p: ProjectWithRelations
  onNavigate: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const coverMedia = p.media?.find(m => m.sort_order === 0) ?? p.media?.[0]
  const location = [p.city, p.state].filter(Boolean).join(', ')

  // Type badge color
  const typeColors: Record<string, string> = {
    residential:        'bg-blue-500/90',
    commercial:         'bg-violet-500/90',
    interior:           'bg-amber-500/90',
    visualization_only: 'bg-cyan-500/90',
    renovation:         'bg-emerald-500/90',
    other:              'bg-neutral-600/90',
  }
  const typeColor = typeColors[p.type] ?? 'bg-neutral-600/90'

  return (
    <div
      onClick={onNavigate}
      className={cn(
        'group relative flex flex-col rounded-2xl overflow-hidden bg-card cursor-pointer',
        'border border-border/60',
        'shadow-xs hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30',
        'hover:border-border transition-all duration-300 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* ── Image zone ── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted shrink-0">
        {coverMedia ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverMedia.file_url}
            alt={p.title}
            className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <BlueprintPlaceholder />
        )}

        {/* Rich gradient overlay — fades image into card body */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Top-right: 3-dot menu */}
        <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8 rounded-lg bg-black/40 hover:bg-black/65 backdrop-blur-sm border-white/10 text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onNavigate}>
                <Briefcase className="size-4 mr-2" /> View Full Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit() }}>
                <Pencil className="size-4 mr-2" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
                <Trash2 className="size-4 mr-2" /> Delete Record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom-left: type badge */}
        <span className={cn(
          'absolute bottom-3 left-3 z-10 text-[10px] text-white font-semibold tracking-wider uppercase px-2 py-1 rounded-md backdrop-blur-sm',
          typeColor
        )}>
          {getProjectTypeName(p.type)}
        </span>

        {/* Bottom-right: year */}
        {p.year_completed && (
          <span className="absolute bottom-3 right-3 z-10 text-[10px] text-white/80 font-mono font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
            {p.year_completed}
          </span>
        )}

        {/* Hover CTA pill */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className={cn(
            'flex items-center gap-1.5 bg-white/95 dark:bg-neutral-900/95 text-foreground px-3.5 py-2 rounded-full text-xs font-semibold shadow-lg',
            'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100',
            'transition-all duration-300 ease-out',
          )}>
            View Records <ArrowUpRight className="size-3.5" />
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Client + title */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest truncate">
            {p.client?.name || 'Unknown Client'}
          </p>
          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-1 group-hover:text-foreground transition-colors">
            {p.title}
          </h3>
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-0 rounded-lg border border-border/60 overflow-hidden text-xs divide-x divide-border/60 bg-muted/20">
          <div className="flex flex-col items-center justify-center px-3 py-2 flex-1 text-center">
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-0.5">
              <Ruler className="size-2.5" /> Area
            </span>
            <span className="font-semibold text-foreground text-[12px]">
              {p.area_sqft ? `${Math.round(p.area_sqft).toLocaleString('en-IN')} ft²` : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 flex-1 text-center">
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-0.5">
              <Layers className="size-2.5" /> Floors
            </span>
            <span className="font-semibold text-foreground text-[12px]">
              {p.floors != null ? p.floors : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 flex-1 text-center">
            <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider font-semibold mb-0.5">
              Config
            </span>
            <span className="font-semibold text-foreground text-[12px] truncate max-w-full" title={p.configuration || ''}>
              {p.configuration || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Card footer: fee ── */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between bg-muted/10">
        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
          <IndianRupee className="size-3 text-muted-foreground/60" />
          Agreed Fee
        </span>
        <span className={cn(
          'text-sm font-bold tabular-nums',
          p.agreed_fee ? 'text-foreground' : 'text-muted-foreground/40'
        )}>
          {formatINR(p.agreed_fee)}
        </span>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
      <div className="px-4 py-3 border-t border-border/50 flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortfolioProjectsPage() {
  const router = useRouter()
  const {
    projects, clients, search, typeFilter, yearFilter, loading, selectedProject, setSelectedId,
    handleSearchChange, handleTypeFilterChange, handleYearFilterChange, addProject, updateProject,
    deleteProject, getAvailableYears
  } = useProjects()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() { setEditMode(false); setFormOpen(true) }
  function openEdit(projectId: string) {
    setSelectedId(projectId); setEditMode(true); setFormOpen(true)
  }

  async function handleSubmit(values: ProjectFormValues, imageFile: File | null) {
    if (editMode && selectedProject) {
      return updateProject(selectedProject.id, values, imageFile, selectedProject.media)
    }
    return addProject(values, imageFile)
  }

  const availableYears = getAvailableYears()

  // ── KPI stats ──
  const totalValue = projects.reduce((sum, p) => sum + (p.agreed_fee ?? 0), 0)
  const uniqueClients = new Set(projects.map(p => p.client_id).filter(Boolean)).size
  const completedCount = projects.filter(p => p.year_completed).length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">

      {/* ══ PAGE HEADER ═══════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-b border-border/60 bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative px-8 pt-7 pb-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/5 border border-border/60">
                  <Building2 className="size-4.5 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Projects
                </h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg pl-0.5">
                Manage completed project records, client listings, media pools, and portfolio visibility.
              </p>
            </div>
            <Button onClick={openAdd} className="h-9 px-4 font-semibold rounded-lg shrink-0 gap-1.5">
              <Plus className="size-4 stroke-[2.5]" />
              New Project
            </Button>
          </div>

          {/* KPI strip */}
          <div className="flex items-stretch divide-x divide-border/60 border-t border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <FolderOpen className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Total Projects</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : projects.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Completed</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : completedCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Clients</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : uniqueClients}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <IndianRupee className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Portfolio Value</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : formatINR(totalValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TOOLBAR ═══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-8 py-4 border-b border-border/50 bg-background">
        {/* Search */}
        <div className="relative min-w-0 w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by title, location, client…"
            className={cn(
              'w-full h-9 rounded-lg border border-input bg-muted/20 pl-9 pr-3 text-sm',
              'placeholder:text-muted-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
              'transition-colors',
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground/60 font-medium">Filter:</span>
          <NativeSelect
            value={typeFilter}
            onChange={e => handleTypeFilterChange(e.target.value)}
            className="h-9 text-xs pr-8"
          >
            <NativeSelectOption value="all">All Types</NativeSelectOption>
            {PROJECT_TYPES.map(t => (
              <NativeSelectOption key={t.value} value={t.value}>{t.label}</NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            value={yearFilter}
            onChange={e => handleYearFilterChange(e.target.value)}
            className="h-9 text-xs pr-8"
          >
            <NativeSelectOption value="all">All Years</NativeSelectOption>
            {availableYears.map(yr => (
              <NativeSelectOption key={yr} value={yr.toString()}>{yr}</NativeSelectOption>
            ))}
          </NativeSelect>

          {(search || typeFilter !== 'all' || yearFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { handleSearchChange(''); handleTypeFilterChange('all'); handleYearFilterChange('all') }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ══ PROJECTS GRID ═════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed rounded-2xl bg-card">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Building2 className="size-8 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-base">No projects found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
              {search || typeFilter !== 'all' || yearFilter !== 'all'
                ? 'No projects match your current filters.'
                : 'Create your first project record to get started.'}
            </p>
            <div className="mt-5">
              {(search || typeFilter !== 'all' || yearFilter !== 'all') ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => { handleSearchChange(''); handleTypeFilterChange('all'); handleYearFilterChange('all') }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={openAdd} size="sm" className="rounded-lg gap-1.5">
                  <Plus className="size-3.5" /> New Project
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Result count */}
            <p className="text-xs text-muted-foreground mb-4">
              Showing <span className="font-semibold text-foreground">{projects.length}</span> project{projects.length !== 1 ? 's' : ''}
              {(search || typeFilter !== 'all' || yearFilter !== 'all') && ' matching filters'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  onNavigate={() => router.push(`/portfolio/projects/${p.id}`)}
                  onEdit={() => openEdit(p.id)}
                  onDelete={() => deleteProject(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Project Form Sheet ── */}
      <ProjectForm
        open={formOpen}
        project={editMode ? selectedProject : null}
        clients={clients}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
