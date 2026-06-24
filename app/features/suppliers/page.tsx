'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Phone, Mail, MapPin, Building2, MoreHorizontal, Pencil, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuppliers } from './_components/useSuppliers'
import { SupplierForm } from './_components/SupplierForm'
import type { SupplierWithStats, SupplierFormValues } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

export default function SuppliersPage() {
  const router = useRouter()
  const {
    suppliers, kpi, search, loading, kpiLoading,
    selectedSupplier, setSelectedId,
    handleSearchChange,
    addSupplier, updateSupplier, deleteSupplier,
  } = useSuppliers()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() {
    setSelectedId(null)
    setEditMode(false)
    setFormOpen(true)
  }

  function openEdit(s: SupplierWithStats) {
    setSelectedId(s.id)
    setEditMode(true)
    setFormOpen(true)
  }

  async function handleSubmit(values: SupplierFormValues) {
    if (editMode && selectedSupplier) return updateSupplier(selectedSupplier.id, values)
    return addSupplier(values)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 bg-background">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* Title and Main Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Suppliers
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Manage supplier master data, track purchase history and outstanding balances.
            </p>
          </div>
          <Button onClick={openAdd} size="default" className="px-4 shrink-0 font-semibold">
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            Add Supplier
          </Button>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Total Suppliers */}
          <div className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Total Suppliers
            </span>
            <div className="text-xl font-bold tracking-tight">
              {kpiLoading ? <Skeleton className="h-6 w-16 mt-0.5" /> : kpi.total_count}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Registered vendors
            </span>
          </div>

          {/* Card 2 — Total Purchases */}
          <div className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Total Purchases
            </span>
            <div className="text-xl font-bold tracking-tight">
              {kpiLoading ? <Skeleton className="h-6 w-28 mt-0.5" /> : rupee(kpi.total_purchased)}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Across all suppliers
            </span>
          </div>

          {/* Card 3 — Amount Owed */}
          <div className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Amount Owed
            </span>
            <div className="flex items-center gap-2">
              {kpi.amount_owed > 0 && (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {kpiLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : rupee(kpi.amount_owed)}
              </div>
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Outstanding balance
            </span>
          </div>

          {/* Card 4 — Active (filtered count) */}
          <div className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Showing
            </span>
            <div className="text-xl font-bold tracking-tight">
              {loading ? <Skeleton className="h-6 w-10 mt-0.5" /> : suppliers.length}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              {search ? 'Matching your search' : 'All suppliers'}
            </span>
          </div>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, phone, or GSTIN…"
            className="pl-9 h-9 text-sm rounded-lg border-border/60"
          />
        </div>
      </div>

      {/* ── Supplier Table ─ inside a card like ProductTable ─────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2 border-b">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-[10%]" />
                </div>
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <Building2 className="size-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? 'No suppliers match your search.' : 'No suppliers yet.'}
              </p>
              {!search && (
                <p className="text-xs text-muted-foreground/70">
                  Add your first supplier to start recording purchases.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 pl-4">Supplier</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3">Location</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3">GSTIN</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right">Total Purchased</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right">Amount Owed</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map(s => {
                  const location = [s.city, s.state].filter(Boolean).join(', ')
                  const owed = s.amount_owed

                  return (
                    <TableRow
                      key={s.id}
                      onClick={() => router.push(`/features/suppliers/${s.id}`)}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group border-b border-border/40"
                    >
                      {/* Supplier Name & contact */}
                      <TableCell className="py-3 pl-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground group-hover:text-black dark:group-hover:text-white transition-colors">
                            {s.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {s.phone && (
                              <span className="flex items-center gap-1"><Phone className="size-2.5" /> {s.phone}</span>
                            )}
                            {s.email && (
                              <span className="flex items-center gap-1"><Mail className="size-2.5" /> {s.email}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="py-3">
                        {location ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-2.5 text-muted-foreground/50 shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* GSTIN */}
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {s.gstin ? s.gstin : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>

                      {/* Total Purchased */}
                      <TableCell className="py-3 text-right tabular-nums text-xs font-semibold text-foreground">
                        {s.total_purchased > 0 ? rupee(s.total_purchased) : <span className="text-muted-foreground/50">—</span>}
                      </TableCell>

                      {/* Amount Owed */}
                      <TableCell className="py-3 text-right tabular-nums font-semibold">
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          owed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                        )}>
                          {owed > 0 ? rupee(owed) : '—'}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right pr-4 action-trigger" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                              <MoreHorizontal className="size-4 text-muted-foreground" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => router.push(`/features/suppliers/${s.id}`)}>
                              <Building2 className="size-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Pencil className="size-4 mr-2" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => deleteSupplier(s)}>
                              <Trash2 className="size-4 mr-2" /> Delete Supplier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────────────── */}
      <SupplierForm
        open={formOpen}
        supplier={editMode ? (selectedSupplier ?? null) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
