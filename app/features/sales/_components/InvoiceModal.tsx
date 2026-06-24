'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Printer, X, Building2, Phone, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SaleWithItems } from './types'
import { STATUS_CONFIG, PAYMENT_METHOD_LABELS } from './types'

// ─── Shop constants — replace with settings table in phase 2 ─────────────────
const SHOP = {
  name:    'NARAYANI TRADERS',
  address: 'Jaipur, Rajasthan',
  phone:   '9XXXXXXXXX',
  gstin:   'XXXXXXXXXXXXXXX',
  tagline: 'Thank you for your business!',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getWalkinDisplayName(sale: SaleWithItems): string {
  if (sale.customer_name !== 'Walk-in') return sale.customer_name
  // extract from notes: "Walk-in: <name>\n..."
  if (sale.notes?.startsWith('Walk-in: ')) {
    const firstLine = sale.notes.split('\n')[0]
    const extracted = firstLine.replace('Walk-in: ', '').trim()
    if (extracted) return extracted
  }
  return 'Walk-in Customer'
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  sale: SaleWithItems | null
  onClose: () => void
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────

export function InvoiceModal({ open, sale, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !sale) return null

  const displayName = getWalkinDisplayName(sale)
  const statusCfg   = STATUS_CONFIG[sale.payment_status]
  const primaryPayment = sale.payments[0]
  const methodLabel = primaryPayment
    ? PAYMENT_METHOD_LABELS[primaryPayment.payment_method]
    : PAYMENT_METHOD_LABELS[sale.amount_paid > 0 ? 'cash' : 'credit']

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Print CSS — hides everything except the invoice */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 24px; }
          #invoice-print-root .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          id="invoice-print-root"
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col"
        >
          {/* ── Modal actions bar (no-print) ─────────────────────────────────── */}
          <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-5 py-3">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs border', statusCfg.color)}>
                {statusCfg.label}
              </Badge>
              <span className="font-mono text-sm font-semibold text-foreground">
                {sale.invoice_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handlePrint}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="size-8 text-muted-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* ── Invoice content ───────────────────────────────────────────────── */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Shop Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-foreground/10">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{SHOP.name}</h1>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />{SHOP.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />{SHOP.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" />GSTIN: {SHOP.gstin}
                </span>
              </div>
            </div>

            {/* Bill info row */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
                <div>
                  <p className="font-bold text-foreground text-base">{displayName}</p>
                  {sale.customer_name !== 'Walk-in' && (
                    <p className="text-xs text-muted-foreground mt-0.5">Customer</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Details</p>
                <div className="space-y-0.5">
                  <p className="font-mono text-sm font-bold text-foreground">{sale.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(sale.sale_date)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-2 pr-3 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                    <th className="py-2 pr-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground">Rate</th>
                    <th className="py-2 px-3 text-right text-xs font-semibold text-muted-foreground">Tax</th>
                    <th className="py-2 pl-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sale.items.map((item, idx) => {
                    const isBox = item.sell_mode === 'box'
                    const qtyDisplay = isBox
                      ? `${item.box_count} ${item.box_name ?? 'box'}${(item.box_count ?? 0) > 1 ? 'es' : ''} (${item.quantity} ${item.unit_name})`
                      : `${item.quantity} ${item.unit_name}`

                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-3 align-top text-muted-foreground">{idx + 1}</td>
                        <td className="py-2.5 pr-3 align-top">
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          {isBox && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {item.box_count} {item.box_name ?? 'box'} × {item.units_per_box} {item.unit_name}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {qtyDisplay}
                        </td>
                        <td className="py-2.5 px-3 align-top text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {rupee(item.unit_price)}
                        </td>
                        <td className="py-2.5 px-3 align-top text-right tabular-nums text-muted-foreground">
                          {item.tax_rate}%
                        </td>
                        <td className="py-2.5 pl-3 align-top text-right tabular-nums font-semibold text-foreground whitespace-nowrap">
                          {rupee(item.line_total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums font-medium">{rupee(sale.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span className="tabular-nums font-medium">{rupee(sale.tax_amount)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      −{rupee(sale.discount)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Grand Total</span>
                <span className="text-xl tabular-nums font-black text-foreground">{rupee(sale.grand_total)}</span>
              </div>

              <div className="mt-2 rounded-xl bg-muted/40 border border-border/40 divide-y divide-border/40 text-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="tabular-nums font-semibold text-foreground">{rupee(sale.amount_paid)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className={cn(
                    'tabular-nums font-bold',
                    sale.balance_due > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                  )}>
                    {rupee(sale.balance_due)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 flex items-center justify-between text-sm">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Payment Method</p>
                <p className="font-semibold text-foreground">{methodLabel}</p>
                {primaryPayment?.reference_number && (
                  <p className="text-xs text-muted-foreground font-mono">{primaryPayment.reference_number}</p>
                )}
              </div>
              <Badge className={cn('text-xs border', statusCfg.color)}>
                {statusCfg.label}
              </Badge>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center border-t border-dashed border-border/40">
              <p className="text-sm text-muted-foreground italic">{SHOP.tagline}</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
