'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TableBody, TableCell, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  MoreHorizontal, Pencil, PowerOff, Power, Trash2, Copy, Check, Package, Search,
} from 'lucide-react'
import type { Product, SortField, SortDir, ProductFilters } from './types'
import { getStockStatus, ROWS_PER_PAGE } from './types'

// ── helpers ──────────────────────────────────────────────────────────────────

function rupee(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function StockBadge({ product: p }: { product: Product }) {
  if (!p.track_inventory) {
    return <span className="text-xs text-muted-foreground">Not tracked</span>
  }
  const status = getStockStatus(p)
  const map = {
    ok:  { label: `${p.current_stock} ${p.unit_name}`, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 font-semibold' },
    low: { label: `${p.current_stock} ${p.unit_name} · Low`, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 font-semibold' },
    out: { label: 'Out of stock', cls: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 font-semibold' },
  }
  return <Badge className={cn('text-xs', map[status].cls)}>{map[status].label}</Badge>
}

function SkuCell({ sku }: { sku: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!sku) return <span className="text-muted-foreground/40 text-xs">No SKU</span>
  function copy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(sku!)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} title="Copy SKU"
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
      {sku}
      {copied ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5 opacity-40" />}
    </button>
  )
}

// ── animated category pills ───────────────────────────────────────────────────

function CategoryPills({
  categories, selected, onSelect,
}: { categories: string[]; selected: string; onSelect: (cat: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [categories, checkScroll])

  const all = ['All', ...categories]

  return (
    <div className="relative flex items-center min-w-0">
      {/* Left fade */}
      <div
        aria-hidden
        className={cn(
          'absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none transition-opacity duration-200',
          'bg-gradient-to-r from-card to-transparent',
          canScrollLeft ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {all.map(cat => {
          const isActive = cat === 'All' ? !selected : selected === cat
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat === 'All' ? '' : cat)}
              className={cn(
                'shrink-0 px-3 h-7 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap',
                isActive
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
              )}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Right fade */}
      <div
        aria-hidden
        className={cn(
          'absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none transition-opacity duration-200',
          'bg-gradient-to-l from-card to-transparent',
          canScrollRight ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 7 }).map((_, i) => (
    <TableRow key={i} className="hover:bg-transparent border-b">
      {/* Product */}
      <TableCell className="py-3 pl-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      {/* Category */}
      <TableCell className="py-3"><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
      {/* Unit */}
      <TableCell className="py-3"><Skeleton className="h-4 w-14" /></TableCell>
      {/* Cost */}
      <TableCell className="py-3">
        <div className="flex flex-col gap-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-12" /></div>
      </TableCell>
      {/* Selling */}
      <TableCell className="py-3">
        <div className="flex flex-col gap-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-12" /></div>
      </TableCell>
      {/* Stock */}
      <TableCell className="py-3"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
      {/* Actions */}
      <TableCell className="w-10 py-3 pr-4"><Skeleton className="size-7 rounded-md" /></TableCell>
    </TableRow>
  ))
}

// ── delete confirm ─────────────────────────────────────────────────────────────

function DeleteDialog({ product, onConfirm, onClose }: {
  product: Product | null; onConfirm: () => void; onClose: () => void
}) {
  return (
    <Dialog open={!!product} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{product?.name}</strong>. Only allowed if the
            product has no transaction history and zero stock.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── props ──────────────────────────────────────────────────────────────────────

interface Props {
  products:         Product[]
  total:            number
  page:             number
  sortField:        SortField
  sortDir:          SortDir
  loading:          boolean
  filters:          ProductFilters
  categories:       string[]
  onSort:           (field: SortField) => void
  onPageChange:     (page: number) => void
  onSearchChange:   (value: string) => void
  onCategoryChange: (value: string) => void
  onEdit:           (product: Product) => void
  onViewDetail:     (product: Product) => void
  onToggleActive:   (product: Product) => void
  onDelete:         (product: Product) => Promise<boolean>
}

export function ProductTable({
  products, total, page, loading,
  filters, categories,
  onPageChange, onSearchChange, onCategoryChange,
  onEdit, onToggleActive, onDelete,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const totalPages = Math.ceil(total / ROWS_PER_PAGE)
  const from = (page - 1) * ROWS_PER_PAGE + 1
  const to   = Math.min(page * ROWS_PER_PAGE, total)

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await onDelete(deleteTarget)
    setDeleteTarget(null)
  }

  const isEmpty = !loading && products.length === 0

  return (
    <div className="flex flex-col gap-3 w-full h-full">

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card flex flex-col flex-1 min-h-0 [overflow:clip]">

        {/* ── Toolbar: search left, category pills right ─────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0">
          {/* Search */}
          <div className="relative w-[420px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              value={filters.search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search products…"
              className={cn(
                'w-full h-8 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm',
                'placeholder:text-muted-foreground/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
                'transition-colors',
              )}
            />
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 shrink-0" />

          {/* Category pills — scrollable, faded both sides */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <CategoryPills
              categories={categories}
              selected={filters.category}
              onSelect={onCategoryChange}
            />
          </div>
        </div>

        {/* ── Table body ─────────────────────────────────────────────────── */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center text-muted-foreground">
            <Package className="size-8 opacity-20" />
            <p className="text-sm font-medium text-foreground">No products found</p>
            <p className="text-xs">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 [scrollbar-width:thin]">
            <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
              <TableBody>
                {loading ? (
                  <TableSkeleton />
                ) : (
                  products.map(p => (
                    <TableRow
                      key={p.id}
                      className={cn(
                        'group border-b transition-colors hover:bg-muted/40',
                        !p.is_active && 'opacity-50',
                      )}
                    >
                      {/* Col 1: Product (Icon + Name + SKU) */}
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                            <Package className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium leading-snug">{p.name}</span>
                            <SkuCell sku={p.sku} />
                          </div>
                        </div>
                      </TableCell>

                      {/* Col 2: Category */}
                      <TableCell className="py-3">
                        {p.category ? (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                      </TableCell>

                      {/* Col 3: Unit */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-foreground/80">{p.unit_name}</span>
                          {p.has_box && p.box_name && p.units_per_box && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {p.units_per_box} / {p.box_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Col 4: Cost Price */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium tabular-nums text-muted-foreground">
                            {rupee(p.purchase_price)}
                            <span className="text-[10px] text-muted-foreground/50 font-normal"> / {p.unit_name}</span>
                          </span>
                          {p.has_box && p.box_purchase_price && p.box_name && (
                            <span className="text-xs text-muted-foreground/50 tabular-nums">
                              {rupee(p.box_purchase_price)}
                              <span className="text-[10px] font-normal"> / {p.box_name}</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Col 5: Selling Price */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold tabular-nums">
                            {rupee(p.selling_price)}
                            <span className="text-[10px] text-muted-foreground/50 font-normal"> / {p.unit_name}</span>
                          </span>
                          {p.has_box && p.box_selling_price && p.box_name && (
                            <span className="text-xs font-medium text-muted-foreground/80 tabular-nums">
                              {rupee(p.box_selling_price)}
                              <span className="text-[10px] font-normal"> / {p.box_name}</span>
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Col 6: Stock */}
                      <TableCell className="py-3">
                        <StockBadge product={p} />
                      </TableCell>

                      {/* Col 7: Actions */}
                      <TableCell className="w-10 py-3 pr-4" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(p)}>
                              <Pencil className="mr-2 size-4" /> Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleActive(p)}>
                              {p.is_active
                                ? <><PowerOff className="mr-2 size-4" /> Deactivate</>
                                : <><Power className="mr-2 size-4" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}>
                              <Trash2 className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1 shrink-0">
          <span>
            <strong className="text-foreground font-medium">{from}–{to}</strong> of{' '}
            <strong className="text-foreground font-medium">{total}</strong> products
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs"
              disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <span className="px-1.5 text-xs font-medium tabular-nums">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs"
              disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <DeleteDialog
        product={deleteTarget}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}