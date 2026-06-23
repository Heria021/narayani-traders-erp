'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Calendar, Building2, FileText, Package } from 'lucide-react'
import type { PurchaseWithItems } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  open: boolean
  purchase: PurchaseWithItems | null
  loading: boolean
  onClose: () => void
}

export function PurchaseDetail({ open, purchase, loading, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-5 border-b border-border/60 shrink-0">
          <SheetTitle className="text-base font-bold flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            {loading || !purchase ? 'Purchase Detail' : purchase.purchase_number}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
          {loading ? (
            <LoadingSkeleton />
          ) : !purchase ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No purchase selected
            </div>
          ) : (
            <PurchaseContent purchase={purchase} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

function PurchaseContent({ purchase: p }: { purchase: PurchaseWithItems }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-5">

      {/* ── Header metadata ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{p.purchase_number}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.items.length} product{p.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge className="shrink-0 text-xs bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-0">
            Purchase
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetaItem icon={<Calendar className="size-3.5" />} label="Date" value={p.purchase_date ? fmtDate(p.purchase_date) : '—'} />
          <MetaItem icon={<Building2 className="size-3.5" />} label="Supplier" value={p.supplier_name} />
          {p.notes && (
            <div className="col-span-2">
              <MetaItem icon={<FileText className="size-3.5" />} label="Notes" value={p.notes} />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Line items ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</p>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px_90px_100px] gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/40">
            <p className="text-xs font-semibold text-muted-foreground">Product</p>
            <p className="text-xs font-semibold text-muted-foreground text-center">Mode</p>
            <p className="text-xs font-semibold text-muted-foreground text-right">Qty</p>
            <p className="text-xs font-semibold text-muted-foreground text-right">Price</p>
            <p className="text-xs font-semibold text-muted-foreground text-right">Total</p>
          </div>

          {/* Rows */}
          {p.items.map((item, idx) => (
            <div
              key={item.id}
              className={`grid grid-cols-[1fr_80px_80px_90px_100px] gap-2 px-4 py-3 items-center ${idx !== p.items.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">{item.unit_name}</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                  {item.buy_mode === 'box' ? `Box×${item.box_count}` : 'Unit'}
                </Badge>
              </div>
              <p className="text-sm tabular-nums text-right text-foreground">
                {item.quantity.toLocaleString('en-IN')}
              </p>
              <p className="text-sm tabular-nums text-right text-muted-foreground">
                {rupee(item.unit_price)}
              </p>
              <p className="text-sm tabular-nums text-right font-medium text-foreground">
                {rupee(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Totals ──────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totals</p>

        <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
          <TotalRow label="Subtotal" value={rupee(p.subtotal)} />
          <TotalRow label="Tax (GST)" value={rupee(p.tax_amount)} />
          {p.discount_amount > 0 && (
            <TotalRow label="Discount" value={`−${rupee(p.discount_amount)}`} valueClass="text-emerald-600 dark:text-emerald-400" />
          )}
          <TotalRow
            label="Grand Total"
            value={rupee(p.grand_total)}
            emphasis
          />
        </div>
      </div>

    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground leading-tight">{value}</p>
      </div>
    </div>
  )
}

function TotalRow({
  label, value, emphasis = false, valueClass = '',
}: { label: string; value: string; emphasis?: boolean; valueClass?: string }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${emphasis ? 'bg-muted/30' : ''}`}>
      <p className={`text-sm ${emphasis ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{label}</p>
      <p className={`text-sm tabular-nums font-semibold ${valueClass || (emphasis ? 'text-foreground text-base' : 'text-foreground')}`}>
        {value}
      </p>
    </div>
  )
}
