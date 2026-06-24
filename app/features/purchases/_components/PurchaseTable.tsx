'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  CalendarDays, ShoppingBag, MoreHorizontal, Eye, Trash2, ReceiptText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Purchase, PurchaseFilters, SortField, SortDir } from './types'
import { ROWS_PER_PAGE } from './types'
import { Input } from '@/components/ui/input'

// ─── helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  purchases: Purchase[]
  total: number
  page: number
  sortField: SortField
  sortDir: SortDir
  filters: PurchaseFilters
  loading: boolean
  onSort: (field: SortField) => void
  onPageChange: (page: number) => void
  onSearch: (v: string) => void
  onDateRange: (range: PurchaseFilters['dateRange'], from?: string, to?: string) => void
  onView: (purchase: Purchase) => void
  onDelete: (purchase: Purchase) => Promise<boolean>
}

// ─── sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown className="size-3 text-muted-foreground/40" />
  return dir === 'desc'
    ? <ChevronDown className="size-3 text-foreground" />
    : <ChevronUp className="size-3 text-foreground" />
}

function SortableHeader({
  label,
  field,
  current,
  dir,
  className,
  onSort,
}: {
  label: string
  field?: SortField
  current: SortField
  dir: SortDir
  className?: string
  onSort: (field: SortField) => void
}) {
  if (!field) {
    return (
      <th className={cn('h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground', className)}>
        {label}
      </th>
    )
  }

  return (
    <th className={cn('h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {label}
        <SortIcon field={field} current={current} dir={dir} />
      </button>
    </th>
  )
}

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/40 hover:bg-transparent">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-3 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-3 py-3 text-right"><Skeleton className="ml-auto h-5 w-16 rounded-full" /></td>
      <td className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></td>
      <td className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></td>
      <td className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-24" /></td>
      <td className="py-3 pl-3 pr-4"><Skeleton className="size-7 rounded-md" /></td>
    </tr>
  )
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ purchase, deleting, onConfirm, onCancel }: {
  purchase: Purchase; deleting: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {purchase.purchase_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will <strong>reverse stock</strong> for all {purchase.item_count ?? 0} products
            in this purchase. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Deleting...' : 'Yes, delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── main table ───────────────────────────────────────────────────────────────

export function PurchaseTable({
  purchases, total, page, sortField, sortDir, filters, loading,
  onSort, onPageChange, onSearch, onDateRange, onView, onDelete,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [customFrom, setCustomFrom] = useState(filters.customFrom)
  const [customTo, setCustomTo] = useState(filters.customTo)
  const [showCustom, setShowCustom] = useState(filters.dateRange === 'custom')

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  const startRow = (page - 1) * ROWS_PER_PAGE + 1
  const endRow = Math.min(page * ROWS_PER_PAGE, total)
  const isEmpty = !loading && purchases.length === 0

  function handleDateFilter(val: PurchaseFilters['dateRange']) {
    if (val === 'custom') { setShowCustom(true); onDateRange('custom', customFrom, customTo) }
    else { setShowCustom(false); onDateRange(val) }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await onDelete(deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 shrink-0 sm:w-[min(420px,45vw)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={filters.search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search PO number or supplier…"
              className="h-8 pl-8"
            />
          </div>
          <div className="hidden h-5 w-px shrink-0 bg-border/60 sm:block" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-muted-foreground/60 shrink-0" />
              <Select
                value={filters.dateRange}
                onValueChange={v => handleDateFilter(v as PurchaseFilters['dateRange'])}>
                <SelectTrigger className="h-8 w-36 rounded-lg border-border/60 text-xs">
                  <span>
                    {filters.dateRange === 'all'    && 'All time'}
                    {filters.dateRange === 'today'  && 'Today'}
                    {filters.dateRange === 'week'   && 'This Week'}
                    {filters.dateRange === 'month'  && 'This Month'}
                    {filters.dateRange === 'custom' && 'Custom'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom range…</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showCustom && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <DatePicker
                value={customFrom}
                onChange={setCustomFrom}
                className="h-8 w-36 text-[13px] bg-muted/50 rounded-lg"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <DatePicker
                value={customTo}
                onChange={setCustomTo}
                className="h-8 w-36 text-[13px] bg-muted/50 rounded-lg"
              />
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg"
                onClick={() => onDateRange('custom', customFrom, customTo)}>
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ShoppingBag className="size-8 opacity-20" />
            <p className="text-sm font-medium text-foreground">
              {filters.search || filters.dateRange !== 'all'
                ? 'No purchases match your search'
                : 'No purchases yet'}
            </p>
            <p className="text-xs">
              {filters.search
                ? 'Try a different search term.'
                : filters.dateRange !== 'all'
                  ? 'No purchases in this period.'
                  : 'Record your first purchase to start tracking stock.'}
            </p>
          </div>
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-width:thin]">
            <table className="w-full min-w-[900px] caption-bottom border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border/60 hover:bg-transparent">
                  <SortableHeader
                    label="Supplier"
                    field="supplier_name"
                    current={sortField}
                    dir={sortDir}
                    className="pl-4"
                    onSort={onSort}
                  />
                  <th className="h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Purchase No.
                  </th>
                  <SortableHeader
                    label="Date"
                    field="purchase_date"
                    current={sortField}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <th className="h-10 px-3 text-right align-middle text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Items
                  </th>
                  <th className="h-10 px-3 text-right align-middle text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Tax
                  </th>
                  <th className="h-10 px-3 text-right align-middle text-xs font-medium whitespace-nowrap text-muted-foreground">
                    Discount
                  </th>
                  <SortableHeader
                    label="Grand Total"
                    field="grand_total"
                    current={sortField}
                    dir={sortDir}
                    className="text-right"
                    onSort={onSort}
                  />
                  <th className="h-10 w-10 px-3 pr-4" />
                </tr>
              </thead>

              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : purchases.map(p => (
                    <tr
                      key={p.id}
                      className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40"
                      onClick={() => onView(p)}
                    >
                      <td className="py-3 pl-4 pr-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <ReceiptText className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-56 truncate text-sm font-medium leading-snug text-foreground">
                              {p.supplier_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.discount_amount > 0 ? `${rupee(p.discount_amount)} discount` : 'No discount'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 align-middle">
                        <span className="font-mono text-xs font-medium text-foreground">
                          {p.purchase_number}
                        </span>
                      </td>

                      <td className="px-3 py-3 align-middle text-sm text-muted-foreground whitespace-nowrap">
                        {fmtDate(p.purchase_date)}
                      </td>

                      <td className="px-3 py-3 text-right align-middle">
                        <Badge variant="outline" className="font-medium tabular-nums">
                          {p.item_count ?? 0} items
                        </Badge>
                      </td>

                      <td className="px-3 py-3 text-right align-middle">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {rupee(p.tax_amount)}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right align-middle">
                        {p.discount_amount > 0 ? (
                          <span className="text-sm tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                            {rupee(p.discount_amount)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right align-middle">
                        <span className="text-sm tabular-nums font-semibold text-foreground">
                          {rupee(p.grand_total)}
                        </span>
                      </td>

                      <td className="w-10 py-3 pl-3 pr-4 align-middle" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-7 opacity-0 transition-opacity group-hover:opacity-100">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(p)}>
                              <Eye className="mr-2 size-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}>
                              <Trash2 className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {total > 0 && (
          <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-4 py-3 text-[13px] text-muted-foreground">
            <span>
              <strong className="font-medium text-foreground">{startRow}–{endRow}</strong>
              {' '}of{' '}
              <strong className="font-medium text-foreground">{total}</strong> purchases
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-lg"
                disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Previous
              </Button>
              <span className="px-1.5 text-xs tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-lg"
                disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm
          purchase={deleteTarget}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
