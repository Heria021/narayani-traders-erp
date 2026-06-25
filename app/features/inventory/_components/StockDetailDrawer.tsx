'use client'

import { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, Package, ArrowUpRight, ArrowDownLeft, Sliders, AlertTriangle } from 'lucide-react'
import type { InventoryItem, StockMovement, StockMovementType } from './types'
import { Button } from '@/components/ui/button'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

interface Props {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
  movements: StockMovement[]
  loading: boolean
  onViewPurchase?: (purchaseId: string) => void
  onViewInvoice?: (saleId: string) => void
}

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  adjustment: 'Adjustment',
  damage: 'Damage',
  opening_stock: 'Opening Stock',
}

export function StockDetailDrawer({
  open,
  onClose,
  item,
  movements,
  loading,
  onViewPurchase,
  onViewInvoice,
}: Props) {
  const [activeTab, setActiveTab] = useState<'all' | StockMovementType>('all')

  const filteredMovements = useMemo(() => {
    if (activeTab === 'all') return movements
    return movements.filter(m => m.movement_type === activeTab)
  }, [movements, activeTab])

  // Box equivalents calculation
  const boxBreakdown = useMemo(() => {
    if (!item || !item.has_box || !item.units_per_box) return null
    const qty = item.current_stock
    const upb = item.units_per_box
    const boxes = Math.floor(qty / upb)
    const loose = qty % upb
    return {
      boxes,
      loose,
      boxName: item.box_name || 'box',
      unitName: item.unit_name || 'unit',
    }
  }, [item])

  const statusBadge = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in_stock':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 uppercase text-[10px] font-bold tracking-wider">
            In Stock
          </Badge>
        )
      case 'low_stock':
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 uppercase text-[10px] font-bold tracking-wider">
            Low Stock
          </Badge>
        )
      case 'out_of_stock':
        return (
          <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 uppercase text-[10px] font-bold tracking-wider">
            Out Of Stock
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-0 uppercase text-[10px] font-bold tracking-wider">
            Untracked
          </Badge>
        )
    }
  }

  const movementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'purchase':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-medium flex items-center gap-1 w-fit">
            <ArrowUpRight className="size-3" /> PR
          </Badge>
        )
      case 'sale':
        return (
          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-0 text-[10px] font-medium flex items-center gap-1 w-fit">
            <ArrowDownLeft className="size-3" /> MR
          </Badge>
        )
      case 'damage':
        return (
          <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-0 text-[10px] font-medium flex items-center gap-1 w-fit">
            <AlertTriangle className="size-3" /> Damage
          </Badge>
        )
      case 'opening_stock':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-[10px] font-medium w-fit">
            Opening
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 text-[10px] font-medium flex items-center gap-1 w-fit">
            <Sliders className="size-3" /> Adj
          </Badge>
        )
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-background">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-lg">
                {loading || !item ? 'Stock Details' : item.name}
              </SheetTitle>
              {!loading && item && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.sku && <span>SKU: {item.sku}</span>}
                  {item.sku && item.category && <span>•</span>}
                  {item.category && <span>Category: {item.category}</span>}
                </div>
              )}
            </div>
            {!loading && item && statusBadge(item.status)}
          </div>
        </SheetHeader>

        {/* Content - Non-scrollable outer container to support full-height nested scroll */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {loading || !item ? (
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 [scrollbar-width:thin]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-8 w-48" />
              <div className="border rounded-lg p-2 space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 space-y-6">
              {/* Product Stock Summary Cards (shrink-0) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
                <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Stock</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {item.current_stock.toLocaleString('en-IN')} {item.unit_name}
                    </span>
                    {boxBreakdown && (
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {boxBreakdown.boxes} {boxBreakdown.boxName}{boxBreakdown.boxes !== 1 ? 'es' : ''} + {boxBreakdown.loose} {boxBreakdown.unitName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">PR (Purchase Rate)</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {rupee(item.unit_cost)}
                    </span>
                    {item.has_box && item.box_purchase_price && (
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        Box cost: {rupee(item.box_purchase_price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Stock Valuation</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {rupee(item.stock_value)}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      Based on Cost Price
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">MR (Market Rate)</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {rupee(item.selling_price)}
                    </span>
                    {item.has_box && item.box_selling_price && (
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        Box sell: {rupee(item.box_selling_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Movement History Section (flex-1 and overflow-hidden to stretch and hold table) */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stock Movement History</h3>
                  
                  {/* Movement Tabs */}
                  <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-0.5 rounded-lg border">
                    <Button
                      variant={activeTab === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('all')}
                      className="h-7 text-[11px] px-2.5 rounded-md font-medium"
                    >
                      All
                    </Button>
                    <Button
                      variant={activeTab === 'purchase' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('purchase')}
                      className="h-7 text-[11px] px-2.5 rounded-md font-medium"
                    >
                      PR (Purchases)
                    </Button>
                    <Button
                      variant={activeTab === 'sale' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('sale')}
                      className="h-7 text-[11px] px-2.5 rounded-md font-medium"
                    >
                      MR (Sales)
                    </Button>
                    <Button
                      variant={activeTab === 'adjustment' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('adjustment')}
                      className="h-7 text-[11px] px-2.5 rounded-md font-medium"
                    >
                      Adjs
                    </Button>
                    <Button
                      variant={activeTab === 'damage' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('damage')}
                      className="h-7 text-[11px] px-2.5 rounded-md font-medium"
                    >
                      Damages
                    </Button>
                  </div>
                </div>

                {/* Scrollable Table Viewport */}
                <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-card [scrollbar-width:thin]">
                  <Table className="relative w-full">
                    <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-xs">
                      <TableRow>
                        <TableHead className="pl-4 py-2">Date & Time</TableHead>
                        <TableHead className="py-2">Type</TableHead>
                        <TableHead className="text-right py-2">Qty</TableHead>
                        <TableHead className="py-2 text-center">Reference</TableHead>
                        <TableHead className="text-right pr-4 py-2">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.length === 0 ? (
                        <TableRow>
                          <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground italic">
                            No movements found for this selection.
                          </td>
                        </TableRow>
                      ) : (
                        filteredMovements.map((mov) => {
                          const isNegative = ['sale', 'damage'].includes(mov.movement_type) || (mov.movement_type === 'adjustment' && mov.quantity < 0)
                          const qtyStr = `${isNegative ? '' : '+'}${mov.quantity.toLocaleString('en-IN')}`
                          
                          return (
                            <TableRow key={mov.id} className="hover:bg-muted/5">
                              <TableCell className="pl-4 py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-foreground">{fmtDate(mov.created_at)}</span>
                                  <span className="text-[10px] text-muted-foreground">{fmtTime(mov.created_at)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                {movementBadge(mov.movement_type)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold tabular-nums text-xs py-2.5 ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {qtyStr}
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                {mov.reference_id ? (
                                  mov.movement_type === 'purchase' && onViewPurchase ? (
                                    <button
                                      onClick={() => onViewPurchase(mov.reference_id!)}
                                      className="text-xs font-mono font-bold text-violet-600 hover:text-violet-800 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
                                    >
                                      {mov.reference_name || 'View Purchase'}
                                    </button>
                                  ) : mov.movement_type === 'sale' && onViewInvoice ? (
                                    <button
                                      onClick={() => onViewInvoice(mov.reference_id!)}
                                      className="text-xs font-mono font-bold text-sky-600 hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
                                    >
                                      {mov.reference_name || 'View Invoice'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {mov.reference_name || mov.reference_id.slice(0, 8)}
                                    </span>
                                  )
                                ) : mov.notes ? (
                                  <span className="text-xs text-muted-foreground italic truncate max-w-[120px] inline-block" title={mov.notes}>
                                    {mov.notes}
                                  </span>
                                ) : (
                                  <span className="text-neutral-300 dark:text-neutral-700">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums text-xs pr-4 py-2.5 text-foreground/80">
                                {mov.balanceAfter !== undefined ? `${mov.balanceAfter.toLocaleString('en-IN')} ${item.unit_name}` : '—'}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

