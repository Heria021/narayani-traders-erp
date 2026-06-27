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
  Pencil, Trash2, MoreHorizontal, CreditCard,
} from 'lucide-react'
import type { SupplierWithStats, Purchase, SupplierProduct, SupplierPayment } from './types'
import { PaymentStatusBadge } from '../../purchases/_components/PaymentStatusBadge'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })

interface Props {
  supplier:         SupplierWithStats | null
  purchases:        Purchase[]
  supplierProducts: SupplierProduct[]
  payments:         SupplierPayment[]
  loading:          boolean
  onEdit:           () => void
  onDelete:         () => void
  onRecordPayment:  () => void
  onViewPurchase:   (purchaseId: string) => void
}

export function SupplierDetail({ supplier, purchases, supplierProducts, payments, loading, onEdit, onDelete, onRecordPayment, onViewPurchase }: Props) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'products' | 'payments'>('purchases')

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
            <Button variant="outline" size="sm" onClick={onRecordPayment} className="h-9 px-4 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
              <CreditCard className="size-4 mr-2" /> Record Payment
            </Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Opening Balance', value: supplier.opening_balance, desc: 'Owed balance at setup', cls: '' },
          { label: 'Total Purchased', value: supplier.total_purchased, desc: 'Sum of all supplier bills', cls: '' },
          { label: 'Total Paid', value: supplier.total_paid, desc: 'Sum of all payments made', cls: 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, value, desc, cls }) => (
          <div key={label} className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              {label}
            </span>
            <div className={cn('text-xl font-bold tracking-tight tabular-nums', cls)}>
              {rupee(value)}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              {desc}
            </span>
          </div>
        ))}

        {/* Amount Owed — with optional unapplied advance subline */}
        <div className="border rounded-lg p-4 space-y-1 bg-card">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
            Amount Owed
          </span>
          <div className={cn(
            'text-xl font-bold tracking-tight tabular-nums',
            supplier.amount_owed > 0
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400',
          )}>
            {rupee(supplier.amount_owed)}
          </div>
          <span className="text-xs text-muted-foreground block font-medium">
            Current outstanding balance
          </span>
          {supplier.unapplied_advance > 0 && (
            <span className="text-[11px] text-muted-foreground/80 block">
              includes {rupee(supplier.unapplied_advance)} unapplied advance
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Purchases, Products & Payments Card ── */}
      <div className="flex-1 min-h-0 border rounded-xl bg-card flex flex-col overflow-hidden shadow-sm">
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
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Payments ({payments.length})
          </Button>
        </div>

        {/* Tables area with internal scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-0 [&_[data-slot=table-container]]:overflow-visible">
          {activeTab === 'purchases' && (
            loading ? <TableSkeleton cols={6} /> : purchases.length === 0 ? <EmptyState message="No purchases recorded from this supplier yet." /> : (
              <PurchasesTable purchases={purchases} onViewPurchase={onViewPurchase} />
            )
          )}
          {activeTab === 'products' && (
            loading ? <TableSkeleton cols={3} /> : supplierProducts.length === 0 ? <EmptyState message="No products purchased from this supplier yet." /> : (
              <ProductsTable supplierProducts={supplierProducts} />
            )
          )}
          {activeTab === 'payments' && (
            loading ? <TableSkeleton cols={5} /> : payments.length === 0 ? <EmptyState message="No payments recorded for this supplier yet." /> : (
              <PaymentsTable payments={payments} />
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
    <Table className="w-full border-separate border-spacing-0 text-sm">
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent border-b border-border/40">
            {Array.from({ length: cols }).map((_, j) => (
              <TableCell key={j} className={cn("py-3 px-3", j === 0 && "pl-4", j === cols - 1 && "pr-4")}>
                <Skeleton className={cn("h-4 w-20", j === 0 && "w-32", (j === cols - 1 || j === cols - 2) && "ml-auto")} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PurchasesTable({ purchases, onViewPurchase }: { purchases: Purchase[]; onViewPurchase: (id: string) => void }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-sm">
      <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Date</TableHead>
          <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Purchase No.</TableHead>
          <TableHead className="px-3 py-2 text-center font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Items</TableHead>
          <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Amount</TableHead>
          <TableHead className="px-3 py-2 text-center font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Delivery</TableHead>
          <TableHead className="px-3 py-2 text-center font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10 pr-4">Payment</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map(p => (
          <TableRow
            key={p.id}
            className="cursor-pointer group border-b border-border/40 hover:bg-muted/40 transition-colors"
            onClick={() => onViewPurchase(p.id)}
          >
            <TableCell className="py-3 pl-4 text-xs text-muted-foreground align-middle">
              {fmtDate(p.purchase_date)}
            </TableCell>
            <TableCell className="py-3 px-3 font-mono text-xs font-medium text-foreground align-middle">
              <span className="bg-muted/60 px-1.5 py-0.5 rounded font-medium">
                {p.purchase_number ?? `#${p.id.slice(0, 6)}`}
              </span>
            </TableCell>
            <TableCell className="py-3 px-3 text-center align-middle">
              <Badge variant="outline" className="text-xs font-medium tabular-nums shadow-none">
                {p.item_count ?? 0} {(p.item_count ?? 0) === 1 ? 'item' : 'items'}
              </Badge>
            </TableCell>
            <TableCell className="py-3 px-3 text-right tabular-nums font-semibold text-xs align-middle text-foreground">
              {rupee(p.grand_total)}
            </TableCell>
            <TableCell className="py-3 px-3 text-center align-middle">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                Received
              </span>
            </TableCell>
            <TableCell className="py-3 px-3 text-center align-middle pr-4">
              <PaymentStatusBadge status={p.payment_status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ProductsTable({ supplierProducts }: { supplierProducts: SupplierProduct[] }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-sm">
      <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Product</TableHead>
          <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Total Qty Bought</TableHead>
          <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Last Purchased</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {supplierProducts.map(sp => (
          <TableRow
            key={sp.product_id}
            className="group border-b border-border/40 hover:bg-muted/40 transition-colors"
          >
            <TableCell className="py-3 pl-4 font-medium text-xs text-foreground align-middle">
              {sp.product_name}
            </TableCell>
            <TableCell className="py-3 px-3 text-right align-middle tabular-nums text-xs font-semibold text-foreground">
              {sp.total_qty.toLocaleString('en-IN')} {sp.unit_name}
            </TableCell>
            <TableCell className="py-3 px-3 text-left align-middle text-xs text-muted-foreground">
              {sp.last_purchased ? fmtDate(sp.last_purchased) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PaymentsTable({ payments }: { payments: SupplierPayment[] }) {
  return (
    <Table className="w-full border-separate border-spacing-0 text-sm">
      <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Date</TableHead>
          <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Method / Reference</TableHead>
          <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Linked Purchase</TableHead>
          <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Note</TableHead>
          <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10 pr-4">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(p => (
          <TableRow
            key={p.id}
            className="border-b border-border/40 hover:bg-muted/40 transition-colors"
          >
            <TableCell className="py-3 pl-4 text-xs text-muted-foreground align-middle">
              {fmtDate(p.payment_date)}
            </TableCell>
            <TableCell className="py-3 px-3 align-middle text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground capitalize font-medium">{p.payment_method.replace('_', ' ')}</span>
                {p.reference_number && (
                  <span className="text-[10px] text-muted-foreground font-mono">{p.reference_number}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="py-3 px-3 text-xs align-middle font-medium">
              {p.purchase_number ? (
                <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded font-medium text-xs">
                  {p.purchase_number}
                </span>
              ) : (
                <span className="text-muted-foreground/40 text-xs">Advance</span>
              )}
            </TableCell>
            <TableCell className="py-3 px-3 text-xs align-middle text-muted-foreground">
              {p.note || <span className="text-muted-foreground/30">—</span>}
            </TableCell>
            <TableCell className="py-3 px-3 text-right tabular-nums font-semibold text-xs align-middle text-foreground pr-4">
              {rupee(p.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
