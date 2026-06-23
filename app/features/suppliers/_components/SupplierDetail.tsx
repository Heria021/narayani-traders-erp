'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
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
}

export function SupplierDetail({ supplier, purchases, supplierProducts, loading, onEdit, onDelete }: Props) {

  // ── empty state ──────────────────────────────────────────────────────────────
  if (!supplier) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center gap-3 text-muted-foreground">
        <Building2 className="size-10 opacity-20" />
        <p className="text-sm font-medium">Select a supplier to view details</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border/60">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-black dark:text-white truncate">{supplier.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
              {supplier.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="size-3" /> {supplier.phone}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="size-3" /> {supplier.email}
                </div>
              )}
              {(supplier.city || supplier.state) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />
                  {[supplier.city, supplier.state, supplier.postal_code].filter(Boolean).join(', ')}
                </div>
              )}
              {supplier.gstin && (
                <div className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  GSTIN: {supplier.gstin}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 rounded-lg text-xs">
              <Pencil className="size-3 mr-1" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                  <MoreHorizontal className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4 mr-2" /> Delete Supplier
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Opening Balance', value: supplier.opening_balance, cls: '' },
            { label: 'Total Purchased',  value: supplier.total_purchased, cls: '' },
            {
              label: 'Amount Owed',
              value: supplier.amount_owed,
              cls: supplier.amount_owed > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
            },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-base font-bold tabular-nums mt-0.5', cls)}>{rupee(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="purchases" className="h-full flex flex-col">
          <div className="px-6 pt-3 shrink-0 border-b border-border/60">
            <TabsList className="h-8 gap-1 bg-transparent p-0">
              {[
                { value: 'purchases', label: `Purchases (${purchases.length})` },
                { value: 'products',  label: `Products (${supplierProducts.length})` },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="h-8 rounded-lg px-3 text-xs font-medium data-active:bg-black data-active:text-white dark:data-active:bg-white dark:data-active:text-black">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Purchases tab */}
          <TabsContent value="purchases" className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-6 py-4">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : purchases.length === 0 ? (
              <EmptyState message="No purchases recorded from this supplier yet." />
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {['Date','Purchase No.','Items','Amount','Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(p.purchase_date)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs font-medium">
                          {p.purchase_number ?? `#${p.id.slice(0, 6)}`}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-sm">{p.item_count ?? '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums font-semibold">{rupee(p.grand_total)}</td>
                        <td className="px-3 py-2.5">
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-semibold">
                            Received
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Products tab */}
          <TabsContent value="products" className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-6 py-4">
            {loading ? (
              <TableSkeleton cols={3} />
            ) : supplierProducts.length === 0 ? (
              <EmptyState message="No products purchased from this supplier yet." />
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {['Product','Total Qty Bought','Last Purchased'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplierProducts.map(sp => (
                      <tr key={sp.product_id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 font-medium">{sp.product_name}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {sp.total_qty.toLocaleString('en-IN')} {sp.unit_name}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {sp.last_purchased ? fmtDate(sp.last_purchased) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────────
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
