'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search, ChevronUp, ChevronDown, Eye, Trash2,
  ChevronsUpDown, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Purchase, PurchaseFilters, SortField, SortDir } from './types'
import { ROWS_PER_PAGE } from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── component props ──────────────────────────────────────────────────────────

interface Props {
  purchases:     Purchase[]
  total:         number
  page:          number
  sortField:     SortField
  sortDir:       SortDir
  filters:       PurchaseFilters
  loading:       boolean
  onSort:        (field: SortField) => void
  onPageChange:  (page: number) => void
  onSearch:      (v: string) => void
  onDateRange:   (range: PurchaseFilters['dateRange'], from?: string, to?: string) => void
  onView:        (purchase: Purchase) => void
  onDelete:      (purchase: Purchase) => Promise<boolean>
}

// ─── sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown className="size-3 text-muted-foreground/40" />
  return dir === 'desc'
    ? <ChevronDown className="size-3 text-foreground" />
    : <ChevronUp   className="size-3 text-foreground" />
}

// ─── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border/40">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// ─── delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  purchase, onConfirm, onCancel,
}: { purchase: Purchase; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {purchase.purchase_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will <strong>reverse stock</strong> for all {purchase.item_count ?? 0} products in this purchase.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white">
            Yes, delete
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
  const [deleteTarget,  setDeleteTarget]  = useState<Purchase | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [customFrom,    setCustomFrom]    = useState('')
  const [customTo,      setCustomTo]      = useState('')
  const [showCustom,    setShowCustom]    = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  const startRow   = (page - 1) * ROWS_PER_PAGE + 1
  const endRow     = Math.min(page * ROWS_PER_PAGE, total)

  function handleDateFilter(val: PurchaseFilters['dateRange']) {
    if (val === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onDateRange(val)
    }
  }

  function applyCustomRange() {
    onDateRange('custom', customFrom, customTo)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await onDelete(deleteTarget)
    setDeleting(false)
    setDeleteTarget(null)
  }

  // sortable header cell
  function Th({
    label, field, className = '',
  }: { label: string; field?: SortField; className?: string }) {
    if (!field) return <th className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground ${className}`}>{label}</th>
    return (
      <th
        className={cn('px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors', className)}
        onClick={() => onSort(field)}>
        <div className="flex items-center gap-1">
          {label}
          <SortIcon field={field} current={sortField} dir={sortDir} />
        </div>
      </th>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-6 py-3 shrink-0 border-b border-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60 pointer-events-none" />
            <Input
              value={filters.search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search PO number or supplier…"
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
            <Select
              value={filters.dateRange}
              onValueChange={v => handleDateFilter(v as PurchaseFilters['dateRange'])}>
              <SelectTrigger className="h-9 text-sm w-36 border-border/60">
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

        {/* Custom date inputs */}
        {showCustom && (
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="h-8 text-xs w-36" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="h-8 text-xs w-36" />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={applyCustomRange}>
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto [scrollbar-width:thin]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm border-b border-border/60">
            <tr>
              <Th label="Purchase No." />
              <Th label="Date"         field="purchase_date" />
              <Th label="Supplier"     field="supplier_name" />
              <Th label="Items"        className="text-right" />
              <Th label="Subtotal"     className="text-right" />
              <Th label="Tax"          className="text-right" />
              <Th label="Discount"     className="text-right" />
              <Th label="Grand Total"  field="grand_total" className="text-right" />
              <Th label=""             className="w-20" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {filters.search || filters.dateRange !== 'all'
                        ? 'No purchases match your search'
                        : 'No purchases yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filters.search
                        ? 'Try a different search term.'
                        : filters.dateRange !== 'all'
                        ? 'No purchases in this period.'
                        : 'Record your first purchase to start tracking stock.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors group"
                  onClick={() => onView(p)}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-foreground">{p.purchase_number}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(p.purchase_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400">
                          {p.supplier_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground truncate max-w-36">{p.supplier_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className="text-xs">
                      {p.item_count ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {rupee(p.subtotal)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    {rupee(p.tax_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">
                    {p.discount_amount > 0
                      ? <span className="text-emerald-600 dark:text-emerald-400">−{rupee(p.discount_amount)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm tabular-nums font-semibold text-foreground">{rupee(p.grand_total)}</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button
                        type="button"
                        onClick={() => onView(p)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-6 py-3 shrink-0 border-t border-border/60">
          <p className="text-xs text-muted-foreground">
            Showing {startRow}–{endRow} of {total} purchases
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs"
              disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs"
              disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete confirm dialog ────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          purchase={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
