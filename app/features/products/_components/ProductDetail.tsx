'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Package, Pencil, ShoppingCart, Building2,
} from 'lucide-react'
import type { Product, ProductSupplier, StockMovement } from './types'
import {
  getStockStatus, getProductMarginPct, getMarginColorClass, canReorder,
} from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function StockBadge({ product: p }: { product: Product }) {
  if (!p.track_inventory) {
    return <Badge variant="secondary" className="text-xs">Not tracked</Badge>
  }
  const status = getStockStatus(p)
  const map = {
    ok:  { label: `${p.current_stock} ${p.unit_name}`, variant: 'default' as const },
    low: { label: `${p.current_stock} ${p.unit_name} · Low`, variant: 'secondary' as const },
    out: { label: 'Out of stock', variant: 'destructive' as const },
  }
  return <Badge variant={map[status].variant} className="text-xs font-semibold">{map[status].label}</Badge>
}

interface Props {
  product: Product | null
  suppliers: ProductSupplier[]
  movements: StockMovement[]
  loading: boolean
  onEdit: () => void
  onReorder: () => void
}

export function ProductDetail({
  product, suppliers, movements, loading, onEdit, onReorder,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'suppliers' | 'movements'>('suppliers')

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground p-16">
        <Package className="size-10 opacity-20" />
        <p className="text-sm font-medium">Loading product…</p>
      </div>
    )
  }

  const margin = getProductMarginPct(product)
  const showReorder = canReorder(product)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-4 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center flex-wrap gap-2">
            {product.name}
            <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-[10px] font-semibold uppercase">
              {product.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {product.sku && <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku}</span>}
            {product.category && <span>{product.category}</span>}
            <span>GST {product.gst_rate}%</span>
            <StockBadge product={product} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showReorder && (
            <Button size="sm" variant="outline" onClick={onReorder} className="h-9">
              <ShoppingCart className="size-4 mr-2" /> Reorder
            </Button>
          )}
          <Button size="sm" onClick={onEdit} className="h-9">
            <Pencil className="size-4 mr-2" /> Edit Product
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Current Stock', value: product.track_inventory ? `${product.current_stock} ${product.unit_name}` : 'Not tracked' },
          { label: 'Cost Price', value: rupee(product.purchase_price) + ` / ${product.unit_name}` },
          { label: 'Selling Price', value: rupee(product.selling_price) + ` / ${product.unit_name}` },
          { label: 'Margin', value: margin === null ? '—' : `${margin.toFixed(1)}%`, cls: getMarginColorClass(margin) },
        ].map(({ label, value, cls }) => (
          <div key={label} className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">{label}</span>
            <div className={cn('text-lg font-bold tabular-nums', cls)}>{value}</div>
          </div>
        ))}
      </div>

      {product.has_box && product.box_name && (
        <div className="border rounded-lg p-3 bg-muted/30 text-xs text-muted-foreground shrink-0">
          Box packaging: {product.units_per_box} {product.unit_name} / {product.box_name}
          {product.box_purchase_price != null && ` · Cost ${rupee(product.box_purchase_price)} / ${product.box_name}`}
          {product.box_selling_price != null && ` · Sell ${rupee(product.box_selling_price)} / ${product.box_name}`}
        </div>
      )}

      {/* Tabs */}
      <div className="flex-1 min-h-0 border rounded-lg bg-card flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3 shrink-0 bg-muted/20">
          <Button
            variant={activeTab === 'suppliers' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('suppliers')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            <Building2 className="size-3.5 mr-1.5" />
            Suppliers ({suppliers.length})
          </Button>
          <Button
            variant={activeTab === 'movements' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('movements')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Stock Movements ({movements.length})
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4">
          {activeTab === 'suppliers' && (
            loading ? <TableSkeleton cols={3} /> : suppliers.length === 0 ? (
              <EmptyState message="No purchase history yet for this product." />
            ) : (
              <SuppliersTable
                suppliers={suppliers}
                unitName={product.unit_name}
                onViewSupplier={id => router.push(`/features/suppliers/${id}`)}
              />
            )
          )}
          {activeTab === 'movements' && (
            loading ? <TableSkeleton cols={3} /> : movements.length === 0 ? (
              <EmptyState message="No stock movements recorded yet." />
            ) : (
              <MovementsTable movements={movements} unitName={product.unit_name} />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SuppliersTable({
  suppliers, unitName, onViewSupplier,
}: {
  suppliers: ProductSupplier[]
  unitName: string
  onViewSupplier: (id: string) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Last Price Paid</TableHead>
          <TableHead>Last Purchase</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map(s => (
          <TableRow
            key={s.supplier_id}
            className="cursor-pointer hover:bg-muted/30"
            onClick={() => onViewSupplier(s.supplier_id)}
          >
            <TableCell className="font-medium text-sm">{s.supplier_name}</TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {rupee(s.last_unit_price)}<span className="text-xs text-muted-foreground"> / {unitName}</span>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{fmtDate(s.last_purchase_date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function MovementsTable({ movements, unitName }: { movements: StockMovement[]; unitName: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map(m => (
          <TableRow key={m.id}>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </TableCell>
            <TableCell className="text-xs capitalize">{m.movement_type.replace('_', ' ')}</TableCell>
            <TableCell className={cn(
              'text-right tabular-nums text-sm font-medium',
              m.quantity > 0 ? 'text-emerald-600' : 'text-red-600',
            )}>
              {m.quantity > 0 ? '+' : ''}{m.quantity} {unitName}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
