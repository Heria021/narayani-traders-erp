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
          .inv-footer-strip {
            margin-top: auto !important;
          }
        }
        #nt-invoice-print-root {
          display: block;
        }

        /* ── Invoice layout ── */
        .inv-body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #18181b; /* Zinc-900 */
          font-size: 13px;
          line-height: 1.5;
        }
        .inv-content {
          padding: 2.25rem 2rem;
        }

        /* Header */
        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .inv-shop-name {
          font-family: 'Syne', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: #18181b;
          letter-spacing: -0.02em;
        }
        .inv-shop-name span {
          color: #d97706;
        }
        .inv-shop-sub {
          font-size: 0.65rem;
          font-weight: 700;
          color: #71717a; /* Zinc-500 */
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 0.15rem;
        }
        .inv-shop-meta {
          font-size: 0.76rem;
          color: #52525b; /* Zinc-600 */
          margin-top: 0.5rem;
          line-height: 1.6;
        }
        .inv-header-right {
          text-align: right;
        }
        .inv-billno-label {
          font-size: 1.15rem;
          font-weight: 800;
          color: #18181b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .inv-billno-val {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 0.95rem;
          color: #52525b;
          margin: 0.25rem 0;
        }
        .inv-gstin {
          font-size: 0.72rem;
          font-weight: 600;
          color: #71717a;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Meta strip */
        .inv-meta {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 1rem;
          padding: 0.85rem 0;
          border-top: 1px solid #e4e4e7; /* Zinc-200 */
          border-bottom: 1px solid #e4e4e7;
          margin-bottom: 1rem;
        }
        .inv-meta-item {
          font-size: 0.82rem;
          color: #18181b;
          line-height: 1.5;
        }
        .inv-meta-lbl {
          font-size: 0.62rem;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.35rem;
        }

        /* Badge */
        .inv-badge {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .inv-badge--paid {
          background: #ecfdf5; /* Emerald-50 */
          color: #065f46; /* Emerald-800 */
          border: 1px solid #a7f3d0;
        }
        .inv-badge--partial {
          background: #fffbeb; /* Amber-50 */
          color: #92400e; /* Amber-800 */
          border: 1px solid #fde68a;
        }
        .inv-badge--due {
          background: #fef2f2; /* Red-50 */
          color: #991b1b; /* Red-800 */
          border: 1px solid #fecaca;
        }

        /* Items table */
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.2rem 0;
          table-layout: fixed;
        }
        .inv-table th {
          padding: 0.5rem 0.35rem;
          font-size: 0.65rem;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #27272a; /* Zinc-800 */
          text-align: left;
        }
        .inv-table th.r {
          text-align: right;
        }
        .inv-table td {
          padding: 0.55rem 0.35rem;
          border-bottom: 1px solid #f4f4f5; /* Zinc-100 */
          font-size: 0.82rem;
          color: #27272a;
          vertical-align: top;
        }
        .inv-table td.r {
          text-align: right;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .inv-table .row-box-note {
          display: block;
          font-size: 0.68rem;
          color: #71717a;
          margin-top: 3px;
        }

        /* Summary */
        .inv-summary {
          margin: 1rem 0 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .inv-summary-table {
          width: 58%;
          max-width: 320px;
          min-width: 220px;
          border-collapse: collapse;
        }
        .inv-summary-table td {
          padding: 0.35rem 0.35rem;
          font-size: 0.82rem;
          color: #27272a;
        }
        .inv-summary-table td:last-child {
          text-align: right;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-weight: 600;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .inv-summary-table .tax-line td {
          color: #71717a;
          font-size: 0.78rem;
        }
        .inv-summary-table .disc-line td {
          color: #047857; /* Emerald-700 */
        }
        .inv-summary-table .total-line {
          border-top: 1.5px solid #e4e4e7;
          border-bottom: 1.5px solid #e4e4e7;
        }
        .inv-summary-table .total-line td {
          font-weight: 800;
          font-size: 0.98rem;
          color: #18181b;
          padding-top: 0.55rem;
          padding-bottom: 0.55rem;
        }
        .inv-summary-table .paid-line td {
          color: #15803d;
          font-size: 0.82rem;
        }
        .inv-summary-table .balance-line {
          background: #fffbeb; /* Amber-50 */
        }
        .inv-summary-table .balance-line td {
          color: #b45309; /* Amber-700 */
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.55rem 0.35rem;
          border-radius: 4px;
        }
        .inv-summary-table .settled-line td {
          color: #15803d;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .inv-summary-table .due-date-line td {
          font-size: 0.72rem;
          color: #71717a;
          font-style: italic;
        }

        /* Terms */
        .inv-terms {
          margin-top: 1.5rem;
          padding: 0.85rem 1rem;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
        }
        .inv-terms-title {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #71717a;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }
        .inv-terms ol {
          margin: 0;
          padding-left: 1.1rem;
        }
        .inv-terms li {
          font-size: 0.72rem;
          color: #52525b;
          margin-bottom: 0.25rem;
          line-height: 1.5;
        }

        /* Footer strip */
        .inv-footer-strip {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e4e4e7;
        }
        .inv-footer-block {
          font-size: 0.74rem;
          color: #27272a;
          line-height: 1.7;
        }
        .inv-footer-tagline {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.78rem;
          font-style: italic;
          color: #71717a;
          padding-top: 0.75rem;
          border-top: 1px dashed #e4e4e7;
        }
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
                    {sale.customer_phone && (
                      <><br /><span style={{ fontSize: '.74rem', color: '#6b5e52' }}>📞 {sale.customer_phone}</span></>
                    )}
                    {(sale.customer_address || sale.customer_city) && (
                      <>
                        <br />
                        <span style={{ fontSize: '.74rem', color: '#6b5e52' }}>
                          📍 {[sale.customer_address, sale.customer_city].filter(Boolean).join(', ')}
                        </span>
                      </>
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
                    <col style={{ width: '28px' }} />
                    <col />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: '85px' }} />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '75px' }} />
                    <col style={{ width: '95px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th className="r">Qty</th>
                      <th className="r">Rate (₹)</th>
                      <th className="r">Taxable (₹)</th>
                      <th className="r">GST%</th>
                      <th className="r">GST</th>
                      <th className="r">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item, idx) => {
                      const isBox = item.sell_mode === 'box'
                      const lineBase = item.line_total
                      const gstAmt = lineBase * item.tax_rate / 100
                      const lineTotalInclTax = lineBase + gstAmt

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
                          </td>
                          <td className="r">{qtyDisplay}</td>
                          <td className="r">{rupee(item.unit_price)}</td>
                          <td className="r">{rupee(lineBase)}</td>
                          <td className="r">{item.tax_rate}%</td>
                          <td className="r">{rupee(gstAmt)}</td>
                          <td className="r">{rupee(lineTotalInclTax)}</td>
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
                      {hasPaid && (
                        <tr className="paid-line">
                          <td>Amount Paid</td>
                          <td>− {rupee(sale.amount_paid)}</td>
                        </tr>
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
                  <div className="inv-footer-block flex items-center justify-end gap-3" style={{ textAlign: 'right' }}>
                    <div>
                      <div className="inv-meta-lbl">UPI / Quick Pay</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1612', fontFamily: 'monospace' }}>{SHOP.upi}</div>
                      <div style={{ fontSize: '10px', color: '#6b5e52', marginTop: '2px' }}>Scan QR to pay instantly</div>
                    </div>
                    <img 
                      src="/narayani-upi-qr.jpg" 
                      alt="UPI QR" 
                      className="size-[64px] object-contain border border-gray-200 rounded p-0.5 bg-white shrink-0 shadow-sm"
                    />
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
