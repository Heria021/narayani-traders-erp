'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Phone, Mail, MapPin, Users,
  MoreHorizontal, Pencil, Trash2, Briefcase,
  FileText, FolderOpen, IndianRupee
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClients } from './_components/useClients'
import { ClientForm } from './_components/ClientForm'
import { ClientDetailSheet } from './_components/ClientDetailSheet'
import type { ClientFormValues, ClientWithStats } from './_components/types'

// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Avatar colour palette (deterministic from name)
const AVATAR_COLORS = [
  {
    gradient: 'from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/15 dark:shadow-none',
    dot: 'bg-blue-500',
    light: 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  {
    gradient: 'from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/15 dark:shadow-none',
    dot: 'bg-violet-500',
    light: 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-100 dark:border-violet-500/10 text-violet-600 dark:text-violet-400'
  },
  {
    gradient: 'from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/15 dark:shadow-none',
    dot: 'bg-amber-500',
    light: 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10 text-amber-600 dark:text-amber-400'
  },
  {
    gradient: 'from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/15 dark:shadow-none',
    dot: 'bg-emerald-500',
    light: 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  {
    gradient: 'from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/15 dark:shadow-none',
    dot: 'bg-rose-500',
    light: 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400'
  },
  {
    gradient: 'from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/15 dark:shadow-none',
    dot: 'bg-cyan-500',
    light: 'bg-cyan-50/50 dark:bg-cyan-500/5 border-cyan-100 dark:border-cyan-500/10 text-cyan-600 dark:text-cyan-400'
  },
  {
    gradient: 'from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/15 dark:shadow-none',
    dot: 'bg-orange-500',
    light: 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/10 text-orange-600 dark:text-orange-400'
  },
  {
    gradient: 'from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/15 dark:shadow-none',
    dot: 'bg-teal-500',
    light: 'bg-teal-50/50 dark:bg-teal-500/5 border-teal-100 dark:border-teal-500/10 text-teal-600 dark:text-teal-400'
  },
]

function getClientTheme(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({
  c, onClick, onEdit, onDelete
}: {
  c: ClientWithStats
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = getInitials(c.name)
  const theme = getClientTheme(c.name)
  const location = [c.city, c.state].filter(Boolean).join(', ')

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border/60 bg-card cursor-pointer',
        'hover:bg-muted/[0.02]',
        'shadow-xs hover:shadow-lg hover:shadow-indigo-500/[0.03]',
        'hover:border-indigo-500/25 dark:hover:border-indigo-400/15 hover:-translate-y-0.5',
        'transition-all duration-300 ease-out',
        'overflow-hidden',
      )}
    >
      {/* ── Card top accent line ── */}
      <div className={cn(
        'h-0.5 w-full shrink-0 transition-all duration-300',
        'bg-gradient-to-r from-transparent via-border/60 to-transparent',
        'group-hover:from-transparent group-hover:via-indigo-500/35 group-hover:to-transparent'
      )} />

      {/* Decorative background light source */}
      <div className="absolute -right-20 -top-20 size-40 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl" />

      <div className="flex flex-col flex-1 p-5 relative z-10">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative">
              <div className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold bg-gradient-to-tr transition-transform duration-305 group-hover:scale-105',
                theme.gradient
              )}>
                {initials}
              </div>
              {/* Dynamic status dot */}
              {c.project_count > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-3">
                  <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', theme.dot)} />
                  <span className={cn('relative inline-flex rounded-full size-3 border-2 border-card', theme.dot)} />
                </span>
              )}
            </div>
            {/* Name + ID */}
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-[15px] leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {c.name}
              </h3>
              <span className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">
                #{c.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* 3-dot menu */}
          <div onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                >
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onClick}>
                  <Briefcase className="size-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit() }}>
                  <Pencil className="size-4 mr-2" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
                  <Trash2 className="size-4 mr-2" /> Delete Record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Contact details ── */}
        <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
          <a
            href={`tel:${c.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/15 p-2 hover:bg-muted/30 hover:border-border/80 transition-all text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-3.5 text-muted-foreground/60 shrink-0" />
            <span className="truncate font-medium tabular-nums">{c.phone}</span>
          </a>

          {c.email ? (
            <a
              href={`mailto:${c.email}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/15 p-2 hover:bg-muted/30 hover:border-border/80 transition-all text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-3.5 text-muted-foreground/60 shrink-0" />
              <span className="truncate">{c.email}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border/20 bg-muted/5 p-2 text-muted-foreground/45">
              <Mail className="size-3.5 shrink-0 opacity-40" />
              <span className="italic">No Email</span>
            </div>
          )}
        </div>

        {/* Metadata section (Location + GSTIN) */}
        {(location || c.gstin) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {location && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 border border-border/30 rounded-md px-2 py-1">
                <MapPin className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="truncate max-w-[120px]">{location}</span>
              </div>
            )}
            {c.gstin && (
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 rounded-md px-2 py-1 font-mono font-semibold">
                <FileText className="size-3 text-indigo-500/70 shrink-0" />
                <span>GST: {c.gstin}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Notes preview ── */}
        {c.notes && (
          <div className="mt-4 border-l-2 border-border/70 pl-3 py-0.5">
            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed italic">
              &ldquo;{c.notes}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between mt-auto">
        <span className="text-[11px] text-muted-foreground/80 font-medium flex items-center gap-1.5">
          <FolderOpen className="size-3.5 text-muted-foreground/50" />
          Project Portfolio
        </span>
        <div className="flex items-center gap-1.5">
          <Badge
            variant={c.project_count > 0 ? 'secondary' : 'outline'}
            className={cn(
              'rounded-full text-[10px] px-2.5 py-0.5 font-bold',
              c.project_count > 0
                ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-none'
                : 'text-muted-foreground/45 border-border/50'
            )}
          >
            {c.project_count} {c.project_count === 1 ? 'project' : 'projects'}
          </Badge>
          
          <span className="text-[11px] text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-300">
            →
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="h-0.5 w-full bg-border/40" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
      </div>
      <div className="px-5 py-3 border-t border-border/50 flex justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortfolioClientsPage() {
  const {
    clients, search, loading, selectedClient, setSelectedId,
    handleSearchChange, addClient, updateClient, deleteClient
  } = useClients()

  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() { setEditMode(false); setSelectedId(null); setFormOpen(true) }

  function openEdit(clientId: string) {
    setSelectedId(clientId)
    setEditMode(true)
    setFormOpen(true)
  }

  function openDetail(clientId: string) {
    setSelectedId(clientId)
    setDetailOpen(true)
  }

  async function handleSubmit(values: ClientFormValues) {
    if (editMode && selectedClient) {
      return updateClient(selectedClient.id, values)
    }
    return addClient(values)
  }

  // ── KPI stats ──
  const withProjects = clients.filter(c => c.project_count > 0).length
  const totalProjects = clients.reduce((s, c) => s + c.project_count, 0)

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
                  <Users className="size-4.5 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg pl-0.5">
                Manage client profiles, contact records, and project histories for your studio.
              </p>
            </div>
            <Button onClick={openAdd} className="h-9 px-4 font-semibold rounded-lg shrink-0 gap-1.5">
              <Plus className="size-4 stroke-[2.5]" />
              New Client
            </Button>
          </div>

          {/* KPI strip */}
          <div className="flex items-stretch divide-x divide-border/60 border-t border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 shrink-0">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Total Clients</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : clients.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 shrink-0">
                <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Active Clients</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : withProjects}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 shrink-0">
                <FolderOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Total Projects</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : totalProjects}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0">
                <IndianRupee className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Avg Projects / Client</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading || clients.length === 0 ? '—' : (totalProjects / clients.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TOOLBAR ════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-border/50 bg-background">
        <div className="relative min-w-0 w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, phone, city, GST…"
            className={cn(
              'w-full h-9 rounded-lg border border-input bg-muted/20 pl-9 pr-3 text-sm',
              'placeholder:text-muted-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
              'transition-colors',
            )}
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-3 h-9 px-3 text-xs text-muted-foreground"
            onClick={() => handleSearchChange('')}
          >
            Clear
          </Button>
        )}
      </div>

      {/* ══ GRID ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed rounded-2xl bg-card">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Users className="size-8 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-base">No clients found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
              {search
                ? 'No clients match your search.'
                : 'Register your first client to start linking projects.'}
            </p>
            <div className="mt-5">
              {search ? (
                <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => handleSearchChange('')}>
                  Clear Search
                </Button>
              ) : (
                <Button onClick={openAdd} size="sm" className="rounded-lg gap-1.5">
                  <Plus className="size-3.5" /> Add Client
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Showing <span className="font-semibold text-foreground">{clients.length}</span> client{clients.length !== 1 ? 's' : ''}
              {search && ' matching search'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clients.map(c => (
                <ClientCard
                  key={c.id}
                  c={c}
                  onClick={() => openDetail(c.id)}
                  onEdit={() => openEdit(c.id)}
                  onDelete={() => deleteClient(c)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Client Detail Sheet ── */}
      <ClientDetailSheet
        client={selectedClient ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={() => { setDetailOpen(false); openEdit(selectedClient?.id ?? '') }}
      />

      {/* ── Create / Edit Form Sheet ── */}
      <ClientForm
        open={formOpen}
        client={editMode ? selectedClient : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
