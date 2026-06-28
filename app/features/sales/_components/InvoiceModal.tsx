'use client'

import { Button } from '@/components/ui/button'
import { Printer, CreditCard } from 'lucide-react'
import type { SaleWithItems } from './types'
import { PAYMENT_METHOD_LABELS } from './types'
import { SHOP } from '@/lib/config/shop'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'

// ─── Constants ────────────────────────────────────────────────────────────────
const FLOAT_DUST = 0.001

// ─── helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

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

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  sale: SaleWithItems | null
  onClose: () => void
  onRecordPayment?: () => void
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────

export function InvoiceModal({ open, sale, onClose, onRecordPayment }: Props) {
  if (!sale) return null

  const customer   = getWalkinDisplayName(sale)
  const dueDate    = getDueDate(sale)
  const hasTax     = sale.tax_amount > 0
  const hasDiscount = sale.discount > 0
  const hasPaid    = sale.amount_paid > 0
  const hasBalance = sale.balance_due > FLOAT_DUST

  const isUdhaar = hasBalance

  // Note: sale.created_at is UTC from the database. Since this app is built for a
  // single-owner shop operating entirely in Rajasthan, toLocaleTimeString('en-IN')
  // is appropriate as it correctly resolves to the local IST timezone on client browsers.
  const saleTime = new Date(sale.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      {/* Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body > * { display: none !important; }
          body > [data-slot="sheet-portal"] { display: block !important; }
          body > [data-slot="sheet-portal"] [data-slot="sheet-content"] {
            display: block !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          [data-slot="sheet-overlay"],
          [data-slot="sheet-header"],
          [data-slot="sheet-footer"],
          [data-slot="sheet-close"],
          .no-print {
            display: none !important;
          }
          #nt-invoice-print-root {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
          }
          .inv-content {
            display: flex !important;
            flex-direction: column !important;
            min-height: 277mm !important;
            box-sizing: border-box !important;
            padding: 2.5rem 2rem !important;
          }
          .inv-terms {
            margin-top: auto !important;
          }
        }
        #nt-invoice-print-root {
          display: block;
        }

        /* ── Invoice layout ── */
        .inv-body { font-family: Arial, sans-serif; color: #1a1612; font-size: 13px; line-height: 1.45; }
        .inv-content { padding: 1.5rem 1.75rem; }

        /* Header */
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .75rem; }
        .inv-shop-name { font-family: 'Syne', Georgia, serif; font-size: 1.3rem; font-weight: 800; color: #1a1612; }
        .inv-shop-name span { color: #d97706; }
        .inv-shop-sub { font-size: .65rem; font-weight: 600; color: #6b5e52; text-transform: uppercase; letter-spacing: .04em; }
        .inv-shop-meta { font-size: .74rem; color: #6b5e52; margin-top: .35rem; line-height: 1.6; }
        .inv-header-right { text-align: right; }
        .inv-billno-label { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: .62rem; font-weight: 600; color: #6b5e52; text-transform: uppercase; letter-spacing: .06em; }
        .inv-billno-val { font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 700; font-size: .9rem; color: #1a1612; margin: .15rem 0; }
        .inv-gstin { font-size: .7rem; color: #6b5e52; }

        /* Meta strip */
        .inv-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .4rem; padding: .6rem 0; border-top: 1.5px solid #e2d8cf; border-bottom: 1.5px solid #e2d8cf; margin-bottom: .5rem; }
        .inv-meta-item { font-size: .82rem; color: #1a1612; }
        .inv-meta-lbl { font-size: .6rem; font-weight: 700; color: #6b5e52; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .2rem; }

        /* Badge */
        .inv-badge { display: inline-block; padding: .2rem .55rem; border-radius: 4px; font-size: .72rem; font-weight: 700; }
        .inv-badge--paid { background: #dcfce7; color: #15803d; }
        .inv-badge--partial { background: #fef9c3; color: #854d0e; }
        .inv-badge--due { background: #fee2e2; color: #b91c1c; }

        /* Items table */
        .inv-table { width: 100%; border-collapse: collapse; margin: .6rem 0; table-layout: fixed; }
        .inv-table colgroup .col-no  { width: 28px; }
        .inv-table colgroup .col-qty { width: 70px; }
        .inv-table colgroup .col-rate{ width: 80px; }
        .inv-table colgroup .col-amt { width: 88px; }
        .inv-table colgroup .col-profit { width: 72px; }
        .inv-col-profit { }
        @media print {
          .inv-col-profit { display: none; }
        }
        .inv-table th { padding: .4rem .35rem; font-size: .6rem; font-weight: 700; color: #6b5e52; text-transform: uppercase; letter-spacing: .04em; border-bottom: 2px solid #e2d8cf; text-align: left; }
        .inv-table th.r { text-align: right; }
        .inv-table td { padding: .45rem .35rem; border-bottom: 1px solid #f0ebe6; font-size: .82rem; color: #1a1612; vertical-align: top; }
        .inv-table td.r { text-align: right; font-family: 'JetBrains Mono', 'Courier New', monospace; white-space: nowrap; }
        .inv-table .row-gst-note { display: block; font-size: .68rem; color: #9a8274; margin-top: 2px; }
        .inv-table .row-box-note { display: block; font-size: .68rem; color: #9a8274; margin-top: 2px; }

        /* Summary */
        .inv-summary { margin: .6rem 0 0; display: flex; flex-direction: column; align-items: flex-end; }
        .inv-summary-table { width: 58%; max-width: 320px; min-width: 200px; border-collapse: collapse; }
        .inv-summary-table td { padding: .3rem .35rem; font-size: .82rem; color: #1a1612; }
        .inv-summary-table td:last-child { text-align: right; font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: 600; white-space: nowrap; }
        .inv-summary-table .tax-line td { color: #6b7280; font-size: .78rem; }
        .inv-summary-table .disc-line td { color: #059669; }
        .inv-summary-table .total-line { border-top: 2px solid #1a1612; border-bottom: 1.5px solid #1a1612; }
        .inv-summary-table .total-line td { font-weight: 800; font-size: .95rem; padding-top: .45rem; padding-bottom: .45rem; }
        .inv-summary-table .paid-line td { color: #15803d; font-size: .82rem; }
        .inv-summary-table .balance-line { background: #fff7ed; }
        .inv-summary-table .balance-line td { color: #c2410c; font-weight: 700; font-size: .88rem; padding: .5rem .35rem; border-radius: 3px; }
        .inv-summary-table .settled-line td { color: #15803d; font-size: .78rem; }
        .inv-summary-table .due-date-line td { font-size: .72rem; color: #9a8274; font-style: italic; }

        /* Terms */
        .inv-terms { margin-top: 1.2rem; padding: .65rem .9rem; background: #faf6f2; border: 1px solid #e2d8cf; border-radius: 5px; }
        .inv-terms-title { font-size: .65rem; font-weight: 700; text-transform: uppercase; color: #6b5e52; letter-spacing: .05em; margin-bottom: .4rem; }
        .inv-terms ol { margin: 0; padding-left: 1.1rem; }
        .inv-terms li { font-size: .72rem; color: #6b5e52; margin-bottom: .2rem; line-height: 1.5; }

        /* Footer strip */
        .inv-footer-strip { display: flex; justify-content: space-between; gap: 1.5rem; margin-top: .9rem; padding-top: .75rem; border-top: 1.5px solid #e2d8cf; }
        .inv-footer-block { font-size: .74rem; color: #1a1612; line-height: 1.7; }
        .inv-footer-tagline { margin-top: .8rem; text-align: center; font-size: .8rem; font-style: italic; color: #9a8274; padding-top: .6rem; border-top: 1px dashed #e2d8cf; }

      `}</style>

      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-full flex flex-col p-0 overflow-hidden border-l bg-white dark:bg-zinc-950"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-white dark:bg-zinc-950 select-none">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-semibold tracking-tight">
                  Invoice Details
                </SheetTitle>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-sans ${isUdhaar ? (hasPaid ? 'inv-badge--partial' : 'inv-badge--due') : 'inv-badge--paid'}`}>
                  {isUdhaar ? (hasPaid ? 'Partial' : 'Udhaar') : '✓ Paid'}
                </span>
              </div>
              <SheetDescription className="text-sm text-muted-foreground">
                Bill #{sale.invoice_number} &middot; {customer.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable Body ────────────────────────────────────────── */}
        <div
          id="nt-invoice-print-root"
          className="flex-1 overflow-y-auto bg-white dark:bg-white text-zinc-900 [scrollbar-width:thin] select-text"
        >
          <div className="inv-body">
            <div className="inv-content">

                {/* ── Shop header ──────────────────────────────────────────── */}
                <div className="inv-header">
                  <div>
                    <div className="inv-shop-name">
                      {SHOP.name1} <span>{SHOP.name2}</span>
                    </div>
                    <div className="inv-shop-sub">{SHOP.tagline}</div>
                    <div className="inv-shop-meta">
                      {SHOP.address}<br />
                      {SHOP.phone1} &nbsp;·&nbsp; {SHOP.phone2} &nbsp;·&nbsp; {SHOP.email}
                    </div>
                  </div>
                  <div className="inv-header-right">
                    <div className="inv-billno-label">Tax Invoice</div>
                    <div className="inv-billno-val">{sale.invoice_number}</div>
                    <div className="inv-gstin">GSTIN: {SHOP.gstin}</div>
                    {sale.notes && (
                      <div style={{ fontSize: '.7rem', color: '#6b5e52', marginTop: '.2rem' }}>
                        Note: {sale.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Meta strip ───────────────────────────────────────────── */}
                <div className="inv-meta">
                  {/* Bill To */}
                  <div className="inv-meta-item">
                    <div className="inv-meta-lbl">Bill To</div>
                    <strong style={{ fontSize: '.88rem' }}>{customer.name}</strong>
                    {customer.phone && (
                      <><br /><span style={{ fontSize: '.74rem', color: '#6b5e52' }}>{customer.phone}</span></>
                    )}
                  </div>
                  {/* Date */}
                  <div className="inv-meta-item">
                    <div className="inv-meta-lbl">Date</div>
                    {fmtDate(sale.sale_date)}<br />
                    <span style={{ fontSize: '.74rem', color: '#6b5e52' }}>{saleTime}</span>
                  </div>
                  {/* Payment */}
                  <div className="inv-meta-item">
                    <div className="inv-meta-lbl">Payment</div>
                    <span className={`inv-badge ${isUdhaar ? (hasPaid ? 'inv-badge--partial' : 'inv-badge--due') : 'inv-badge--paid'}`}>
                      {isUdhaar
                        ? (hasPaid ? `Partial · ${rupee(sale.balance_due)} due` : `Udhaar: ${rupee(sale.balance_due)}`)
                        : '✓ Paid'}
                    </span>
                    {isUdhaar && dueDate && (
                      <><br /><span style={{ fontSize: '.7rem', color: '#b91c1c', marginTop: '3px', display: 'block' }}>Due by {dueDate}</span></>
                    )}
                    {sale.payments && sale.payments.length > 0 ? (
                      sale.payments.map((p) => (
                        <div key={p.id} style={{ fontSize: '.7rem', color: '#6b5e52', marginTop: '3px', lineHeight: '1.2' }}>
                          • {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                          {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                        </div>
                      ))
                    ) : (
                      hasPaid && <div style={{ fontSize: '.7rem', color: '#dc2626', marginTop: '3px' }}>• Payment method unlinked</div>
                    )}
                  </div>
                </div>

                {/* ── Items table ───────────────────────────────────────────── */}
                <table className="inv-table">
                  <colgroup>
                    <col className="col-no" />
                    <col />
                    <col className="col-qty" />
                    <col className="col-rate" />
                    <col className="col-amt" />
                    <col className="col-profit" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th className="r">Qty</th>
                      <th className="r">Rate</th>
                      <th className="r">Amount</th>
                      <th className="r inv-col-profit">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, idx) => {
                      const isBox = item.sell_mode === 'box'
                      const lineBase = item.line_total
                      const gstAmt = lineBase * item.tax_rate / 100
                      const hasGst = item.tax_rate > 0

                      const qtyDisplay = isBox
                        ? `${item.box_count} ${item.box_name ?? 'box'}${(item.box_count ?? 0) !== 1 ? 'es' : ''}`
                        : `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3)} ${item.unit_name}`

                      return (
                        <tr key={item.id}>
                          <td style={{ color: '#9a8274', fontSize: '.78rem' }}>{idx + 1}.</td>
                          <td>
                            {item.product_name}
                            {isBox && item.units_per_box && (
                              <span className="row-box-note">
                                {item.box_count} {item.box_name} × {item.units_per_box} {item.unit_name}
                                {' '}= {item.quantity} {item.unit_name}
                              </span>
                            )}
                            {hasGst && (
                              <span className="row-gst-note">
                                GST {item.tax_rate}%: {rupee(gstAmt)}
                              </span>
                            )}
                          </td>
                          <td className="r">{qtyDisplay}</td>
                          <td className="r">{rupee(item.unit_price)}</td>
                          <td className="r">{rupee(lineBase)}</td>
                          <td className={cn('r inv-col-profit', item.line_profit < 0 && 'text-red-600')}>
                            {rupee(item.line_profit)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* ── Summary ───────────────────────────────────────────────── */}
                <div className="inv-summary">
                  <table className="inv-summary-table">
                    <tbody>
                      {/* Subtotal */}
                      <tr>
                        <td>Subtotal</td>
                        <td>{rupee(sale.subtotal)}</td>
                      </tr>
                      {/* GST */}
                      {hasTax && (
                        <tr className="tax-line">
                          <td>GST / Tax</td>
                          <td>{rupee(sale.tax_amount)}</td>
                        </tr>
                      )}
                      {/* Discount */}
                      {hasDiscount && (
                        <tr className="disc-line">
                          <td>Discount</td>
                          <td>− {rupee(sale.discount)}</td>
                        </tr>
                      )}
                      {/* Grand Total */}
                      <tr className="total-line">
                        <td>Grand Total</td>
                        <td>{rupee(sale.grand_total)}</td>
                      </tr>
                      {/* Amount Paid */}
                      {sale.payments && sale.payments.length > 0 ? (
                        sale.payments.map((p) => (
                          <tr key={p.id} className="paid-line">
                            <td>Paid ({PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method})</td>
                            <td>− {rupee(p.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        hasPaid ? (
                          <tr className="paid-line">
                            <td style={{ color: '#ef4444' }}>Paid (—)</td>
                            <td style={{ color: '#ef4444' }}>− {rupee(sale.amount_paid)}</td>
                          </tr>
                        ) : null
                      )}
                      {/* Balance Due */}
                      {hasBalance ? (
                        <>
                          <tr className="balance-line">
                            <td>Balance Due</td>
                            <td>{rupee(sale.balance_due)}</td>
                          </tr>
                          {dueDate && (
                            <tr className="due-date-line">
                              <td colSpan={2}>Due by {dueDate}</td>
                            </tr>
                          )}
                        </>
                      ) : hasPaid ? (
                        <tr className="settled-line">
                          <td colSpan={2}>✓ Fully Settled</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* ── Terms & Conditions ────────────────────────────────────── */}
                <div className="inv-terms">
                  <div className="inv-terms-title">Terms &amp; Conditions</div>
                  <ol>
                    {SHOP.terms.map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </div>

                {/* ── Footer strip ──────────────────────────────────────────── */}
                <div className="inv-footer-strip">
                  <div className="inv-footer-block">
                    <div className="inv-meta-lbl">Contact Us</div>
                    📞 {SHOP.phone1} &nbsp;/&nbsp; {SHOP.phone2}<br />
                    ✉ {SHOP.email}
                  </div>
                  <div className="inv-footer-block" style={{ textAlign: 'right' }}>
                    <div className="inv-meta-lbl">UPI / Quick Pay</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1612' }}>{SHOP.upi}</div>
                    <div style={{ fontSize: '10px', color: '#6b5e52', marginTop: '2px' }}>Scan QR to pay instantly</div>
                  </div>
                </div>

                {/* ── Tagline ───────────────────────────────────────────────── */}
                <div className="inv-footer-tagline">Thank you for your business!</div>

              </div>{/* /inv-content */}
            </div>{/* /inv-body */}
          </div>{/* /nt-invoice-print-root */}

        {/* ── Footer ───────────────────────────────────────────────── */}
        <SheetFooter className="px-8 py-5 border-t shrink-0 flex flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-950 no-print select-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <div className="flex items-center gap-3">
            {hasBalance && onRecordPayment && (
              <Button
                variant="outline"
                onClick={onRecordPayment}
                className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shrink-0 font-medium"
              >
                <CreditCard className="size-4" />
                Record Payment
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => window.print()}
              className="gap-1.5 shrink-0 font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Printer className="size-4" />
              Print / PDF
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
