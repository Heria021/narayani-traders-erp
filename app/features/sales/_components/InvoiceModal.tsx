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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

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
          .inv-footer-section {
            margin-top: auto !important;
          }
        }

        #nt-invoice-print-root {
          display: block;
        }

        /* ── Base Reset (Black & White Theme) ── */
        .inv-body {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #000000;
          background-color: #ffffff;
          font-size: 12px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .inv-content {
          padding: 2.25rem 2rem;
        }

        /* ── Header ── */
        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.75rem;
        }
        .inv-brand {
          display: flex;
          flex-direction: column;
        }
        .inv-shop-name {
          font-size: 1.45rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .inv-shop-sub {
          font-size: 0.65rem;
          font-weight: 600;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.25rem;
        }
        .inv-header-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .inv-title {
          font-size: 1.45rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #000000;
          line-height: 1.2;
          margin-bottom: 0.5rem;
        }
        .inv-billno-val {
          font-size: 0.82rem;
          color: #000000;
        }
        .inv-billno-val .mono {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
        }

        /* ── Metadata Grid ── */
        .inv-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 0.6rem 0;
          border-top: 1px solid #000000;
          border-bottom: 1px solid #000000;
          margin-bottom: 0.75rem;
        }
        .inv-meta-col {
          display: flex;
          flex-direction: column;
        }
        .inv-meta-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }
        .inv-meta-value {
          font-size: 0.8rem;
          color: #000000;
          line-height: 1.5;
        }
        .inv-meta-value strong {
          font-weight: 700;
        }
        .inv-meta-value .mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76rem;
          font-weight: 600;
        }

        /* ── Status Badges ── */
        .inv-status {
          display: inline-flex;
          align-items: center;
          padding: 0.12rem 0.4rem;
          border-radius: 4px;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid #000000;
          color: #000000;
          background-color: #ffffff;
        }

        /* ── Table Layout ── */
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
        }
        .inv-table th {
          font-size: 0.62rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.65rem 0.45rem;
          border-bottom: 2px solid #000000;
          text-align: left;
        }
        .inv-table th.r {
          text-align: right;
        }
        .inv-table td {
          padding: 0.75rem 0.45rem;
          border-bottom: 1px solid #e5e5e5;
          font-size: 0.8rem;
          color: #000000;
          vertical-align: middle;
        }
        .inv-table td.r {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76rem;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .inv-table td.qty {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76rem;
          font-variant-numeric: tabular-nums;
        }
        .inv-table td.rate {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.76rem;
          font-variant-numeric: tabular-nums;
        }
        .inv-table .row-product-name {
          font-weight: 500;
          color: #000000;
        }
        .inv-table .row-box-desc {
          display: block;
          font-size: 0.68rem;
          color: #404040;
          margin-top: 0.2rem;
        }

        /* ── Totals/Summary ── */
        .inv-summary-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .inv-summary-box {
          width: 60%;
          max-width: 340px;
          min-width: 240px;
          border-collapse: collapse;
        }
        .inv-summary-box td {
          padding: 0.4rem 0.45rem;
          font-size: 0.8rem;
          color: #000000;
        }
        .inv-summary-box td:last-child {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          font-weight: 600;
          color: #000000;
          font-variant-numeric: tabular-nums;
        }
        .inv-summary-box .grand-total-row {
          border-top: 1px solid #000000;
          border-bottom: 2px solid #000000;
        }
        .inv-summary-box .grand-total-row td {
          font-weight: 800;
          font-size: 0.95rem;
          color: #000000;
          padding-top: 0.65rem;
          padding-bottom: 0.65rem;
        }
        .inv-summary-box .grand-total-row td:last-child {
          font-size: 0.95rem;
          font-weight: 800;
        }
        .inv-summary-box .balance-row td {
          color: #000000;
          font-weight: 700;
          padding: 0.55rem 0.45rem;
          border-top: 1px dashed #000000;
          border-bottom: 1px dashed #000000;
        }

        /* ── Terms & Notes ── */
        .inv-notes-terms {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }
        .inv-terms-card {
          border: 1px solid #000000;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          width: 100%;
        }
        .inv-terms-title {
          font-size: 0.65rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.3rem;
        }
        .inv-terms-list {
          margin: 0;
          padding-left: 1.25rem;
          list-style-type: disc !important;
        }
        .inv-terms-list li {
          font-size: 0.7rem;
          color: #000000;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        /* ── Footer / Payment block ── */
        .inv-footer-strip {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid #000000;
          padding-top: 0.75rem;
          margin-top: 0.75rem;
        }
        .inv-contact-details {
          font-size: 0.72rem;
          color: #000000;
          line-height: 1.6;
        }
        .inv-contact-details .label {
          font-weight: 600;
        }
        .inv-pay-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: transparent;
          border: none;
          padding: 0;
        }
        .inv-pay-info {
          display: flex;
          flex-direction: column;
          text-align: right;
        }
        .inv-pay-title {
          font-size: 0.65rem;
          font-weight: 700;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.2rem;
        }
        .inv-pay-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: #000000;
        }
        .inv-pay-sub {
          font-size: 0.68rem;
          color: #404040;
          margin-top: 0.15rem;
        }
        .inv-qr-img {
          width: 96px;
          height: 96px;
          object-fit: contain;
        }
        .inv-tagline {
          margin-top: 0.75rem;
          text-align: center;
          font-size: 0.74rem;
          font-style: italic;
          color: #404040;
          letter-spacing: 0.02em;
          padding-top: 0.5rem;
          border-top: 1px dashed #000000;
        }
      `}</style>

      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-full flex flex-col p-0 overflow-hidden border-l bg-stone-50 dark:bg-zinc-950"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-white dark:bg-zinc-950 select-none">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-semibold tracking-tight">
                  Invoice Details
                </SheetTitle>
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
                  <div className="inv-brand">
                    <div className="inv-shop-name">
                      {SHOP.name1}{SHOP.name2}
                    </div>
                    <div className="inv-shop-sub">{SHOP.tagline}</div>
                    <div style={{ fontSize: '0.74rem', color: '#404040', marginTop: '0.2rem', lineHeight: 1.45 }}>
                      Phone: {SHOP.phone1}<br />
                      Email: {SHOP.email}
                    </div>
                  </div>
                  <div className="inv-header-right">
                    <div className="inv-title">TAX INVOICE</div>
                    <div className="inv-billno-val">
                      Invoice No: <span className="mono">{sale.invoice_number}</span>
                    </div>
                    <div className="inv-billno-val" style={{ marginTop: '0.15rem' }}>
                      Date: <span className="mono">{fmtDate(sale.sale_date)}</span> &nbsp;·&nbsp; <span className="mono">{saleTime}</span>
                    </div>
                    {/* Status removed */}
                  </div>
                </div>

                {/* ── Meta grid (From & Bill To) ────────────────────────────── */}
                <div className="inv-meta-grid">
                  {/* From */}
                  <div className="inv-meta-col">
                    <div className="inv-meta-label">From</div>
                    <div className="inv-meta-value">
                      <strong>{SHOP.name1} {SHOP.name2}</strong><br />
                      Phone: {SHOP.phone1}<br />
                      Email: {SHOP.email}<br />
                      <span className="mono" style={{ fontSize: '0.76rem', fontWeight: 700 }}>GSTIN: {SHOP.gstin}</span>
                    </div>
                  </div>
                  {/* Bill To */}
                  <div className="inv-meta-col">
                    <div className="inv-meta-label">Bill To</div>
                    <div className="inv-meta-value">
                      <strong>{customer.name}</strong>
                      {sale.customer_phone && (
                        <><br />Phone: {sale.customer_phone}</>
                      )}
                      {(sale.customer_address || sale.customer_city) && (
                        <>
                          <br />
                          Address: {[sale.customer_address, sale.customer_city].filter(Boolean).join(', ')}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Items table ───────────────────────────────────────────── */}
                <table className="inv-table">
                  <colgroup>
                    <col style={{ width: '32px' }} />
                    <col />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Description</th>
                      <th className="r">Qty</th>
                      <th className="r">Rate (₹)</th>
                      <th className="r">Taxable (₹)</th>
                      <th className="r">GST%</th>
                      <th className="r">GST (₹)</th>
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
                        ? `${item.box_count} ${item.box_name ?? 'box'}${item.box_count !== 1 ? 's' : ''}`
                        : `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(3)} ${item.unit_name}`

                      return (
                        <tr key={item.id}>
                          <td style={{ color: '#737373', fontSize: '.78rem' }}>{String(idx + 1).padStart(2, '0')}</td>
                          <td>
                            <span className="row-product-name">{item.product_name}</span>
                            {isBox && item.units_per_box && (
                              <span className="row-box-desc">
                                Pack: {item.box_count} {item.box_name} × {item.units_per_box} {item.unit_name}
                                {' '}= {item.quantity} {item.unit_name}
                              </span>
                            )}
                          </td>
                          <td className="qty">{qtyDisplay}</td>
                          <td className="rate">{rupee(item.unit_price)}</td>
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
                <div className="inv-summary-container">
                  <table className="inv-summary-box">
                    <tbody>
                      {/* Subtotal */}
                      <tr>
                        <td>Subtotal</td>
                        <td>{rupee(sale.subtotal)}</td>
                      </tr>
                      {/* GST */}
                      {hasTax && (
                        <tr className="tax-row" style={{ color: '#404040' }}>
                          <td>GST Output Tax</td>
                          <td>{rupee(sale.tax_amount)}</td>
                        </tr>
                      )}
                      {/* Discount */}
                      {hasDiscount && (
                        <tr className="disc-row">
                          <td>Discount</td>
                          <td>− {rupee(sale.discount)}</td>
                        </tr>
                      )}
                      {/* Grand Total */}
                      <tr className="grand-total-row">
                        <td>Grand Total</td>
                        <td>{rupee(sale.grand_total)}</td>
                      </tr>
                      {/* Amount Paid */}
                      {hasPaid && (
                        <tr className="paid-row">
                          <td>Amount Paid</td>
                          <td>− {rupee(sale.amount_paid)}</td>
                        </tr>
                      )}
                      {/* Balance Due */}
                      {hasBalance ? (
                        <>
                          <tr className="balance-row">
                            <td>Balance Due</td>
                            <td>{rupee(sale.balance_due)}</td>
                          </tr>
                        </>
                      ) : hasPaid ? (
                        <tr className="settled-row">
                          <td colSpan={2}>✓ Fully Settled</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* ── Footer Section (Pushed to bottom on print) ── */}
                <div className="inv-footer-section">
                  {/* Terms & Notes Grid */}
                  <div className="inv-notes-terms">
                    {/* Terms & Conditions */}
                    <div className="inv-terms-card">
                      <div className="inv-terms-title">Terms &amp; Conditions</div>
                      <ul className="inv-terms-list">
                        {SHOP.terms.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    {/* Notes Card */}
                    {sale.notes && (
                      <div className="inv-terms-card">
                        <div className="inv-terms-title">Special Notes</div>
                        <p style={{ fontSize: '0.74rem', color: '#000000', margin: 0, lineHeight: 1.5 }}>
                          {sale.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer strip */}
                  <div className="inv-footer-strip">
                    <div className="inv-contact-details">
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Bank Details</div>
                      <span className="label">Bank Name:</span> {SHOP.bankName}<br />
                      <span className="label">A/C Name:</span> {SHOP.name1} {SHOP.name2}<br />
                      <span className="label">Account No:</span> <span className="mono" style={{ fontWeight: 600 }}>{SHOP.bankAccNo}</span><br />
                      <span className="label">IFSC Code:</span> <span className="mono" style={{ fontWeight: 600 }}>{SHOP.bankIfsc}</span>
                    </div>
                    <div className="inv-pay-card">
                      <div className="inv-pay-info">
                        <div className="inv-pay-title">UPI Quick Pay</div>
                        <div className="inv-pay-value">{SHOP.upi}</div>
                        <div className="inv-pay-sub">Scan QR to pay instantly</div>
                      </div>
                      <img 
                        src="/narayani-upi-qr.jpg" 
                        alt="UPI QR" 
                        className="inv-qr-img"
                      />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="inv-tagline">Thank you for your business!</div>
                </div>

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
                className="gap-1.5 border-zinc-200 text-zinc-900 hover:bg-zinc-50 shrink-0 font-medium"
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
