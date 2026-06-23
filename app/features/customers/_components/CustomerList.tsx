'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { Search, Phone, Plus } from 'lucide-react'
import type { CustomerWithStats, CustomerFilter } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface Props {
  customers:    CustomerWithStats[]
  selectedId:   string | null
  search:       string
  filter:       CustomerFilter
  loading:      boolean
  onSelect:     (id: string) => void
  onSearch:     (v: string) => void
  onFilter:     (f: CustomerFilter) => void
  onAdd:        () => void
}

function CardSkeleton() {
  return (
    <div className="px-3 py-2.5 border-b border-border/40">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-28 mt-2" />
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function CustomerList({
  customers, selectedId, search, filter, loading, onSelect, onSearch, onFilter, onAdd,
}: Props) {
  return (
    <div className="flex h-full flex-col border-r border-border/60">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0 border-b border-border/60">
        <p className="text-sm font-semibold text-foreground">
          Customers{!loading && <span className="ml-1.5 text-muted-foreground font-normal">({customers.length})</span>}
        </p>
        <Button size="sm" onClick={onAdd}
          className="h-7 px-2.5 text-xs bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black rounded-lg">
          <Plus className="size-3 mr-1" /> Add
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-2 px-3 py-2.5 shrink-0 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search name, phone, GSTIN…"
            className="pl-8 h-8 text-xs rounded-lg border-border/60"
          />
        </div>
        <Select value={filter} onValueChange={v => onFilter(v as CustomerFilter)}>
          <SelectTrigger className="h-7 text-xs rounded-lg border-border/60 px-2.5">
            <span>
              {filter === 'all'         && 'All Customers'}
              {filter === 'active'      && 'Active Only'}
              {filter === 'inactive'    && 'Inactive Only'}
              {filter === 'outstanding' && '⚠ With Outstanding'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="outstanding">With Outstanding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin]">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <p className="text-sm font-medium text-foreground">
              {search || filter !== 'all' ? 'No customers match' : 'No customers yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? 'Try a different search term.' : filter !== 'all' ? 'Clear filter to see all customers.' : 'Add your first customer to get started.'}
            </p>
            {filter !== 'all' && (
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => onFilter('all')}>
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          customers.map(c => <CustomerCard key={c.id} customer={c} selected={c.id === selectedId} onSelect={onSelect} />)
        )}
      </div>
    </div>
  )
}

function CustomerCard({
  customer: c, selected, onSelect,
}: { customer: CustomerWithStats; selected: boolean; onSelect: (id: string) => void }) {
  const limit       = c.credit_limit ?? 0
  const outstanding = c.total_outstanding
  const overLimit   = limit > 0 && outstanding >= limit
  const nearLimit   = limit > 0 && outstanding >= limit * 0.8

  return (
    <button
      onClick={() => onSelect(c.id)}
      className={cn(
        'w-full text-left px-3 py-3 border-b border-border/40 transition-colors',
        'hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30',
        selected && 'bg-neutral-100 dark:bg-neutral-800/60 border-l-2 border-l-black dark:border-l-white',
        !c.is_active && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn(
          'text-sm font-semibold truncate',
          selected ? 'text-black dark:text-white' : 'text-foreground',
        )}>
          {c.name}
        </p>
        <Badge className={cn(
          'shrink-0 text-[10px] px-1.5 py-0 h-4 border-0 font-semibold',
          c.is_active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800',
        )}>
          {c.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {c.phone && (
        <div className="flex items-center gap-1 mt-0.5">
          <Phone className="size-2.5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{c.phone}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-1.5 gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Outstanding:</span>
          <span className={cn(
            'text-xs font-semibold tabular-nums',
            outstanding <= 0         ? 'text-emerald-600 dark:text-emerald-400' :
            overLimit                ? 'text-red-600 dark:text-red-400' :
            nearLimit                ? 'text-amber-600 dark:text-amber-400' :
                                       'text-amber-600 dark:text-amber-400',
          )}>
            {outstanding > 0 ? rupee(outstanding) : '—'}
          </span>
        </div>
        {limit > 0 && (
          <span className="text-xs text-muted-foreground">
            Limit: {rupee(limit)}
          </span>
        )}
      </div>
    </button>
  )
}
