'use client'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Search, Phone, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CustomerWithStats, CustomerFilter } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

interface Props {
  customers: CustomerWithStats[]
  selectedId: string | null
  search: string
  filter: CustomerFilter
  loading: boolean
  onSelect: (id: string) => void
  onSearch: (v: string) => void
  onFilter: (f: CustomerFilter) => void
  onAdd: () => void
}

function CardSkeleton() {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-3 w-28" />
      <div className="mt-2 flex gap-4">
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
    <div className="flex h-full flex-col border-r">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3.5">
        <p className="text-sm font-semibold text-foreground">
          Customers{!loading && <span className="ml-1.5 font-normal text-muted-foreground">({customers.length})</span>}
        </p>
        <Button size="sm" onClick={onAdd} className="h-7 px-2.5 text-xs">
          <Plus className="size-3" /> Add
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex shrink-0 flex-col gap-2 border-b px-3 py-2.5">
        <InputGroup>
          <InputGroupAddon>
            <Search className="size-3.5 text-muted-foreground/60" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search name, phone, GSTIN…"
          />
        </InputGroup>
        <Select value={filter} onValueChange={v => onFilter(v as CustomerFilter)}>
          <SelectTrigger className="h-7 px-2.5 text-xs">
            <span>
              {filter === 'all' && 'All Customers'}
              {filter === 'active' && 'Active Only'}
              {filter === 'inactive' && 'Inactive Only'}
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
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : customers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm font-medium text-foreground">
              {search || filter !== 'all' ? 'No customers match' : 'No customers yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? 'Try a different search term.' : filter !== 'all' ? 'Clear filter to see all customers.' : 'Add your first customer to get started.'}
            </p>
            {filter !== 'all' && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onFilter('all')}>
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="w-full bg-transparent">
              <SidebarContent>
                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0">
                      {customers.map(c => (
                        <CustomerMenuItem key={c.id} customer={c} selected={c.id === selectedId} onSelect={onSelect} />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        )}
      </div>
    </div>
  )
}

function CustomerMenuItem({
  customer: c, selected, onSelect,
}: { customer: CustomerWithStats; selected: boolean; onSelect: (id: string) => void }) {
  const limit = c.credit_limit ?? 0
  const outstanding = c.total_outstanding
  const overLimit = limit > 0 && outstanding >= limit
  const nearLimit = limit > 0 && outstanding >= limit * 0.8

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={selected}
        onClick={() => onSelect(c.id)}
        className={cn('h-auto items-start gap-0 rounded-none py-3', !c.is_active && 'opacity-50')}
      >
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{c.name}</p>
            <Badge variant={c.is_active ? 'default' : 'secondary'} className="h-4 shrink-0 px-1.5 text-[10px]">
              {c.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {c.phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-2.5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Outstanding:</span>
              <span className={cn(
                'text-xs font-semibold tabular-nums',
                outstanding <= 0 ? 'text-emerald-600 dark:text-emerald-400' :
                overLimit ? 'text-red-600 dark:text-red-400' :
                nearLimit ? 'text-amber-600 dark:text-amber-400' :
                'text-amber-600 dark:text-amber-400',
              )}>
                {outstanding > 0 ? rupee(outstanding) : '—'}
              </span>
            </div>
            {limit > 0 && (
              <span className="text-xs text-muted-foreground">Limit: {rupee(limit)}</span>
            )}
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}