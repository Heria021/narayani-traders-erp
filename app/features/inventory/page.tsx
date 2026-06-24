'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Search,
  IndianRupee,
  Boxes,
  AlertTriangle,
  Package,
  ArrowUpDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

// Import hook & components
import { useInventory } from './_components/useInventory'
import { StockDetailDrawer } from './_components/StockDetailDrawer'
import { PurchaseDetail } from '../purchases/_components/PurchaseDetail'
import { InvoiceDetailSheet } from '../customers/_components/InvoiceDetailSheet'
import type { InventoryItem, SortField } from './_components/types'
import type { PurchaseWithItems } from '../purchases/_components/types'
import type { SaleWithItems } from '../sales/_components/types'
import { cn } from '@/lib/utils'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const rupeeDecimals = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function InventoryPage() {
  const router = useRouter()
  const supabase = createClient()

  // ── Master inventory hook state ──
  const {
    allInventoryItems,
    filteredItems,
    categories,
    kpis,
    loading,
    filters,
    sortField,
    sortDir,
    selectedProductId,
    selectedItem,
    movements,
    drawerLoading,
    setSelectedProductId,
    changeFilter,
    setSortField,
    setSortDir,
    refresh,
  } = useInventory()

  // ── Sub-drawer states ──
  const [detailOpen, setDetailOpen] = useState(false)

  // ── Purchase detail sheet states ──
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
  const [purchaseDetail, setPurchaseDetail] = useState<PurchaseWithItems | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  // ── Invoice/sale detail sheet states ──
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [invoiceDetail, setInvoiceDetail] = useState<SaleWithItems | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  // ── Fetch single purchase detail on demand ──
  useEffect(() => {
    if (!selectedPurchaseId) {
      setPurchaseDetail(null)
      return
    }
    const loadPurchase = async () => {
      setPurchaseLoading(true)
      try {
        const [
          { data: purchase, error: pErr },
          { data: items, error: iErr },
        ] = await Promise.all([
          supabase
            .from('purchases')
            .select('*, suppliers!inner(name)')
            .eq('id', selectedPurchaseId)
            .single(),
          supabase
            .from('purchase_items')
            .select('*, products!inner(name, unit_name)')
            .eq('purchase_id', selectedPurchaseId)
            .order('id'),
        ])

        if (pErr || !purchase) {
          console.error(pErr || 'No purchase found')
          return
        }

        const enrichedItems = (items ?? []).map((i: any) => ({
          id: i.id,
          purchase_id: i.purchase_id,
          product_id: i.product_id,
          product_name: i.products?.name ?? '—',
          unit_name: i.products?.unit_name ?? 'unit',
          buy_mode: i.buy_mode,
          box_count: i.box_count,
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax_rate: i.tax_rate,
          line_total: i.line_total,
        }))

        const p = purchase as any
        setPurchaseDetail({
          id: p.id,
          supplier_id: p.supplier_id,
          supplier_name: p.suppliers?.name ?? '—',
          purchase_number: p.purchase_number,
          purchase_date: p.purchase_date,
          subtotal: p.subtotal,
          tax_amount: p.tax_amount,
          discount_amount: p.discount_amount,
          grand_total: p.grand_total,
          notes: p.notes,
          created_at: p.created_at,
          items: enrichedItems,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setPurchaseLoading(false)
      }
    }
    loadPurchase()
  }, [selectedPurchaseId, supabase])

  // ── Fetch single invoice detail on demand ──
  useEffect(() => {
    if (!selectedInvoiceId) {
      setInvoiceDetail(null)
      return
    }
    const loadInvoice = async () => {
      setInvoiceLoading(true)
      try {
        const [
          { data: sale, error: sErr },
          { data: items, error: iErr },
          { data: paymentsData, error: pErr },
        ] = await Promise.all([
          supabase
            .from('sales')
            .select('*, customers(name, phone)')
            .eq('id', selectedInvoiceId)
            .single(),
          supabase
            .from('sale_items')
            .select('*, products(name, unit_name, box_name, units_per_box)')
            .eq('sale_id', selectedInvoiceId)
            .order('id'),
          supabase
            .from('payments')
            .select('*')
            .eq('sale_id', selectedInvoiceId)
            .order('created_at'),
        ])

        if (sErr || !sale) {
          console.error(sErr || 'No sale found')
          return
        }

        const enrichedItems = (items ?? []).map((i: any) => ({
          id: i.id,
          sale_id: i.sale_id,
          product_id: i.product_id,
          product_name: i.products?.name ?? '—',
          unit_name: i.products?.unit_name ?? 'unit',
          box_name: i.products?.box_name ?? null,
          units_per_box: i.products?.units_per_box ?? null,
          sell_mode: i.sell_mode,
          box_count: i.box_count,
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax_rate: i.tax_rate,
          line_total: i.line_total,
        }))

        const enrichedPayments = (paymentsData ?? []).map((p: any) => ({
          id: p.id,
          sale_id: p.sale_id,
          customer_id: p.customer_id,
          amount: p.amount,
          payment_method: p.payment_method,
          reference_number: p.reference_number,
          payment_date: p.payment_date,
          note: p.note,
          created_at: p.created_at,
        }))

        const s = sale as any
        setInvoiceDetail({
          ...s,
          customer_name: s.customers?.name ?? 'Unknown',
          customer_phone: s.customers?.phone ?? undefined,
          items: enrichedItems,
          payments: enrichedPayments,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setInvoiceLoading(false)
      }
    }
    loadInvoice()
  }, [selectedInvoiceId, supabase])

  // Sorting columns helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'name' ? 'asc' : 'desc')
    }
  }

  const renderSortHeader = (label: string, field: SortField, className?: string) => {
    const isSorted = sortField === field
    return (
      <TableHead
        className={cn("py-2.5 font-semibold text-xs cursor-pointer select-none group transition-colors hover:text-foreground", className)}
        onClick={(e) => {
          e.stopPropagation()
          handleSort(field)
        }}
      >
        <div className={cn("flex items-center gap-1", className?.includes("text-right") && "justify-end")}>
          {label}
          <ArrowUpDown className={cn("size-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0", isSorted && "text-foreground font-bold")} />
        </div>
      </TableHead>
    )
  }

  // Row selection handler
  const handleRowClick = (productId: string) => {
    setSelectedProductId(productId)
    setDetailOpen(true)
  }

  // Preview triggers for other details from references
  const showPurchase = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId)
    setPurchaseOpen(true)
  }

  const showInvoice = (saleId: string) => {
    setSelectedInvoiceId(saleId)
    setInvoiceOpen(true)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
      
      {/* ── Header shrink-0 ── */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Inventory
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => refresh()}
                title="Refresh Inventory"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              </Button>
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg">
              Read-only intelligence layer. Stock quantities update automatically from purchases and sales.
            </p>
          </div>
        </div>

        {/* ── KPIs Strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1 — Total Valuation (Accent Primary) */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-emerald-800/80 dark:text-emerald-400/80 uppercase">
                Stock Valuation
              </span>
              <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                <IndianRupee className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-200">
                {loading ? <Skeleton className="h-8 w-28" /> : rupee(kpis.total_value)}
              </div>
              <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/60 block font-medium">
                Combined cost valuation of all SKUs
              </span>
            </div>
          </div>

          {/* Card 2 — Tracked SKUs */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Tracked SKUs
              </span>
              <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Boxes className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {loading ? <Skeleton className="h-8 w-14" /> : kpis.total_skus}
              </div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Active tracked products
              </span>
            </div>
          </div>

          {/* Card 3 — Low Stock (Amber Alert highlight if > 0) */}
          <div className={cn(
            "rounded-xl border p-4 space-y-2 transition-colors",
            !loading && kpis.low_stock > 0
              ? "border-amber-100 dark:border-amber-950/40 bg-amber-50/10 dark:bg-amber-950/5"
              : "bg-card"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Low Stock SKUs
              </span>
              <div className={cn(
                "size-7 rounded-lg flex items-center justify-center shrink-0",
                !loading && kpis.low_stock > 0
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className={cn(
                "text-2xl font-bold tracking-tight",
                !loading && kpis.low_stock > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground"
              )}>
                {loading ? <Skeleton className="h-8 w-14" /> : kpis.low_stock}
              </div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Stock is at or below threshold
              </span>
            </div>
          </div>

          {/* Card 4 — Out of Stock (Red Alert highlight if > 0) */}
          <div className={cn(
            "rounded-xl border p-4 space-y-2 transition-colors",
            !loading && kpis.out_of_stock > 0
              ? "border-red-100 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5"
              : "bg-card"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Out of Stock SKUs
              </span>
              <div className={cn(
                "size-7 rounded-lg flex items-center justify-center shrink-0",
                !loading && kpis.out_of_stock > 0
                  ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              )}>
                <Package className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className={cn(
                "text-2xl font-bold tracking-tight",
                !loading && kpis.out_of_stock > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
              )}>
                {loading ? <Skeleton className="h-8 w-14" /> : kpis.out_of_stock}
              </div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Stock balance is zero
              </span>
            </div>
          </div>

        </div>

        {/* ── Filters and Controls Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1.5 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="text"
                placeholder="Search products, SKU..."
                value={filters.search}
                onChange={(e) => changeFilter('search', e.target.value)}
                className="pl-9 h-9 w-full rounded-lg shadow-none"
              />
            </div>

            {/* Category Dropdown */}
            <NativeSelect
              value={filters.category}
              onChange={(e) => changeFilter('category', e.target.value)}
              className="w-full sm:w-[180px] rounded-lg shadow-none"
            >
              <NativeSelectOption value="all">All Categories</NativeSelectOption>
              {categories.map((c) => (
                <NativeSelectOption key={c} value={c}>
                  {c}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-0.5 rounded-lg border w-fit shrink-0">
            <Button
              variant={filters.status === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => changeFilter('status', 'all')}
              className="h-7 text-[11px] px-2.5 rounded-md font-medium"
            >
              All Tracked
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 h-4 text-[9px] font-mono leading-none">{kpis.total_skus}</Badge>
            </Button>
            <Button
              variant={filters.status === 'in_stock' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => changeFilter('status', 'in_stock')}
              className="h-7 text-[11px] px-2.5 rounded-md font-medium"
            >
              In Stock
              <Badge className="ml-1.5 px-1 py-0 h-4 text-[9px] font-mono leading-none bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">{kpis.in_stock}</Badge>
            </Button>
            <Button
              variant={filters.status === 'low_stock' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => changeFilter('status', 'low_stock')}
              className="h-7 text-[11px] px-2.5 rounded-md font-medium"
            >
              Low Stock
              <Badge className="ml-1.5 px-1 py-0 h-4 text-[9px] font-mono leading-none bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0">{kpis.low_stock}</Badge>
            </Button>
            <Button
              variant={filters.status === 'out_of_stock' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => changeFilter('status', 'out_of_stock')}
              className="h-7 text-[11px] px-2.5 rounded-md font-medium"
            >
              Out of Stock
              <Badge className="ml-1.5 px-1 py-0 h-4 text-[9px] font-mono leading-none bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0">{kpis.out_of_stock}</Badge>
            </Button>
            <Button
              variant={filters.status === 'untracked' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => changeFilter('status', 'untracked')}
              className="h-7 text-[11px] px-2.5 rounded-md font-medium"
            >
              Untracked
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 h-4 text-[9px] font-mono leading-none">
                {allInventoryItems.filter(i => !i.track_inventory).length}
              </Badge>
            </Button>
          </div>
        </div>

      </div>

      {/* ── Main Scrollable Table Area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] border rounded-xl bg-card">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-1.5">
            <Package className="size-8 opacity-20" />
            <p className="text-sm font-medium">No inventory items match the current filters.</p>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/40 sticky top-0 backdrop-blur-xs z-10">
              <TableRow className="hover:bg-transparent">
                {renderSortHeader('Product Details', 'name', 'pl-4 w-[28%]')}
                
                {filters.status === 'low_stock' ? (
                  <>
                    {renderSortHeader('Stock Level', 'current_stock', 'text-right w-[15%]')}
                    <TableHead className="py-2.5 font-semibold text-xs text-right w-[12%]">Shortage</TableHead>
                    <TableHead className="py-2.5 font-semibold text-xs w-[25%] pl-8">Last Purchase PO</TableHead>
                    <TableHead className="py-2.5 font-semibold text-xs text-right w-[20%] pr-4">Action</TableHead>
                  </>
                ) : filters.status === 'out_of_stock' ? (
                  <>
                    <TableHead className="py-2.5 font-semibold text-xs w-[22%]">Last Sold Invoice</TableHead>
                    <TableHead className="py-2.5 font-semibold text-xs w-[22%]">Last Restocked PO</TableHead>
                    <TableHead className="py-2.5 font-semibold text-xs text-right w-[28%] pr-4">Action</TableHead>
                  </>
                ) : (
                  <>
                    {renderSortHeader('Status', 'status', 'w-[12%]')}
                    {renderSortHeader('Current Stock', 'current_stock', 'text-right w-[15%]')}
                    <TableHead className="py-2.5 font-semibold text-xs text-right w-[13%]">Unit Cost</TableHead>
                    {renderSortHeader('Valuation', 'stock_value', 'text-right w-[15%]')}
                    {renderSortHeader('Last Movement', 'last_movement_date', 'text-right pr-4 w-[17%]')}
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((p) => {
                const isUntracked = !p.track_inventory
                
                // Determine alert border styles
                let rowAlertBorder = "border-l-4 border-l-transparent"
                if (p.track_inventory) {
                  if (p.status === 'out_of_stock') rowAlertBorder = "border-l-4 border-l-red-500 dark:border-l-red-600"
                  else if (p.status === 'low_stock') rowAlertBorder = "border-l-4 border-l-amber-500 dark:border-l-amber-600"
                }

                // Box equivalents breakdown text
                let boxText = ""
                if (p.has_box && p.units_per_box) {
                  const boxes = Math.floor(p.current_stock / p.units_per_box)
                  const loose = p.current_stock % p.units_per_box
                  boxText = `${boxes} ${p.box_name || 'box'}${boxes !== 1 ? 'es' : ''} + ${loose} ${p.unit_name}`
                }

                return (
                  <TableRow
                    key={p.id}
                    onClick={() => handleRowClick(p.id)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30 transition-colors group",
                      rowAlertBorder,
                      isUntracked && "opacity-60 hover:opacity-100 transition-opacity"
                    )}
                  >
                    {/* Column 1: Details */}
                    <TableCell className="pl-4 py-3">
                      <div className="flex flex-col max-w-[280px]">
                        <span className="font-semibold text-foreground text-sm group-hover:text-primary leading-tight transition-colors">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground leading-none">
                          {p.sku && <span className="font-mono bg-muted/60 px-1 rounded font-medium">SKU: {p.sku}</span>}
                          {p.category && (
                            <span className="bg-muted/60 px-1 rounded font-medium truncate max-w-[120px]">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Low Stock Columns */}
                    {filters.status === 'low_stock' && (
                      <>
                        <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-xs">
                          <div className="flex flex-col items-end">
                            <span>{p.current_stock.toLocaleString('en-IN')} {p.unit_name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">Min: {p.minimum_stock}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3 align-middle font-semibold tabular-nums text-xs text-amber-600 dark:text-amber-500">
                          {p.shortage ? `${p.shortage.toLocaleString('en-IN')} ${p.unit_name}` : '—'}
                        </TableCell>
                        <TableCell className="py-3 align-middle pl-8">
                          {p.last_purchase_number && p.last_purchase_id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                showPurchase(p.last_purchase_id!)
                              }}
                              className="text-xs font-mono font-bold text-violet-600 hover:text-violet-800 hover:underline dark:text-violet-400 dark:hover:text-violet-300 block text-left"
                            >
                              {p.last_purchase_number}
                              {p.last_purchase_date && (
                                <span className="text-[10px] text-muted-foreground block font-sans font-normal mt-0.5">
                                  {fmtDate(p.last_purchase_date)}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No record</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3 align-middle">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/features/purchases/new?product_id=${p.id}${p.suggested_supplier_id ? `&supplier_id=${p.suggested_supplier_id}` : ''}`)
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 shadow-none"
                          >
                            Restock
                            <ChevronRight className="size-3" />
                          </Button>
                        </TableCell>
                      </>
                    )}

                    {/* Out of Stock Columns */}
                    {filters.status === 'out_of_stock' && (
                      <>
                        <TableCell className="py-3 align-middle">
                          {p.last_sold_number && p.last_sold_id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                showInvoice(p.last_sold_id!)
                              }}
                              className="text-xs font-mono font-bold text-sky-600 hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300 block text-left"
                            >
                              {p.last_sold_number}
                              {p.last_sold_date && (
                                <span className="text-[10px] text-muted-foreground block font-sans font-normal mt-0.5">
                                  {fmtDate(p.last_sold_date)}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No sales recorded</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 align-middle">
                          {p.last_restocked_number && p.last_restocked_id ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                showPurchase(p.last_restocked_id!)
                              }}
                              className="text-xs font-mono font-bold text-violet-600 hover:text-violet-800 hover:underline dark:text-violet-400 dark:hover:text-violet-300 block text-left"
                            >
                              {p.last_restocked_number}
                              {p.last_restocked_date && (
                                <span className="text-[10px] text-muted-foreground block font-sans font-normal mt-0.5">
                                  {fmtDate(p.last_restocked_date)}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No purchases recorded</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4 py-3 align-middle">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/features/purchases/new?product_id=${p.id}${p.suggested_supplier_id ? `&supplier_id=${p.suggested_supplier_id}` : ''}`)
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 shadow-none"
                          >
                            Restock
                            <ChevronRight className="size-3" />
                          </Button>
                        </TableCell>
                      </>
                    )}

                    {/* Default View Columns */}
                    {filters.status !== 'low_stock' && filters.status !== 'out_of_stock' && (
                      <>
                        <TableCell className="py-3 align-middle">
                          {isUntracked ? (
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-0 leading-none py-1.5 px-2">
                              Untracked
                            </Badge>
                          ) : p.status === 'out_of_stock' ? (
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 leading-none py-1.5 px-2">
                              Out of Stock
                            </Badge>
                          ) : p.status === 'low_stock' ? (
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 leading-none py-1.5 px-2">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 leading-none py-1.5 px-2">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-xs">
                          <div className="flex flex-col items-end">
                            <span>{p.current_stock.toLocaleString('en-IN')} {p.unit_name}</span>
                            {boxText && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 leading-none font-sans font-normal">
                                {boxText}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-3 align-middle font-medium tabular-nums text-xs text-muted-foreground/80">
                          {rupeeDecimals(p.unit_cost)}
                        </TableCell>

                        <TableCell className="text-right py-3 align-middle font-bold tabular-nums text-xs text-foreground/90">
                          {rupee(p.stock_value)}
                        </TableCell>

                        <TableCell className="text-right pr-4 py-3 align-middle font-medium text-xs text-muted-foreground">
                          {p.last_movement_date ? fmtDate(p.last_movement_date) : 'No movements'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Drawer 1: Stock Details ── */}
      <StockDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedProductId(null)
        }}
        item={selectedItem}
        movements={movements}
        loading={drawerLoading}
        onViewPurchase={(purchaseId) => {
          // Keep detailOpen true if you want to support closing back,
          // or close detailOpen, then open purchase
          showPurchase(purchaseId)
        }}
        onViewInvoice={(saleId) => {
          showInvoice(saleId)
        }}
      />

      {/* ── Drawer 2: Purchase Detail Sheet (Reused) ── */}
      <PurchaseDetail
        open={purchaseOpen}
        purchase={purchaseDetail}
        loading={purchaseLoading}
        onClose={() => {
          setPurchaseOpen(false)
          setSelectedPurchaseId(null)
        }}
      />

      {/* ── Drawer 3: Invoice Detail Sheet (Reused) ── */}
      {invoiceOpen && invoiceDetail && (
        <InvoiceDetailSheet
          open={invoiceOpen}
          sale={invoiceDetail}
          onClose={() => {
            setInvoiceOpen(false)
            setSelectedInvoiceId(null)
          }}
        />
      )}

    </div>
  )
}

// Small correction helper to prevent React hydration issues
const Body = TableBody
