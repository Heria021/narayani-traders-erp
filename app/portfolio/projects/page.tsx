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
  MoreHorizontal, Building, Briefcase, Ruler, Layers,
  ExternalLink, IndianRupee, ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from './_components/useProjects'
import { ProjectForm } from './_components/ProjectForm'
import { PROJECT_TYPES } from './_components/types'
import type { ProjectFormValues, ProjectWithRelations } from './_components/types'

// Format INR currency values nicely (e.g. ₹4,50,000)
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

// Architectural Blueprint Placeholder for projects without images
const BlueprintPlaceholder = () => (
  <div className="w-full h-full bg-neutral-900 dark:bg-neutral-950 relative overflow-hidden flex items-center justify-center border-b border-border/40">
    {/* Grid lines to resemble blueprint */}
    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] [background-size:40px_40px] opacity-50" />
    
    {/* Minimalist blueprint circles */}
    <div className="absolute size-48 rounded-full border border-white/5 -top-10 -left-10" />
    <div className="absolute size-32 rounded-full border border-white/5 -bottom-5 -right-5" />
    <div className="absolute size-64 rounded-full border border-dashed border-white/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

    {/* Center architectural icon */}
    <div className="flex flex-col items-center gap-1.5 text-neutral-500 relative z-10">
      <svg className="size-8 stroke-[1.2] text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20 20v-8H4v8m16-8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6" />
        <path d="M12 4v16M4 12h16" />
      </svg>
      <span className="text-[9px] uppercase tracking-widest font-bold font-mono">No Media Attached</span>
    </div>
  </div>
)

export default function PortfolioProjectsPage() {
  const router = useRouter()
  const {
    projects, clients, search, typeFilter, yearFilter, loading, selectedProject, setSelectedId,
    handleSearchChange, handleTypeFilterChange, handleYearFilterChange, addProject, updateProject,
    deleteProject, getAvailableYears
  } = useProjects()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() {
    setEditMode(false)
    setFormOpen(true)
  }

  function openEdit(projectId: string) {
    setSelectedId(projectId)
    setEditMode(true)
    setFormOpen(true)
  }

  async function handleSubmit(values: ProjectFormValues, imageFile: File | null) {
    if (editMode && selectedProject) {
      return updateProject(selectedProject.id, values, imageFile, selectedProject.media)
    }
    return addProject(values, imageFile)
  }

  const availableYears = getAvailableYears()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6 bg-background">
      
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Building className="size-6 text-muted-foreground" />
            Projects Manager
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Manage records of completed projects, physical configurations, client listings, and cover photos.
          </p>
        </div>
        <Button onClick={openAdd} size="default" className="px-4 shrink-0 font-medium rounded-lg">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          Create Project
        </Button>
      </div>

      {/* Toolbar - Search & Filters */}
      <div className="flex shrink-0 flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b pb-4">
        
        {/* Search */}
        <div className="relative min-w-0 w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by title, location, client..."
            className={cn(
              'w-full h-9 rounded-lg border border-input bg-transparent pl-10 pr-3 text-sm',
              'placeholder:text-muted-foreground/50',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring',
              'transition-colors',
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Project Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Type:</span>
            <NativeSelect
              value={typeFilter}
              onChange={e => handleTypeFilterChange(e.target.value)}
              className="h-9 text-xs"
            >
              <NativeSelectOption value="all">All Types</NativeSelectOption>
              {PROJECT_TYPES.map(t => (
                <NativeSelectOption key={t.value} value={t.value}>
                  {t.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* Completion Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Year:</span>
            <NativeSelect
              value={yearFilter}
              onChange={e => handleYearFilterChange(e.target.value)}
              className="h-9 text-xs"
            >
              <NativeSelectOption value="all">All Years</NativeSelectOption>
              {availableYears.map(yr => (
                <NativeSelectOption key={yr} value={yr.toString()}>
                  {yr}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

        </div>

      </div>

      {/* Projects Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-card space-y-4">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-card">
            <Building className="size-12 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold text-lg">No projects found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {search || typeFilter !== 'all' || yearFilter !== 'all'
                ? 'No projects match your current filters or search terms.'
                : 'Log your completed project records to see them displayed here.'}
            </p>
            {(search || typeFilter !== 'all' || yearFilter !== 'all') ? (
              <Button
                variant="outline"
                className="mt-4 rounded-lg text-xs"
                onClick={() => {
                  handleSearchChange('')
                  handleTypeFilterChange('all')
                  handleYearFilterChange('all')
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={openAdd} variant="outline" className="mt-4 rounded-lg">
                <Plus className="size-4 mr-1.5" /> Add Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => {
              const coverMedia = p.media?.find(m => m.caption === 'Cover Image' || m.sort_order === 0)
              const location = [p.city, p.state].filter(Boolean).join(', ')

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/portfolio/projects/${p.id}`)}
                  className={cn(
                    "group relative border border-border/80 rounded-xl overflow-hidden bg-card flex flex-col justify-between cursor-pointer",
                    "hover:shadow-md hover:border-foreground/20 transition-all duration-300"
                  )}
                >
                  <div>
                    {/* Cover Media Section */}
                    <div className="aspect-video w-full relative bg-muted overflow-hidden border-b border-border/50 shrink-0">
                      {coverMedia ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={coverMedia.file_url}
                          alt={p.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <BlueprintPlaceholder />
                      )}
                      
                      {/* Gradient Overlay for Actions Dropdown and Badge */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Hover Overlay Visual Details */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/95 dark:bg-neutral-900/95 shadow-md p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 scale-90 group-hover:scale-100 transition-all duration-300">
                          <span>View Records</span>
                          <ArrowUpRight className="size-3.5" />
                        </div>
                      </div>

                      {/* Dropdown Menu (Stop Propagation to prevent navigation) */}
                      <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="outline" size="icon-sm" className="size-8 rounded-lg bg-black/35 hover:bg-black/60 dark:bg-black/40 dark:hover:bg-black/70 border-none text-white shadow-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => router.push(`/portfolio/projects/${p.id}`)}>
                              <Briefcase className="size-4 mr-2" /> View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(p.id)}>
                              <Pencil className="size-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => deleteProject(p)}>
                              <Trash2 className="size-4 mr-2" /> Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Floating Project Type Badge */}
                      <Badge className="absolute bottom-3 left-3 bg-neutral-900/90 text-white hover:bg-neutral-900 border-none text-[10px] font-medium tracking-wide py-0.5 rounded-md backdrop-blur-xs">
                        {getProjectTypeName(p.type)}
                      </Badge>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      
                      {/* Client name / Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-300 truncate max-w-[150px]">
                          {p.client?.name || 'Unknown Client'}
                        </span>
                        {p.year_completed && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {p.year_completed}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1 mb-2">
                        {p.title}
                      </h3>

                      {/* Location */}
                      {location && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-4">
                          <MapPin className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      )}

                      {/* Stats / Specifications */}
                      <div className="grid grid-cols-3 gap-2 bg-muted/30 dark:bg-muted/10 p-2.5 rounded-lg border border-border/40 text-[11px] text-muted-foreground font-medium">
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider scale-90 mb-0.5 flex items-center gap-0.5">
                            <Ruler className="size-3" /> Area
                          </span>
                          <span className="font-semibold text-foreground truncate max-w-full">
                            {p.area_sqft ? `${Math.round(p.area_sqft)} sqft` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center border-x border-border/50">
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider scale-90 mb-0.5 flex items-center gap-0.5">
                            <Layers className="size-3" /> Floors
                          </span>
                          <span className="font-semibold text-foreground">
                            {p.floors !== null ? `${p.floors} F` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider scale-90 mb-0.5">
                            Scope
                          </span>
                          <span className="font-semibold text-foreground truncate max-w-full" title={p.configuration || ''}>
                            {p.configuration || '—'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Card Footer - Financial summary */}
                  <div className="px-5 py-3.5 bg-muted/10 dark:bg-muted/5 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1 scale-95 origin-left">
                      <IndianRupee className="size-3 text-muted-foreground/75" />
                      Agreed Fee
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatINR(p.agreed_fee)}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Project Slide-out Sheet */}
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
