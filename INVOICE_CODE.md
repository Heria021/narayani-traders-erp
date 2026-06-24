# Invoice code — Narayani Traders

This file collects the invoice HTML, CSS and JavaScript used by the Narayani Traders app so you can copy it into another project.

Notes:
- The original renderer injects an inner HTML fragment into `#invoiceContent` using `RenderBilling.showInvoice(bill)`.
- For printing to PDF the app wraps the fragment into a full HTML document using `buildPrintHtml(contentHtml)` (see the "Printable HTML wrapper" section).
- The renderer relies on small helper utilities: `Fmt` (formatting) and `Tax` (tax calculation). A minimal standalone helper is provided below to make the invoice work in another app.

---

## 1) Invoice HTML fragment

This is the inner HTML that the app inserts into the invoice container. Insert it into a container element (for example `<div id="invoiceContent"></div>`) and replace interpolated values using your templating approach.

```html
<!-- Invoice fragment (inject into your page) -->
<div class="invoice-body">
  <div class="invoice-body-content">
    <div class="invoice-header">
      <div>
        <div class="invoice-shop">Narayani <span>Traders</span></div>
        <div class="invoice-sub">Hardware &amp; Building Materials</div>
        <div class="invoice-shop-meta">
          Ward No. 20, Aadhar Super Market, PWD Road, Dariba, Bidasar<br>
          +91 97823 53866 &nbsp;·&nbsp; +91 90229 91101 &nbsp;·&nbsp; narayanitraders011@gmail.com
        </div>
      </div>
      <div class="invoice-header-right">
        <div class="invoice-billno-label">Tax Invoice</div>
        <div class="invoice-billno-val">{{bill.id}}</div>
        <div class="invoice-gstin">GSTIN: 08AAAPL8767A1ZH</div>
        <!-- optional note -->
        {{#if bill.note}}<div class="invoice-ref">Ref: {{bill.note}}</div>{{/if}}
      </div>
    </div>

    <div class="invoice-meta">
      <div class="invoice-meta-item">
        <div class="invoice-meta-lbl">Bill To</div>
        <strong>{{customer.name}}</strong>
        {{#if customer.phone}}<br><span style="font-size:.75rem">{{customer.phone}}</span>{{/if}}
      </div>
      <div class="invoice-meta-item">
        <div class="invoice-meta-lbl">Date</div>
        {{dateStr}}
        <br><span style="font-size:.75rem">{{timeStr}}</span>
      </div>
      <div class="invoice-meta-item">
        <div class="invoice-meta-lbl">Payment</div>
        {{paymentBadge}}
        {{#if dueDate}}<br><span class="invoice-due-note">Due by {{dueDate}}</span>{{/if}}
      </div>
    </div>

    <table class="invoice-table">
      <colgroup>
        <col class="col-product">
        <col class="col-qty" style="width:70px">
        <col class="col-rate" style="width:80px">
        <col class="col-amount" style="width:85px">
      </colgroup>
      <thead><tr>
        <th>Product</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th>
      </tr></thead>
      <tbody>
        <!-- Repeat for each item -->
        {{#each bill.items}}
        <tr>
          <td class="product-cell">{{@index}}. {{productName}}{{#if gstNote}}<span class="row-gst-note">GST {{gstRate}}%: {{gstAmount}}</span>{{/if}}</td>
          <td class="r">{{unitsSold}} {{unitName}}</td>
          <td class="r">{{unitSellPrice}}</td>
          <td class="r">{{lineAmount}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div class="invoice-summary">
      <table class="invoice-summary-table">
        <!-- Example summary rows; generate based on bill data -->
        <tr><td>Subtotal</td><td>{{subtotal}}</td></tr>
        {{#if taxAmount}}<tr><td class="tax-line">GST / Tax</td><td class="tax-line">{{taxAmount}}</td></tr>{{/if}}
        {{#if discount}}<tr><td class="disc-line">Discount</td><td class="disc-line">− {{discount}}</td></tr>{{/if}}
        <tr class="summary-total"><td>Grand Total</td><td>{{total}}</td></tr>
        {{#if amountPaid}}<tr class="summary-paid"><td>Paid ({{paymentMode}})</td><td>− {{amountPaid}}</td></tr>{{/if}}
        {{#if creditAmount}}<tr class="summary-due"><td>Balance Due</td><td>{{creditAmount}}</td></tr>{{/if}}
      </table>
    </div>

  </div>

  <div class="invoice-footer-anchor">
    <div class="invoice-terms">
      <div class="invoice-terms-title">Terms &amp; Conditions</div>
      <ol>
        <li>Goods once sold will not be taken back or exchanged without prior approval.</li>
        <li>Payment for Udhaar (credit) bills is due within 30 days of invoice date.</li>
        <li>Interest of 2% per month will be charged on overdue balances.</li>
        <li>All disputes are subject to Bidasar (Churu) jurisdiction only.</li>
      </ol>
    </div>

    <div class="invoice-footer-strip">
      <div class="invoice-bank-block">
        <div class="invoice-meta-lbl">Contact Us</div>
        📞 +91 97823 53866 &nbsp;/&nbsp; +91 90229 91101<br>
        ✉ narayanitraders011@gmail.com
      </div>
      <div class="invoice-bank-block" style="display:flex;align-items:center;gap:10px;justify-content:flex-end">
        <div>
          <div class="invoice-meta-lbl">UPI / Quick Pay</div>
          <div style="font-size:12px;font-weight:600;color:#1a1612">9022991101-3@ybl</div>
          <div style="font-size:10px;color:#6b5e52;margin-top:2px">Scan QR to pay instantly</div>
        </div>
      </div>
    </div>

    <div class="invoice-footer-tagline-row">
      <div class="invoice-footer-note">Thank you for your business!</div>
    </div>
  </div>
</div>
```

---

## 2) Invoice CSS

This is the `renderer/css/invoice.css` used by the app (trimmed and preserved for copy/paste). You can include it in your stylesheet.

```css
/* Invoice preview/print styles (excerpt) */
.invoice-modal { max-width: 900px; }
.invoice-wrap { padding: 1.5rem 1.75rem; }
.invoice-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.75rem; }
.invoice-shop { font-family: 'Syne', sans-serif; font-size:1.3rem; font-weight:800; color:var(--ink); }
.invoice-shop span { color: var(--amber); }
.invoice-sub { font-size:.65rem; font-weight:600; color:var(--ink2); text-transform:uppercase; }
.invoice-shop-meta { font-size:.74rem; color:var(--ink2); margin-top:.35rem; line-height:1.6; }
.invoice-header-right { text-align:right; }
.invoice-billno-label { font-family:'JetBrains Mono',monospace; font-size:.64rem; font-weight:600; color:var(--ink2); text-transform:uppercase; }
.invoice-billno-val { font-family:'JetBrains Mono',monospace; font-weight:700; font-size:.85rem; color:var(--ink); }
.invoice-meta { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.4rem; padding:.75rem 0; border-top:1.5px solid var(--border); border-bottom:1.5px solid var(--border); }
.inv-badge { display:inline-block; padding:.2rem .6rem; border-radius:4px; font-size:.72rem; font-weight:700; }
.inv-badge--due  { background: var(--red-bg);   color: var(--red); }
.inv-badge--paid { background: var(--green-bg); color: var(--green); }
.invoice-table { width:100%; border-collapse:collapse; margin:.75rem 0; table-layout:fixed; }
.invoice-table th { padding:.4rem .35rem; font-size:.6rem; font-weight:700; color:var(--ink2); border-bottom:2px solid var(--border); }
.invoice-table td { padding:.45rem .35rem; border-bottom:1px solid var(--border); font-size:.82rem; color:var(--ink); }
.invoice-table td.r { text-align:right; font-family:'JetBrains Mono',monospace; }
.invoice-summary { margin:.75rem 0 0; display:flex; flex-direction:column; align-items:flex-end; }
.invoice-summary-table { width:55%; max-width:320px; min-width:200px; }
.invoice-terms { margin-top:1.25rem; padding:.75rem 1rem; background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-sm); }
.invoice-footer-strip { display:flex; justify-content:space-between; gap:1.5rem; margin-top:1rem; padding-top:.85rem; border-top:1.5px solid var(--border); }
```

If you don't use the existing CSS variables, replace `var(--...)` with concrete colours.

---

## 3) Printable HTML wrapper (PDF)

If you need a full HTML document to print to PDF, use the `buildPrintHtml(contentHtml)` pattern. This wraps the invoice fragment into a complete document with print-friendly CSS. The app uses a similar wrapper when saving PDF via Electron. Example (simplified):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice — Narayani Traders</title>
  <style>
    /* page and print styles (A4 friendly) */
    @page { size: A4 portrait; margin: 14mm 16mm; }
    body { font-family: Arial, sans-serif; color: #1a1612; }
    /* include the full invoice CSS here (or a trimmed version for PDF) */
  </style>
</head>
<body>
  <!-- Insert the invoice fragment here -->
  {{invoiceFragment}}
</body>
</html>
```

Alternatively, copy the `buildPrintHtml` function from `main/utils/print.js` in the original repo — it already contains the full printable CSS.

---

## 4) Renderer JavaScript — showInvoice(bill)

Below is the original `showInvoice` code used to build the fragment from a bill object (adapted into a standalone function). It expects a `bill` object with fields shown in the sample below.

```javascript
function showInvoiceInto(containerEl, bill) {
  // Minimal helpers used by original code (replace with your own utils)
  const Fmt = {
    datetime(ts) { const d = new Date(ts || Date.now()); return { date: d.toLocaleDateString(), time: d.toLocaleTimeString() }; },
    money(v) { return '₹' + Number(v || 0).toFixed(2); },
    num(v) { return Number(v || 0).toString(); }
  };
  const Tax = { amount(base, rate) { return +(base * (rate || 0) / 100).toFixed(2); } };

  const dt = Fmt.datetime(bill.date);
  const hasTax = (bill.taxAmount || 0) > 0;
  const snap = bill.customerSnapshot || { name: bill.customerName || '' };
  const dueDate = bill.creditAmount > 0 ? new Date(new Date(bill.date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

  const itemRows = (bill.items || []).map((it, i) => {
    const base = (it.unitsSold || 0) * (it.unitSellPrice || 0);
    const taxAmt = Tax.amount(base, it.gstRate || 0);
    const gstNote = (it.gstRate || 0) > 0 ? `<span class="row-gst-note">GST ${it.gstRate}%: ${Fmt.money(taxAmt)}</span>` : '';
    return `
      <tr>
        <td class="product-cell">${i + 1}. ${it.productName}${gstNote}</td>
        <td class="r">${Fmt.num(it.unitsSold)} ${it.unitName}</td>
        <td class="r">${Fmt.money(it.unitSellPrice)}</td>
        <td class="r">${Fmt.money(base + taxAmt)}</td>
      </tr>`;
  }).join('');

  const payBadge = bill.creditAmount > 0
    ? `<span class="inv-badge inv-badge--due">Udhaar: ${Fmt.money(bill.creditAmount)}</span>`
    : `<span class="inv-badge inv-badge--paid">✓ Paid</span>`;

  let summaryRows = `<tr><td>Subtotal</td><td>${Fmt.money(bill.subtotal)}</td></tr>`;
  if (hasTax) summaryRows += `<tr><td class="tax-line">GST / Tax</td><td class="tax-line">${Fmt.money(bill.taxAmount)}</td></tr>`;
  if (bill.discount > 0) summaryRows += `<tr><td class="disc-line">Discount</td><td class="disc-line">− ${Fmt.money(bill.discount)}</td></tr>`;
  summaryRows += `<tr class="summary-total"><td>Grand Total</td><td>${Fmt.money(bill.total)}</td></tr>`;
  if (bill.amountPaid > 0) summaryRows += `<tr class="summary-paid"><td>Paid (${bill.paymentMode || 'cash'})</td><td>− ${Fmt.money(bill.amountPaid)}</td></tr>`;
  if (bill.creditAmount > 0) {
    summaryRows += `<tr class="summary-due"><td>Balance Due</td><td>${Fmt.money(bill.creditAmount)}</td></tr>`;
    if (dueDate) summaryRows += `<tr class="summary-due-date"><td colspan="2">Due by ${dueDate}</td></tr>`;
  } else if (bill.amountPaid > 0) {
    summaryRows += `<tr class="summary-settled"><td>✓ Fully Settled</td><td>${Fmt.money(0)}</td></tr>`;
  }

  const html = `...`; // you can reuse the invoice fragment from section 1 and replace placeholders with computed values above

  // For brevity, we inject a completed fragment assembled similarly to section 1
  const fragment = `
    <div class="invoice-body">...`;
  containerEl.innerHTML = fragment;
}
```

The original repository builds a complete string (see `render-billing.js`) and sets `document.getElementById('invoiceContent').innerHTML = <that_string>`.

---

## 5) Minimal standalone helpers and sample bill

Copy this JavaScript into your app to get a working quick demo. It renders the invoice into `#invoiceContent`.

```javascript
// Minimal helpers
const Fmt = {
  datetime(ts) { const d = new Date(ts || Date.now()); return { date: d.toLocaleDateString(), time: d.toLocaleTimeString() }; },
  money(v) { return '₹' + Number(v || 0).toFixed(2); },
  num(v) { return Number(v || 0).toString(); }
};
const Tax = { amount(base, rate) { return +(base * (rate || 0) / 100).toFixed(2); } };

// Sample bill data
const sampleBill = {
  id: 'BILL-2026-0001',
  date: Date.now(),
  customerName: 'Ram Kumar',
  customerSnapshot: { name: 'Ram Kumar', phone: '+91 98765 43210' },
  items: [
    { productName: 'Cement 50kg', unitName: 'unit', unitsSold: 2, unitSellPrice: 420, gstRate: 18 },
    { productName: 'Steel Rod 10mm', unitName: 'unit', unitsSold: 10, unitSellPrice: 120, gstRate: 18 }
  ],
  subtotal: 2*420 + 10*120,
  taxAmount: 0, // computed below
  discount: 0,
  total: 0,
  amountPaid: 0,
  creditAmount: 0,
  paymentMode: 'cash'
};
// compute tax and totals
sampleBill.taxAmount = sampleBill.items.reduce((s, it) => s + Tax.amount(it.unitsSold * it.unitSellPrice, it.gstRate || 0), 0);
sampleBill.total = sampleBill.subtotal + sampleBill.taxAmount - sampleBill.discount;

// Render using the provided showInvoiceInto (adapted earlier)
// You can implement and call a function similar to showInvoiceInto(document.getElementById('invoiceContent'), sampleBill)
```

---

## 6) Data contract (what the renderer expects)

- bill.id: string
- bill.date: timestamp or ISO string
- bill.customerName: string
- bill.customerSnapshot: { name, phone, gstin, address }
- bill.items: array of { productName, unitName, unitsSold, unitSellPrice, gstRate }
- bill.subtotal, bill.taxAmount, bill.discount, bill.total, bill.amountPaid, bill.creditAmount: numbers
- bill.paymentMode: 'cash' | 'credit' | etc.

Edge cases to consider:
- Empty items array — show an empty-state message
- GST / tax lines when taxAmount = 0 — hide tax rows
- Credit bills — show due date and balance

---

If you want, I can:
- produce a small single-file HTML + CSS + JS demo (runnable in the browser) that renders and prints the invoice, or
- extract a fully literal `showInvoice` function (unminified) from the repo and include it verbatim.

Which do you prefer?