'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Phone, Plus } from 'lucide-react'
import type { SupplierWithStats } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface Props {
  suppliers:  SupplierWithStats[]
  selectedId: string | null
  search:     string
  loading:    boolean
  onSelect:   (id: string) => void
  onSearch:   (v: string) => void
  onAdd:      () => void
}

function CardSkeleton() {
  return (
    <div className="px-3 py-3 border-b border-border/40">
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-3 w-28 mb-2" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function SupplierList({ suppliers, selectedId, search, loading, onSelect, onSearch, onAdd }: Props) {
  return (
    <div className="flex h-full flex-col min-h-0 min-w-0">

      {/* Search — outside the card */}
      <div className="shrink-0 pb-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search name, phone, GSTIN…"
            className={cn(
              'w-full h-8 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm',
              'placeholder:text-muted-foreground/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
              'transition-colors',
            )}
          />
        </div>
      </div>

      {/* Card — full-width, scrollable inside, faded top */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 shrink-0 border-b border-border/60">
          <p className="text-sm font-semibold text-foreground">
            Suppliers{!loading && <span className="ml-1.5 text-muted-foreground font-normal">({suppliers.length})</span>}
          </p>
          <Button size="sm" onClick={onAdd}
            className="h-7 px-2.5 text-xs bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black rounded-lg">
            <Plus className="size-3 mr-1" /> Add
          </Button>
        </div>

        {/* List — scrollable with top fade */}
        <div className="relative min-h-0 flex-1">
          {/* Top fade overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-card to-transparent"
          />

          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            ) : suppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                <p className="text-sm font-medium">
                  {search ? 'No suppliers match your search.' : 'No suppliers yet.'}
                </p>
                {!search && (
                  <p className="text-xs text-muted-foreground">
                    Add your first supplier to start recording purchases.
                  </p>
                )}
              </div>
            ) : (
              suppliers.map(s => (
                <SupplierCard key={s.id} supplier={s} selected={s.id === selectedId} onSelect={onSelect} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SupplierCard({
  supplier: s, selected, onSelect,
}: { supplier: SupplierWithStats; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(s.id)}
      className={cn(
        'w-full text-left px-3 py-3 border-b border-border/40 transition-colors',
        'hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30',
        selected && 'bg-neutral-100 dark:bg-neutral-800/60 border-l-2 border-l-black dark:border-l-white',
      )}
    >
      <p className={cn(
        'text-sm font-semibold truncate',
        selected ? 'text-black dark:text-white' : 'text-foreground',
      )}>
        {s.name}
      </p>

      {s.phone && (
        <div className="flex items-center gap-1 mt-0.5">
          <Phone className="size-2.5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{s.phone}</p>
        </div>
      )}

      {s.gstin && (
        <p className="text-xs font-mono text-muted-foreground/60 mt-0.5 truncate">{s.gstin}</p>
      )}

      <div className="flex items-center justify-between mt-1.5 gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Purchases:</span>
          <span className="text-xs font-semibold tabular-nums">
            {s.total_purchased > 0 ? rupee(s.total_purchased) : '—'}
          </span>
        </div>
        {s.amount_owed > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Owed:</span>
            <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {rupee(s.amount_owed)}
            </span>
          </div>
        )}
      </div>

      {s.total_purchased === 0 && (
        <p className="text-xs text-muted-foreground/50 mt-1">No purchases yet</p>
      )}
    </button>
  )
}
