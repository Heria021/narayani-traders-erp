'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'
import type { SaleWithItems } from './types'
import { PAYMENT_METHOD_LABELS } from './types'
import { SHOP } from '@/lib/config/shop'

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
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────

export function InvoiceModal({ open, sale, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || !sale) return null

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
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #nt-invoice-print-root { display: block !important; }
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

        @media print {
          .inv-content { padding: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white dark:bg-white rounded-2xl shadow-2xl flex flex-col">

          {/* ── Action bar (no-print) ──────────────────────────────────────── */}
          <div className="no-print flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-5 py-3 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold inv-badge ${isUdhaar ? (hasPaid ? 'inv-badge--partial' : 'inv-badge--due') : 'inv-badge--paid'}`}>
                {isUdhaar ? (hasPaid ? 'Partial' : 'Udhaar') : '✓ Paid'}
              </span>
              <span className="font-mono text-sm font-bold text-gray-800">
                {sale.invoice_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.print()}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Printer className="size-3.5" />
                Print / PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* ── Scrollable invoice ─────────────────────────────────────────── */}
          <div
            id="nt-invoice-print-root"
            className="overflow-y-auto overscroll-contain [scrollbar-width:thin] flex-1"
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
                  </colgroup>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th className="r">Qty</th>
                      <th className="r">Rate</th>
                      <th className="r">Amount</th>
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
          </div>{/* /scrollable */}
        </div>
      </div>
    </>
  )
}
