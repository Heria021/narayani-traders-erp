'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Phone, MapPin, Receipt, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuppliers } from './_components/useSuppliers'
import { SupplierForm } from './_components/SupplierForm'
import type { SupplierWithStats, SupplierFormValues } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

// ── Skeleton card ──────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-4 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// ── Supplier Card ──────────────────────────────────────────────────────────────
function SupplierCard({
  supplier: s,
  selected,
  onSelect,
}: {
  supplier: SupplierWithStats
  selected: boolean
  onSelect: (id: string) => void
}) {
  const location = [s.city, s.state].filter(Boolean).join(', ')

  return (
    <button
      onClick={() => onSelect(s.id)}
      className={cn(
        'w-full text-left border rounded-lg p-4 transition-all duration-150 space-y-3',
        'hover:shadow-sm hover:border-border',
        selected
          ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 ring-1 ring-black dark:ring-white'
          : 'border-border/60 bg-card',
      )}
    >
      {/* Top row: name + owed badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <p className={cn(
            'text-sm font-semibold truncate',
            selected ? 'text-black dark:text-white' : 'text-foreground',
          )}>
            {s.name}
          </p>
          {s.phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-2.5 text-muted-foreground/50 shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{s.phone}</p>
            </div>
          )}
        </div>
        {s.amount_owed > 0 && (
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 tabular-nums">
            {rupee(s.amount_owed)} owed
          </span>
        )}
      </div>

      {/* Location + GSTIN */}
      {(location || s.gstin) && (
        <div className="space-y-0.5">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin className="size-2.5 text-muted-foreground/40 shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{location}</p>
            </div>
          )}
          {s.gstin && (
            <p className="text-[10px] font-mono text-muted-foreground/50 truncate pl-3.5">{s.gstin}</p>
          )}
        </div>
      )}

      {/* Purchases stat */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <div className="flex items-center gap-1">
          <Receipt className="size-3 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Total purchases:</span>
          <span className="text-xs font-semibold tabular-nums">
            {s.total_purchased > 0 ? rupee(s.total_purchased) : '—'}
          </span>
        </div>
        {s.total_purchased === 0 && (
          <span className="text-[10px] text-muted-foreground/50">No orders yet</span>
        )}
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const router = useRouter()
  const {
    suppliers, kpi, search, loading, kpiLoading,
    selectedSupplier,
    handleSearchChange,
    addSupplier, updateSupplier,
  } = useSuppliers()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() { setEditMode(false); setFormOpen(true) }

  async function handleSubmit(values: SupplierFormValues) {
    if (editMode && selectedSupplier) return updateSupplier(selectedSupplier.id, values)
    return addSupplier(values)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* Title and Main Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Suppliers
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Manage supplier master data, track purchase history and outstanding balances.
            </p>
          </div>
          <Button onClick={openAdd} size="default" className="px-4 shrink-0">
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            Add Supplier
          </Button>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Total Suppliers */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Total Suppliers
            </span>
            <div className="text-xl font-semibold tracking-tight">
              {kpiLoading ? <Skeleton className="h-6 w-16 mt-0.5" /> : kpi.total_count}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Registered vendors
            </span>
          </div>

          {/* Card 2 — Total Purchases */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Total Purchases
            </span>
            <div className="text-xl font-semibold tracking-tight">
              {kpiLoading ? <Skeleton className="h-6 w-28 mt-0.5" /> : rupee(kpi.total_purchased)}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Across all suppliers
            </span>
          </div>

          {/* Card 3 — Amount Owed */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Amount Owed
            </span>
            <div className="flex items-center gap-2">
              {kpi.amount_owed > 0 && (
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <div className="text-xl font-semibold tracking-tight">
                {kpiLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : rupee(kpi.amount_owed)}
              </div>
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Outstanding balance
            </span>
          </div>

          {/* Card 4 — Active (filtered count) */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Showing
            </span>
            <div className="text-xl font-semibold tracking-tight">
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

      {/* ── Supplier Cards Grid ─ inside a card like ProductTable ─────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        {/* Scrollable area with top fade */}
        <div className="relative min-h-0 flex-1">
          {/* Top fade overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-8 bg-gradient-to-b from-card to-transparent"
          />

          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin] p-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                <Users className="size-10 text-muted-foreground/30" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suppliers.map(s => (
                  <SupplierCard
                    key={s.id}
                    supplier={s}
                    selected={false}
                    onSelect={id => router.push(`/features/suppliers/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
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

