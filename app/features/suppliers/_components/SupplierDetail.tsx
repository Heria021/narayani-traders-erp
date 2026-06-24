'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone, Mail, MapPin, Building2,
  Pencil, Trash2, MoreHorizontal,
} from 'lucide-react'
import type { SupplierWithStats, Purchase, SupplierProduct } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })

interface Props {
  supplier:         SupplierWithStats | null
  purchases:        Purchase[]
  supplierProducts: SupplierProduct[]
  loading:          boolean
  onEdit:           () => void
  onDelete:         () => void
  onViewPurchase:   (purchaseId: string) => void
}

export function SupplierDetail({ supplier, purchases, supplierProducts, loading, onEdit, onDelete, onViewPurchase }: Props) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'products'>('purchases')

  if (!supplier) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center gap-3 text-muted-foreground p-16">
        <Building2 className="size-10 opacity-20" />
        <p className="text-sm font-medium">Select a supplier to view details</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-4 pt-6 bg-background">
      
      {/* ── Page Header (Sticky) ── */}
      <div className="flex flex-col gap-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center flex-wrap gap-2 text-neutral-900 dark:text-white">
              {supplier.name}
            </h1>
            
            {/* Contact details row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5 text-muted-foreground/50" />
                  {supplier.phone}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-muted-foreground/50" />
                  {supplier.email}
                </span>
              )}
              {(supplier.city || supplier.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground/50" />
                  {[supplier.city, supplier.state, supplier.postal_code].filter(Boolean).join(', ')}
                </span>
              )}
              {supplier.gstin && (
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground font-medium">
                  GSTIN: {supplier.gstin}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit} className="h-9 px-4 text-sm font-medium">
              <Pencil className="size-4 mr-2" /> Edit Profile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="icon" className="size-9 rounded-lg">
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                </Button>
              } />
              <DropdownMenuContent className="w-[200px]" align="end">
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4 mr-2" /> Delete Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Metric KPIs Dashboard Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Opening Balance', value: supplier.opening_balance, desc: 'Owed balance at setup', cls: '' },
          { label: 'Total Purchased', value: supplier.total_purchased, desc: 'Sum of all supplier bills', cls: '' },
          {
            label: 'Amount Owed',
            value: supplier.amount_owed,
            desc: 'Current outstanding balance',
            cls: supplier.amount_owed > 0
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-emerald-600 dark:text-emerald-400 font-bold',
          },
        ].map(({ label, value, desc, cls }) => (
          <div key={label} className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              {label}
            </span>
            <div className={cn("text-xl font-bold tracking-tight tabular-nums", cls)}>
              {rupee(value)}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              {desc}
            </span>
          </div>
        ))}
      </div>

      {/* ── Bottom Section: Purchases & Products Card ── */}
      <div className="flex-1 min-h-0 border rounded-lg bg-card flex flex-col overflow-hidden">
        {/* Custom Tab selectors */}
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3 shrink-0 bg-muted/20">
          <Button
            variant={activeTab === 'purchases' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('purchases')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Purchases ({purchases.length})
          </Button>
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Products ({supplierProducts.length})
          </Button>
        </div>

        {/* Tables area with internal scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4">
          {activeTab === 'purchases' && (
            loading ? <TableSkeleton cols={5} /> : purchases.length === 0 ? <EmptyState message="No purchases recorded from this supplier yet." /> : (
              <PurchasesTable purchases={purchases} onViewPurchase={onViewPurchase} />
            )
          )}
          {activeTab === 'products' && (
            loading ? <TableSkeleton cols={3} /> : supplierProducts.length === 0 ? <EmptyState message="No products purchased from this supplier yet." /> : (
              <ProductsTable supplierProducts={supplierProducts} />
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2 border-b border-border/30">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function PurchasesTable({ purchases, onViewPurchase }: { purchases: Purchase[]; onViewPurchase: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Purchase No.</TableHead>
          <TableHead className="text-center">Items</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map(p => (
          <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onViewPurchase(p.id)}>
            <TableCell className="text-xs text-muted-foreground">{fmtDate(p.purchase_date)}</TableCell>
            <TableCell className="font-mono text-xs font-medium">
              {p.purchase_number ?? `#${p.id.slice(0, 6)}`}
            </TableCell>
            <TableCell className="text-center tabular-nums text-xs">{p.item_count ?? '—'}</TableCell>
            <TableCell className="text-right tabular-nums font-semibold text-xs">{rupee(p.grand_total)}</TableCell>
            <TableCell className="text-center">
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-semibold">
                Received
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ProductsTable({ supplierProducts }: { supplierProducts: SupplierProduct[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Total Qty Bought</TableHead>
          <TableHead>Last Purchased</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {supplierProducts.map(sp => (
          <TableRow key={sp.product_id}>
            <TableCell className="font-medium text-xs text-foreground">{sp.product_name}</TableCell>
            <TableCell className="text-right tabular-nums text-xs font-semibold">
              {sp.total_qty.toLocaleString('en-IN')} {sp.unit_name}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {sp.last_purchased ? fmtDate(sp.last_purchased) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
