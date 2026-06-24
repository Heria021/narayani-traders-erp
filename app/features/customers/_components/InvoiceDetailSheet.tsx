'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, Download, X } from 'lucide-react'
import type { SaleWithItems } from '../../sales/_components/types'
import { PAYMENT_METHOD_LABELS } from '../../sales/_components/types'
import { SHOP } from '@/lib/config/shop'
import { cn } from '@/lib/utils'

const FLOAT_DUST = 0.001

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getWalkinDisplayName(sale: SaleWithItems): { name: string; phone?: string } {
  if (sale.customer_name !== 'Walk-in') return { name: sale.customer_name }
  if (sale.walkin_name) return { name: sale.walkin_name }
  return { name: 'Walk-in Customer' }
}

function getDueDate(sale: SaleWithItems): string | null {
  if (sale.due_date) return fmtDate(sale.due_date)
  if (sale.balance_due > 0) {
    const d = new Date(sale.sale_date)
    d.setDate(d.getDate() + 30)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return null
}

interface Props {
  open: boolean
  sale: SaleWithItems | null
  onClose: () => void
}

export function InvoiceDetailSheet({ open, sale, onClose }: Props) {
  if (!sale) return null

  const customer = getWalkinDisplayName(sale)
  const dueDate = getDueDate(sale)
  const hasTax = sale.tax_amount > 0
  const hasDiscount = sale.discount > 0
  const hasPaid = sale.amount_paid > 0
  const hasBalance = sale.balance_due > FLOAT_DUST
  const isUdhaar = hasBalance

  const saleTime = new Date(sale.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* Style block for Print targeting only the printed area */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body > * { display: none !important; }
            #invoice-sheet-print-area {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
              background: white;
              padding: 20px;
            }
            .no-print { display: none !important; }
          }
        `}} />

        {/* ── Action bar (no-print) ── */}
        <div className="no-print flex items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-foreground">
              {sale.invoice_number}
            </span>
            <Badge variant={isUdhaar ? 'destructive' : 'default'} className="text-[10px] font-semibold tracking-wider uppercase">
              {isUdhaar ? (hasPaid ? 'Partial' : 'Udhaar') : 'Paid'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              Print
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="size-3.5" />
              Download PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* ── Scrollable billing area ── */}
        <div
          id="invoice-sheet-print-area"
          className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] p-8 space-y-6 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
        >
          {/* Brand & Invoice Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                {SHOP.name1} <span className="text-amber-500">{SHOP.name2}</span>
              </h2>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{SHOP.tagline}</p>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
                {SHOP.address}<br />
                Phone: {SHOP.phone1} &nbsp;·&nbsp; {SHOP.phone2}
              </div>
            </div>
            <div className="sm:text-right space-y-1">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Tax Invoice</span>
              <span className="text-xl font-mono font-bold text-neutral-900 dark:text-white block">{sale.invoice_number}</span>
              <span className="text-xs text-neutral-500 block">GSTIN: {SHOP.gstin}</span>
              {sale.notes && (
                <p className="text-xs text-neutral-500 italic max-w-xs sm:ml-auto pt-1">
                  Note: {sale.notes}
                </p>
              )}
            </div>
          </div>

          {/* Meta Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/50 dark:bg-neutral-900/20">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Bill To</span>
              <strong className="text-sm text-neutral-800 dark:text-white block">{customer.name}</strong>
              {customer.phone && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-1">{customer.phone}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Date & Time</span>
              <span className="text-sm text-neutral-800 dark:text-white block">{fmtDate(sale.sale_date)}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">{saleTime}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Payment Status</span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-white block">
                {isUdhaar
                  ? (hasPaid ? `Partial · ${rupee(sale.balance_due)} due` : `Outstanding`)
                  : 'Fully Paid'}
              </span>
              {isUdhaar && dueDate && (
                <span className="text-[10px] text-destructive block mt-1 font-medium">Due by {dueDate}</span>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 text-left">
                  <th className="py-2.5 px-4 text-xs font-bold text-neutral-400 uppercase tracking-wider w-8">#</th>
                  <th className="py-2.5 px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Product</th>
                  <th className="py-2.5 px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right w-24">Qty</th>
                  <th className="py-2.5 px-3 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right w-24">Rate</th>
                  <th className="py-2.5 px-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => {
                  const isBox = item.sell_mode === 'box'
                  const lineBase = item.line_total
                  const gstAmt = lineBase * item.tax_rate / 100
                  const hasGst = item.tax_rate > 0

                  const qtyDisplay = isBox
                    ? `${item.box_count} ${item.box_name ?? 'box'}${item.box_count !== 1 ? 'es' : ''}`
                    : `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3)} ${item.unit_name}`

                  return (
                    <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50/20">
                      <td className="py-3 px-4 text-xs text-neutral-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold block text-neutral-900 dark:text-neutral-100">{item.product_name}</span>
                        {isBox && item.units_per_box && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            {item.box_count} {item.box_name} × {item.units_per_box} {item.unit_name} = {item.quantity} {item.unit_name}
                          </span>
                        )}
                        {hasGst && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            GST {item.tax_rate}%: {rupee(gstAmt)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium tabular-nums">{qtyDisplay}</td>
                      <td className="py-3 px-3 text-right font-medium tabular-nums">{rupee(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">{rupee(lineBase)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4">
            <div className="flex-1 w-full space-y-4">
              {/* Payments History */}
              <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/20 dark:bg-neutral-900/10">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">Ledger Payments</span>
                {sale.payments && sale.payments.length > 0 ? (
                  <div className="space-y-2">
                    {sale.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {fmtDate(p.payment_date)} &nbsp;·&nbsp; <span className="capitalize">{PAYMENT_METHOD_LABELS[p.payment_method]}</span>
                          {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          − {rupee(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  hasPaid ? (
                    <div className="text-xs text-destructive flex items-center gap-1.5">
                      ⚠ Payment transaction record unlinked.
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 italic">No payments recorded against this invoice.</div>
                  )
                )}
              </div>
            </div>

            {/* Billing Summary Box */}
            <div className="w-full sm:w-[320px] shrink-0 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/30 dark:bg-neutral-900/10">
              <div className="space-y-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 tabular-nums">{rupee(sale.subtotal)}</span>
                </div>
                {hasTax && (
                  <div className="flex justify-between">
                    <span>Tax / GST</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 tabular-nums">{rupee(sale.tax_amount)}</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="font-medium tabular-nums">− {rupee(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{rupee(sale.grand_total)}</span>
                </div>
                {hasPaid && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Paid</span>
                    <span className="font-medium tabular-nums">− {rupee(sale.amount_paid)}</span>
                  </div>
                )}
                <div className={cn(
                  "flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2 text-sm font-bold rounded-lg px-2 py-1.5 mt-1",
                  hasBalance ? "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400" : "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400"
                )}>
                  <span>{hasBalance ? 'Balance Due' : 'Fully Settled'}</span>
                  <span className="tabular-nums">{hasBalance ? rupee(sale.balance_due) : rupee(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/20 dark:bg-neutral-900/5 mt-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">Terms &amp; Conditions</span>
            <ol className="list-decimal pl-4 space-y-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {SHOP.terms.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ol>
          </div>

          {/* UPI footer */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row justify-between gap-4 text-xs text-neutral-500 mt-6 pb-6">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Quick Pay (UPI)</span>
              <strong className="text-neutral-800 dark:text-neutral-300 font-bold">{SHOP.upi}</strong>
            </div>
            <div className="sm:text-right text-[10px] text-neutral-400 italic mt-auto">
              Thank you for choosing {SHOP.name1} {SHOP.name2}!
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
