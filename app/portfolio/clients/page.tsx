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
  const location = [c.city, c.state].filter(Boolean).join(', ')

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border/85 bg-card p-5 cursor-pointer',
        'hover:bg-muted/15 hover:border-foreground/30',
        'transition-all duration-200 ease-out',
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-xs border border-border/60">
            {initials}
          </div>
          {/* Name + ID */}
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm leading-tight truncate group-hover:text-foreground/80 transition-colors">
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
                className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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

      {/* ── Contact & Info Grid (shadcn-inspired details grid) ── */}
      <div className="space-y-3 flex-1">
        <div className="grid gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-mono text-foreground font-medium">{c.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium truncate max-w-[180px]">{c.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="text-foreground font-medium truncate max-w-[180px]">{location || '—'}</span>
          </div>
          {c.gstin && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GSTIN</span>
              <span className="font-mono text-foreground font-semibold bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {c.gstin}
              </span>
            </div>
          )}
        </div>

        {/* ── Notes preview ── */}
        {c.notes && (
          <div className="rounded-lg border bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-normal mt-1">
            <p className="line-clamp-2">{c.notes}</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t pt-3 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FolderOpen className="size-3.5" />
          Projects
        </span>
        <Badge variant="secondary" className="font-semibold text-[10px] rounded-md px-2 py-0">
          {c.project_count} {c.project_count === 1 ? 'project' : 'projects'}
        </Badge>
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/65 border shrink-0">
                <Users className="size-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Total Clients</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : clients.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/65 border shrink-0">
                <Briefcase className="size-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Active Clients</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : withProjects}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/65 border shrink-0">
                <FolderOpen className="size-4 text-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Total Projects</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : totalProjects}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/65 border shrink-0">
                <IndianRupee className="size-4 text-foreground" />
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
