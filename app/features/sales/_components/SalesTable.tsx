'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  CalendarDays, ShoppingBag, MoreHorizontal, Eye, Trash2, CreditCard,
  Filter,
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

// ─── sort icon ────────────────────────────────────────────────────────────────

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
  if (!field) return <TableHead className={className}>{label}</TableHead>
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        onClick={() => onSort(field)}
      >
        {label}
        <SortIcon field={field} current={current} dir={dir} />
      </button>
    </TableHead>
  )
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

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow className="border-b border-border/40 hover:bg-transparent">
      <TableCell className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28 font-mono" /></TableCell>
      <TableCell className="px-3 py-3"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-5 w-14 rounded-full" /></TableCell>
      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
      <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-5 w-16 rounded-full" /></TableCell>
      <TableCell className="py-3 pl-3 pr-4"><Skeleton className="size-7 rounded-md" /></TableCell>
    </TableRow>
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
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">

        {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative min-w-0 shrink-0 sm:w-[min(380px,42vw)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
            <Input
              value={filters.search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search bill no. or customer…"
              className="h-8 pl-8"
            />
          </div>

          <div className="hidden h-5 w-px shrink-0 bg-border/60 sm:block" />

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground/60 shrink-0" />
            <Select
              value={filters.status}
              onValueChange={v => onStatusChange(v as SaleFilters['status'])}
            >
              <SelectTrigger className="h-8 w-32 rounded-lg border-border/60 text-xs">
                <span>
                  {statusOptions.find(o => o.value === filters.status)?.label}
                </span>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-muted-foreground/60 shrink-0" />
            <Select
              value={filters.dateRange}
              onValueChange={v => handleDateFilter(v as SaleFilters['dateRange'])}
            >
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

        {/* ── Empty state ───────────────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
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
            <Table className="w-full min-w-[980px] border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  {/* Customer */}
                  <TableHead className="pl-4 pr-3 text-xs font-medium text-muted-foreground">
                    Customer
                  </TableHead>
                  {/* Bill No. */}
                  <TableHead className="px-3 text-xs font-medium text-muted-foreground">
                    Bill No.
                  </TableHead>
                  {/* Date */}
                  <SortableHeader label="Date"        field="sale_date"   current={sortField} dir={sortDir} onSort={onSort} />
                  {/* Items */}
                  <TableHead className="px-3 text-xs font-medium text-muted-foreground text-right">
                    Items
                  </TableHead>
                  {/* Grand Total */}
                  <SortableHeader label="Grand Total" field="grand_total" current={sortField} dir={sortDir} className="text-right" onSort={onSort} />
                  {/* Paid */}
                  <TableHead className="px-3 text-xs font-medium text-muted-foreground text-right">
                    Paid
                  </TableHead>
                  {/* Balance */}
                  <SortableHeader label="Balance"     field="balance_due" current={sortField} dir={sortDir} className="text-right" onSort={onSort} />
                  {/* Status */}
                  <TableHead className="px-3 text-xs font-medium text-muted-foreground text-right">
                    Status
                  </TableHead>
                  {/* Actions */}
                  <TableHead className="w-10 px-3 pr-4" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : sales.map(s => {
                    const canDelete = s.sale_date === today() && s.amount_paid === 0
                    return (
                      <TableRow
                        key={s.id}
                        className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/40"
                        onClick={() => onViewInvoice(s)}
                      >
                        {/* Customer */}
                        <TableCell className="py-3 pl-4 pr-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                              {s.customer_name === 'Walk-in'
                                ? '?'
                                : s.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[160px] truncate text-sm font-medium text-foreground leading-snug">
                                {s.customer_name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {fmtDate(s.sale_date)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Bill No. */}
                        <TableCell className="px-3 py-3 align-middle">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {s.invoice_number}
                          </span>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="px-3 py-3 align-middle text-sm text-muted-foreground whitespace-nowrap">
                          {fmtDate(s.sale_date)}
                        </TableCell>

                        {/* Items */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <Badge variant="outline" className="font-medium tabular-nums text-xs">
                            {s.item_count ?? 0}
                          </Badge>
                        </TableCell>

                        {/* Grand Total */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <span className="text-sm tabular-nums font-semibold text-foreground">
                            {rupee(s.grand_total)}
                          </span>
                        </TableCell>

                        {/* Paid */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <span className="text-sm tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                            {rupee2(s.amount_paid)}
                          </span>
                        </TableCell>

                        {/* Balance */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          {s.balance_due > 0 ? (
                            <span className="text-sm tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                              {rupee2(s.balance_due)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground/40">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-3 py-3 text-right align-middle">
                          <StatusBadge status={s.payment_status} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="w-10 py-3 pl-3 pr-4 align-middle" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon-sm" className="size-7 opacity-0 transition-opacity group-hover:opacity-100">
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
                }
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
