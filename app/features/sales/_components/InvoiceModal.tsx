'use client'

import { Button } from '@/components/ui/button'
import { Printer, CreditCard } from 'lucide-react'
import type { SaleWithItems } from './types'
import { SHOP } from '@/lib/config/shop'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function getWalkinDisplayName(sale: SaleWithItems): { name: string } {
  if (sale.customer_name !== 'Walk-in') return { name: sale.customer_name }
  if (sale.walkin_name) return { name: sale.walkin_name }
  return { name: 'Walk-in Customer' }
}

// ─── Shared style tokens ──────────────────────────────────────────────────────
// font-family and font-variant-numeric can't be expressed in stock Tailwind v3
// without arbitrary values — keep them as tiny reusable constants.
const MONO = { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' } as const
const MONO_600 = { ...MONO, fontWeight: 600 } as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  sale: SaleWithItems | null
  onClose: () => void
  onRecordPayment?: () => void
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────

export function InvoiceModal({ open, sale, onClose, onRecordPayment }: Props) {
  if (!sale) return null

  const customer = getWalkinDisplayName(sale)
  const hasTax = sale.tax_amount > 0
  const hasDiscount = sale.discount > 0
  const hasPaid = sale.amount_paid > 0
  const hasBalance = sale.balance_due > FLOAT_DUST

  // sale.created_at is UTC; toLocaleTimeString('en-IN') resolves to IST on
  // client browsers — correct for this single-shop Rajasthan deployment.
  const saleTime = new Date(sale.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>

      {/*
        ── Minimal <style> block ────────────────────────────────────────────────
        Only three things live here that Tailwind cannot express:
          1. @page  — no Tailwind equivalent
          2. body > [data-slot] print selectors — complex ancestor selectors
          3. .inv-page / .inv-table-zone / .inv-bottom print layout contract
             (needs !important overrides + calc(297mm - 16mm))
        Everything else is className / inline style below.
        ────────────────────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        @media print {
          /*
            1. Page size & margins
            ─────────────────────
            We use margin: 15mm (not 8mm) because Windows Chrome/Edge adds
            its own header + footer lines (URL, date, page number) that consume
            ~12–17mm of vertical space ON TOP of @page margins.
            15mm gives enough breathing room so nothing is clipped on any system.
            On Mac/Safari the result is slightly more padding — still looks good.
            Users who want tighter output should disable "Headers and footers"
            in the browser's print dialog (the print button tooltip says so).
          */
          @page { size: A4; margin: 15mm; }

          /* 2. Portal visibility — Tailwind can't reach body > [data-slot] */
          body > * { display: none !important; }
          body > [data-slot="sheet-portal"] { display: block !important; }
          body > [data-slot="sheet-portal"] [data-slot="sheet-content"] {
            display: block !important; background: white !important;
            border: none !important; box-shadow: none !important;
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; width: 100% !important;
            height: auto !important; position: absolute !important;
            top: 0 !important; left: 0 !important;
          }
          [data-slot="sheet-overlay"],
          [data-slot="sheet-header"],
          [data-slot="sheet-footer"],
          [data-slot="sheet-close"],
          .no-print { display: none !important; }
          #nt-invoice-print-root { display: block !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }

          /*
            3. A4 flex-column layout contract
            ──────────────────────────────────
            KEY CHANGE: No fixed height. We use min-height: 100vh so the page
            fills the printed area without hard-coding mm values that differ
            across browsers/OSes. overflow: visible (not hidden) means content
            is NEVER clipped — it simply flows to a second page if needed,
            which is far better than being cut off silently.
          */

         .inv-page {
            display: flex !important; flex-direction: column !important;
            min-height: 100vh !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .inv-table-zone {
            flex: 1 1 auto !important; min-height: 0 !important;
            display: flex !important; flex-direction: column !important;
            overflow: visible !important;
          }
          .inv-bottom { flex-shrink: 0 !important; margin-top: 0 !important; }
        }
      `}</style>

      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-full flex flex-col p-0 overflow-hidden border-l bg-stone-50 dark:bg-zinc-950"
      >
        {/* ── Sheet chrome header (screen only) ─────────────────────────────── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-white dark:bg-zinc-950 select-none">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-lg font-semibold tracking-tight">
                Invoice Details
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Bill #{sale.invoice_number} &middot; {customer.name}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Printable invoice body ─────────────────────────────────────────── */}
        <div
          id="nt-invoice-print-root"
          className="flex-1 overflow-y-auto bg-white text-black [scrollbar-width:thin] select-text"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}
        >
          {/*
            .inv-page   → flex col on screen; rigid A4 flex col on print (via <style>)
            .inv-table-zone → flex:1 on print, so spare space lives here
            .inv-bottom → flex-shrink:0 on print, always at page bottom
          */}
          <div className="inv-page flex flex-col p-3">

            {/* ── Shop Header ─────────────────────────────────────────────── */}
            <div className="flex justify-between items-start mb-4">
              {/* Left: brand */}
              <div className="flex flex-col">
                <span
                  className="font-extrabold leading-tight text-black"
                  style={{ fontSize: '1.4rem', letterSpacing: '-0.03em' }}
                >
                  {SHOP.name1} {SHOP.name2}
                </span>
                <span
                  className="font-semibold uppercase text-black mt-0.5"
                  style={{ fontSize: '0.63rem', letterSpacing: '0.1em' }}
                >
                  {SHOP.tagline}
                </span>
                <span className="text-[#404040] mt-0.5 leading-snug" style={{ fontSize: '0.72rem' }}>
                  Phone: {SHOP.phone1}<br />Email: {SHOP.email}
                </span>
              </div>
              {/* Right: invoice meta */}
              <div className="flex flex-col items-end text-right">
                <span
                  className="font-extrabold uppercase text-black leading-tight mb-1.5"
                  style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}
                >
                  ESTIMATE INVOICE
                </span>
                <span className="text-black" style={{ fontSize: '0.8rem' }}>
                  Invoice No: <span style={MONO_600}>{sale.invoice_number}</span>
                </span>
                <span className="text-black mt-0.5" style={{ fontSize: '0.8rem' }}>
                  Date: <span style={MONO_600}>{fmtDate(sale.sale_date)}</span>
                  &nbsp;·&nbsp;
                  <span style={MONO_600}>{saleTime}</span>
                </span>
              </div>
            </div>

            {/* ── From / Bill To ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-6 border-t border-b border-black py-2 mb-0">
              {/* From */}
              <div className="flex flex-col">
                <span
                  className="font-bold uppercase text-black mb-1"
                  style={{ fontSize: '0.63rem', letterSpacing: '0.08em' }}
                >
                  From
                </span>
                <span className="text-black leading-relaxed" style={{ fontSize: '0.78rem' }}>
                  <strong>{SHOP.name1} {SHOP.name2}</strong><br />
                  {SHOP.address.includes('PWD Road') ? (
                    <>{SHOP.address.split('PWD Road')[0]}<br />PWD Road{SHOP.address.split('PWD Road')[1]}</>
                  ) : SHOP.address}<br />
                  <span style={{ ...MONO_600, fontSize: '0.74rem' }}>GSTIN: {SHOP.gstin}</span>
                </span>
              </div>
              {/* Bill To */}
              <div className="flex flex-col">
                <span
                  className="font-bold uppercase text-black mb-1"
                  style={{ fontSize: '0.63rem', letterSpacing: '0.08em' }}
                >
                  Bill To
                </span>
                <span className="text-black leading-relaxed" style={{ fontSize: '0.78rem' }}>
                  <strong>{customer.name}</strong>
                  {sale.customer_phone && <><br />Phone: {sale.customer_phone}</>}
                  {(sale.customer_address || sale.customer_city) && (
                    <><br />Address: {[sale.customer_address, sale.customer_city].filter(Boolean).join(', ')}</>
                  )}
                </span>
              </div>
            </div>

            {/* ── Table Zone (flex:1 on print → spare space lives here) ─────── */}
            <div className="inv-table-zone flex flex-col">
              <table className="w-full border-collapse mt-2.5" style={{ fontSize: '0.78rem' }}>
                <colgroup>
                  <col style={{ width: 36 }} /><col />
                  <col style={{ width: 80 }} /><col style={{ width: 90 }} />
                  <col style={{ width: 60 }} /><col style={{ width: 110 }} />
                </colgroup>
                <thead>
                  <tr>
                    {(['S.N.', 'Product Description'] as const).map((h, i) => (
                      <th
                        key={h}
                        className="text-left text-black border-b-2 border-black pb-2 pt-2 px-1.5"
                        style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                      >
                        {h}
                      </th>
                    ))}
                    {(['Qty', 'Rate (₹)', 'GST%', 'Total (₹)'] as const).map(h => (
                      <th
                        key={h}
                        className="text-right text-black border-b-2 border-black pb-2 pt-2 px-1.5"
                        style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                      >
                        {h}
                      </th>
                    ))}
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
                        {/* S.N. */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle text-[#737373]" style={{ fontSize: '0.76rem' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        {/* Product */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle">
                          <span className="font-medium text-black">{item.product_name}</span>
                          {isBox && item.units_per_box && (
                            <span className="block text-[#555] mt-0.5" style={{ fontSize: '0.66rem' }}>
                              Pack: {item.box_count} {item.box_name} × {item.units_per_box} {item.unit_name}
                              {' '}= {item.quantity} {item.unit_name}
                            </span>
                          )}
                        </td>
                        {/* Qty */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle text-right" style={{ ...MONO, fontSize: '0.74rem' }}>
                          {qtyDisplay}
                        </td>
                        {/* Rate */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle text-right" style={{ ...MONO, fontSize: '0.74rem' }}>
                          {rupee(item.unit_price)}
                        </td>
                        {/* GST% */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle text-right" style={{ ...MONO, fontSize: '0.74rem', fontWeight: 500 }}>
                          {item.tax_rate}%
                        </td>
                        {/* Total */}
                        <td className="py-2 px-1.5 border-b border-[#e5e5e5] align-middle text-right" style={{ ...MONO, fontSize: '0.74rem', fontWeight: 500 }}>
                          {rupee(lineTotalInclTax)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>{/* /inv-table-zone */}

            {/* ── Bottom block: summary + terms + bank ──────────────────────────
                On screen: flows naturally after the table.
                On print:  flex-shrink:0 via <style>, always anchored to page bottom.
                The spare empty space (few items) lives in .inv-table-zone above. */}
            <div className="inv-bottom mt-2">

              {/* Totals summary */}
              <div className="flex justify-end mt-2 mb-2">
                <table className="border-collapse" style={{ width: '58%', maxWidth: 320, minWidth: 220 }}>
                  <tbody>
                    <tr>
                      <td className="py-1.5 px-1.5 text-black" style={{ fontSize: '0.78rem' }}>Subtotal</td>
                      <td className="py-1.5 px-1.5 text-right text-black font-semibold" style={{ ...MONO, fontSize: '0.78rem' }}>{rupee(sale.subtotal)}</td>
                    </tr>
                    {hasTax && (
                      <tr>
                        <td className="py-1.5 px-1.5 text-[#404040]" style={{ fontSize: '0.78rem' }}>GST Output Tax</td>
                        <td className="py-1.5 px-1.5 text-right text-[#404040] font-semibold" style={{ ...MONO, fontSize: '0.78rem' }}>{rupee(sale.tax_amount)}</td>
                      </tr>
                    )}
                    {hasDiscount && (
                      <tr>
                        <td className="py-1.5 px-1.5 text-black" style={{ fontSize: '0.78rem' }}>Discount</td>
                        <td className="py-1.5 px-1.5 text-right text-black font-semibold" style={{ ...MONO, fontSize: '0.78rem' }}>− {rupee(sale.discount)}</td>
                      </tr>
                    )}
                    {/* Grand Total */}
                    <tr style={{ borderTop: '1px solid #000', borderBottom: '2px solid #000' }}>
                      <td className="pt-2 pb-2 px-1.5 font-extrabold text-black" style={{ fontSize: '0.9rem' }}>Grand Total</td>
                      <td className="pt-2 pb-2 px-1.5 text-right font-extrabold text-black" style={{ ...MONO, fontSize: '0.9rem' }}>{rupee(sale.grand_total)}</td>
                    </tr>
                    {hasPaid && (
                      <tr>
                        <td className="py-1.5 px-1.5 text-black" style={{ fontSize: '0.78rem' }}>Amount Paid</td>
                        <td className="py-1.5 px-1.5 text-right text-black font-semibold" style={{ ...MONO, fontSize: '0.78rem' }}>− {rupee(sale.amount_paid)}</td>
                      </tr>
                    )}
                    {hasBalance ? (
                      <tr style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>
                        <td className="py-1.5 px-1.5 font-bold text-black" style={{ fontSize: '0.78rem' }}>Balance Due</td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-black" style={{ ...MONO, fontSize: '0.78rem' }}>{rupee(sale.balance_due)}</td>
                      </tr>
                    ) : hasPaid ? (
                      <tr>
                        <td colSpan={2} className="py-1.5 px-1.5 text-black" style={{ fontSize: '0.78rem' }}>✓ Fully Settled</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-black rounded-[5px] px-2.5 py-1.5 mt-2">
                <div
                  className="font-bold uppercase text-black mb-1"
                  style={{ fontSize: '0.63rem', letterSpacing: '0.08em' }}
                >
                  Terms &amp; Conditions
                </div>
                <ul className="list-disc pl-4 m-0">
                  {SHOP.terms.map((t, i) => (
                    <li key={i} className="text-black mb-0.5 leading-snug" style={{ fontSize: '0.68rem' }}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Bank Details + UPI QR */}
              <div className="flex justify-between items-end border-t border-black pt-2.5 mt-2.5">
                {/* Bank */}
                <div className="text-black leading-relaxed" style={{ fontSize: '0.7rem' }}>
                  <div
                    className="font-bold uppercase text-black mb-1"
                    style={{ fontSize: '0.63rem', letterSpacing: '0.05em' }}
                  >
                    Bank Details
                  </div>
                  <span className="font-semibold">Bank Name:</span> {SHOP.bankName}<br />
                  <span className="font-semibold">A/C Name:</span> {SHOP.name1} {SHOP.name2}<br />
                  <span className="font-semibold">Account No:</span>{' '}
                  <span style={MONO_600}>{SHOP.bankAccNo}</span><br />
                  <span className="font-semibold">IFSC Code:</span>{' '}
                  <span style={MONO_600}>{SHOP.bankIfsc}</span>
                </div>
                {/* UPI QR */}
                <div className="flex items-center gap-5">
                  <div className="flex flex-col text-right">
                    <span
                      className="font-bold uppercase text-black mb-0.5"
                      style={{ fontSize: '0.63rem', letterSpacing: '0.08em' }}
                    >
                      UPI Quick Pay
                    </span>
                    <span style={{ ...MONO_600, fontSize: '0.8rem' }} className="text-black">{SHOP.upi}</span>
                    <span className="text-[#555] mt-0.5" style={{ fontSize: '0.66rem' }}>Scan QR to pay instantly</span>
                  </div>
                  <img src="/narayani-upi-qr.jpg" alt="UPI QR" className="w-[88px] h-[88px] object-contain" />
                </div>
              </div>

              {/* Tagline */}
              <div
                className="mt-2.5 text-center italic text-[#555] border-t border-dashed border-black pt-1.5"
                style={{ fontSize: '0.72rem' }}
              >
                Thank you for your business!
              </div>

            </div>{/* /inv-bottom */}

          </div>{/* /inv-page */}
        </div>{/* /nt-invoice-print-root */}

        {/* ── Sheet footer (screen only) ─────────────────────────────────────── */}
        <SheetFooter className="px-8 py-5 border-t shrink-0 flex flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-950 no-print select-none">
          <Button type="button" variant="outline" onClick={onClose}>
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
              title="Tip: In the print dialog, set Margins to 'None' or disable Headers & Footers for best results on all devices."
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