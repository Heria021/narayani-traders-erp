'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, Building2, FileText, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PurchaseWithItems } from './types'
import { PaymentStatusBadge } from './PaymentStatusBadge'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

interface Props {
  open: boolean
  purchase: PurchaseWithItems | null
  loading: boolean
  onClose: () => void
  onRecordPayment?: () => void
}

export function PurchaseDetail({ open, purchase, loading, onClose, onRecordPayment }: Props) {
  const canPay = purchase && purchase.payment_status !== 'paid' && purchase.balance_due > 0

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="text-lg">
                {loading || !purchase ? 'Purchase Detail' : `Purchase ${purchase.purchase_number}`}
              </SheetTitle>
              {!loading && purchase && (
                <p className="text-xs text-muted-foreground">
                  View purchase order items, supplier details, and billing summaries.
                </p>
              )}
            </div>
            {!loading && purchase && (
              <div className="flex items-center gap-2 shrink-0 mr-4">
                {canPay && onRecordPayment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRecordPayment}
                    className="h-8 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    <CreditCard className="size-3.5 mr-1.5" />
                    Record Payment
                  </Button>
                )}
                <Badge className="shrink-0 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-0 uppercase text-[10px] font-bold tracking-wider">
                  Purchase Order
                </Badge>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* ── Scrollable Content ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] px-8 py-6">
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="border rounded-lg p-2 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  )
}

function PurchaseContent({ purchase: p }: { purchase: PurchaseWithItems }) {
  return (
    <div className="space-y-6">
      {/* ── Metadata Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier Details</h4>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-1 min-h-[60px] flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold text-foreground">{p.supplier_name}</p>
            </div>
          </div>
        </div>

        {/* Reference & Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadata</h4>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm min-h-[60px] flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Date
              </span>
              <span className="font-medium text-foreground">{p.purchase_date ? fmtDate(p.purchase_date) : '—'}</span>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        {p.notes && (
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h4>
            <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-2">
              <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{p.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Table with Embedded Totals ───────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h4>
        <div className="rounded-lg border overflow-hidden">
          <Table className="w-full">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead className="w-[100px] text-center">Mode</TableHead>
                <TableHead className="w-[80px] text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-right">Unit Price</TableHead>
                <TableHead className="w-[120px] text-right pr-4">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4">
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.unit_name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium uppercase">
                      {item.buy_mode === 'box' ? `Box × ${item.box_count}` : 'Unit'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums align-middle">
                    {item.quantity.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground align-middle">
                    {rupee(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-foreground pr-4 align-middle">
                    {rupee(item.line_total)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Summary Section Rows */}
              <TableRow className="bg-muted/5 hover:bg-muted/5 border-t border-muted/50">
                <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums align-middle py-3 text-foreground pr-4">
                  {rupee(p.subtotal)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/5 hover:bg-muted/5">
                <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                  Tax (GST)
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums align-middle py-3 text-foreground pr-4">
                  {rupee(p.tax_amount)}
                </TableCell>
              </TableRow>

              {p.discount_amount > 0 && (
                <TableRow className="bg-muted/5 hover:bg-muted/5">
                  <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                    Discount
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums align-middle py-3 text-emerald-600 dark:text-emerald-400 pr-4">
                    −{rupee(p.discount_amount)}
                  </TableCell>
                </TableRow>
              )}

              <TableRow className="bg-muted/20 hover:bg-muted/20 border-t border-muted-foreground/20">
                <TableCell colSpan={4} className="text-right font-bold text-foreground align-middle py-4">
                  Grand Total
                </TableCell>
                <TableCell className="text-right text-base font-bold tabular-nums align-middle py-4 text-foreground pr-4">
                  {rupee(p.grand_total)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/5 hover:bg-muted/5 border-t border-dashed border-muted-foreground/20">
                <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                  Amount Paid
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums align-middle py-3 text-emerald-600 dark:text-emerald-400 pr-4">
                  {rupee(p.amount_paid)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/5 hover:bg-muted/5">
                <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                  Balance Due
                </TableCell>
                <TableCell className={cn(
                  'text-right font-semibold tabular-nums align-middle py-3 pr-4',
                  p.balance_due > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
                )}>
                  {rupee(p.balance_due)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/5 hover:bg-muted/5">
                <TableCell colSpan={4} className="text-right font-medium text-muted-foreground align-middle py-3">
                  Payment Status
                </TableCell>
                <TableCell className="text-right align-middle py-3 pr-4">
                  <div className="flex justify-end">
                    <PaymentStatusBadge status={p.payment_status} />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
