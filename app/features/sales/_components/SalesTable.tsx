'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Search, ShoppingBag, MoreHorizontal, Eye, Trash2, CreditCard,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Sale, SaleFilters, SortField, SortDir, PaymentStatus } from './types'
import { ROWS_PER_PAGE, STATUS_CONFIG } from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const rupee2 = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const today = () => new Date().toISOString().slice(0, 10)

// ─── sort icon & header ───────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown className="size-3 text-muted-foreground/40" />
  return dir === 'desc'
    ? <ChevronDown className="size-3 text-foreground" />
    : <ChevronUp   className="size-3 text-foreground" />
}

function SortableHeader({
  label, field, current, dir, className, onSort,
}: {
  label: string; field?: SortField; current: SortField; dir: SortDir; className?: string
  onSort: (field: SortField) => void
}) {
  if (!field) return <TableHead className={cn("bg-card", className)}>{label}</TableHead>
  return (
    <TableHead className={cn("bg-card", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          className?.includes('text-right') && "w-full justify-end"
        )}
        onClick={() => onSort(field)}
      >
        {label}
        <SortIcon field={field} current={current} dir={dir} />
      </button>
    </TableHead>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  sales: Sale[]
  total: number
  page: number
  sortField: SortField
  sortDir: SortDir
  filters: SaleFilters
  loading: boolean
  onSort:          (field: SortField) => void
  onPageChange:    (page: number) => void
  onSearch:        (v: string) => void
  onStatusChange:  (status: SaleFilters['status']) => void
  onDateRange:     (range: SaleFilters['dateRange'], from?: string, to?: string) => void
  onViewInvoice:   (sale: Sale) => void
  onRecordPayment: (sale: Sale) => void
  onDelete:        (sale: Sale) => Promise<boolean>
}



// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold', cfg.color)}>
      {cfg.label}
    </span>
  )
}



// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ sale, deleting, onConfirm, onCancel }: {
  sale: Sale; deleting: boolean; onConfirm: () => void; onCancel: () => void
}) {
  const canDelete = sale.sale_date === today() && sale.amount_paid === 0
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {sale.invoice_number}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {canDelete ? (
              <>
                This will <strong>reverse stock</strong> for all{' '}
                {sale.item_count ?? 0} product{(sale.item_count ?? 0) !== 1 ? 's' : ''} in this bill.
                This action cannot be undone.
              </>
            ) : (
              <span className="text-destructive font-medium">
                {sale.sale_date !== today()
                  ? 'Cannot delete — only today\'s bills can be deleted.'
                  : 'Cannot delete — a payment is recorded against this bill.'}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={deleting}>Cancel</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Yes, delete'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── main table ───────────────────────────────────────────────────────────────

export function SalesTable({
  sales, total, page, sortField, sortDir, filters, loading,
  onSort, onPageChange, onSearch, onStatusChange, onDateRange,
  onViewInvoice, onRecordPayment, onDelete,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [customFrom,   setCustomFrom]   = useState(filters.customFrom)
  const [customTo,     setCustomTo]     = useState(filters.customTo)
  const [showCustom,   setShowCustom]   = useState(filters.dateRange === 'custom')

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  const startRow   = (page - 1) * ROWS_PER_PAGE + 1
  const endRow     = Math.min(page * ROWS_PER_PAGE, total)
  const isEmpty    = !loading && sales.length === 0

  function handleDateFilter(val: SaleFilters['dateRange']) {
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

  const statusOptions: { value: SaleFilters['status']; label: string }[] = [
    { value: 'all',     label: 'All Status'  },
    { value: 'paid',    label: 'Paid'        },
    { value: 'partial', label: 'Partial'     },
    { value: 'pending', label: 'Pending'     },
  ]

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">

        {/* ── Toolbar: Search & Status (Row 1), Date Filters (Row 2) ────────────────── */}
        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-2.5">
          {/* Row 1: Search & Status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative min-w-0 shrink-0 sm:w-[min(320px,40vw)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
              <input
                value={filters.search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search invoice number or customer..."
                className={cn(
                  'w-full h-8 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm',
                  'placeholder:text-muted-foreground/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
                  'transition-colors',
                )}
              />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {statusOptions.map(st => {
                const isActive = filters.status === st.value
                return (
                  <button
                    key={st.value}
                    onClick={() => onStatusChange(st.value)}
                    className={cn(
                      'shrink-0 px-2.5 h-7 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap',
                      isActive
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
                    )}
                  >
                    {st.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-border/40" />

          {/* Row 2: Date Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {[
                { value: 'all', label: 'All time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom range' },
              ].map(dt => {
                const isActive = filters.dateRange === dt.value
                return (
                  <button
                    key={dt.value}
                    onClick={() => handleDateFilter(dt.value as SaleFilters['dateRange'])}
                    className={cn(
                      'shrink-0 px-2.5 h-7 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap',
                      isActive
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
                    )}
                  >
                    {dt.label}
                  </button>
                )
              })}
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
        </div>

        {/* ── Table Viewport ────────────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground py-20">
            <ShoppingBag className="size-8 opacity-20" />
            <p className="text-sm font-medium text-foreground">
              {filters.search
                ? 'No bills match your search'
                : filters.status !== 'all'
                  ? `No ${filters.status} bills in this period`
                  : filters.dateRange !== 'all'
                    ? 'No bills in this period'
                    : 'No sales yet'}
            </p>
            <p className="text-xs">
              {filters.search
                ? 'Try a different search term.'
                : filters.status !== 'all' || filters.dateRange !== 'all'
                  ? 'Try changing the filters.'
                  : 'Create your first bill to get started.'}
            </p>
          </div>
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-width:thin]">
            <Table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
              <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <SortableHeader
                    label="Invoice Details"
                    field="sale_date"
                    current={sortField}
                    dir={sortDir}
                    onSort={onSort}
                    className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40"
                  />
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card">
                    Items
                  </TableHead>
                  <SortableHeader
                    label="Grand Total"
                    field="grand_total"
                    current={sortField}
                    dir={sortDir}
                    onSort={onSort}
                    className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40"
                  />
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card">
                    Paid
                  </TableHead>
                  <SortableHeader
                    label="Balance"
                    field="balance_due"
                    current={sortField}
                    dir={sortDir}
                    onSort={onSort}
                    className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40"
                  />
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card">
                    Status
                  </TableHead>
                  <TableHead className="w-10 pl-3 pr-4 py-2 text-right border-b border-border/40 bg-card" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent border-b">
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-10 rounded-lg shrink-0" />
                          <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-4 w-36" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-5 w-14 rounded-md" /></TableCell>
                      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="py-3 pl-3 pr-4"><Skeleton className="size-7 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  sales.map(s => {
                    const canDelete = s.sale_date === today() && s.amount_paid === 0
                    return (
                      <TableRow
                        key={s.id}
                        className="group cursor-pointer border-b transition-colors hover:bg-muted/40"
                        onClick={() => onViewInvoice(s)}
                      >
                        {/* Col 1: Invoice Details */}
                        <TableCell className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                              {s.customer_name === 'Walk-in'
                                ? '?'
                                : s.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-foreground text-sm leading-tight">
                                {s.customer_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground leading-none">
                                <span className="font-mono bg-muted/60 px-1 rounded font-medium">
                                  {s.invoice_number}
                                </span>
                                <span className="text-muted-foreground/30">•</span>
                                <span>
                                  {fmtDate(s.sale_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Col 2: Items count */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <Badge variant="outline" className="font-medium tabular-nums text-xs">
                            {s.item_count ?? 0} {(s.item_count ?? 0) === 1 ? 'item' : 'items'}
                          </Badge>
                        </TableCell>

                        {/* Col 3: Grand Total */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <span className="text-sm tabular-nums font-semibold text-foreground">
                            {rupee(s.grand_total)}
                          </span>
                        </TableCell>

                        {/* Col 4: Paid */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <span className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                            {rupee2(s.amount_paid)}
                          </span>
                        </TableCell>

                        {/* Col 5: Balance */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          {s.balance_due > 0 ? (
                            <span className="text-sm tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                              {rupee2(s.balance_due)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground/30">—</span>
                          )}
                        </TableCell>

                        {/* Col 6: Status */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <StatusBadge status={s.payment_status} />
                        </TableCell>

                        {/* Col 7: Actions */}
                        <TableCell className="w-10 py-3 pl-3 pr-4 align-middle text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon-sm" className="size-7 opacity-0 transition-opacity group-hover:opacity-100 ml-auto">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onViewInvoice(s)}>
                                <Eye className="mr-2 size-4" /> View Invoice
                              </DropdownMenuItem>
                              {s.balance_due > 0 && (
                                <DropdownMenuItem onClick={() => onRecordPayment(s)}>
                                  <CreditCard className="mr-2 size-4" /> Record Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(s)}
                                disabled={!canDelete}
                                className={cn(!canDelete && 'opacity-40 cursor-not-allowed')}
                              >
                                <Trash2 className="mr-2 size-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────────── */}
        {total > 0 && (
          <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-4 py-3 text-[13px] text-muted-foreground">
            <span>
              <strong className="font-medium text-foreground">{startRow}–{endRow}</strong>
              {' '}of{' '}
              <strong className="font-medium text-foreground">{total}</strong> sales
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
          sale={deleteTarget}
          deleting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
