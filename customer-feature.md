# Customers Feature — Audit & Documentation

Narayani Traders ERP · Next.js + Supabase/Postgres  
Last audited: June 2025

---

## Shared ledger rules

These rules apply everywhere in the customers feature after the audit fixes.

| Concept | Formula / rule |
|--------|----------------|
| **Total Billed** | `SUM(sales.grand_total)` for the customer |
| **Total Paid** | `SUM(payments.amount)` for the customer |
| **Net Owed / Outstanding** | `opening_balance + total_billed − total_paid` |
| **Opening balance sign** | +ve = customer owes you; −ve = advance credit |
| **Credit limit** | `credit_limit = 0` → "No Limit" in UI; not enforced on sale creation |
| **Walk-in pseudo-customer** | Internal row `customers.name = '__walkin__'`, displayed as **Walk-in Customers**, `is_active = false` |

Implementation: `app/features/customers/_components/ledger.ts` (`computeNetOwed`, `customerDisplayName`, `isWalkinCustomer`).

---

## `/features/customers` — List page

**Route/file:** `app/features/customers/page.tsx`

**Purpose:** Master list of all customers with receivables summary, search/filter, and quick actions.

**Data it reads:**
- `customers` — all columns
- `sales` — `customer_id`, `grand_total` (aggregated per customer)
- `payments` — `customer_id`, `amount` (aggregated per customer)

**Data it writes:**
- Via `CustomerForm` → insert/update on `customers`
- Via `PaymentModal` → insert on `payments`; optional update on `sales` when linked to an invoice
- Row actions → update/delete on `customers`

**Business logic:**
- KPI **Total Active Customers** = count where `is_active = true` (includes walk-in row as inactive).
- KPI **Total Outstanding** = sum of positive Net Owed across all customers.
- KPI **Total Collected (ever)** = sum of all `payments.amount`.
- Table **Outstanding** column = Net Owed per customer (same formula as detail **Net Owed** card).
- Search matches display name, raw name, phone, GSTIN ("walk-in" finds the pseudo-customer).
- Filter **All / Active / Inactive / With Outstanding** applied client-side after enrichment.
- Credit limit column: `limit > 0` shows ₹ amount; else **No Limit**.
- Over-limit row styling when Net Owed ≥ credit limit (only when limit > 0).

**Edge cases handled:**
- Walk-in row shown as **Walk-in Customers**, INACTIVE badge, edit/deactivate/delete disabled.
- Zero or negative Net Owed shown as `—` in Outstanding column.
- Empty search/filter → friendly empty state.

**Known gaps / follow-ups:**
- Credit limit is advisory only — new sales are not blocked when over limit (see Sales / New Sale).
- List KPI counts walk-in in total collected if walk-in payments exist (correct aggregation).

---

## `/features/customers/[id]` — Detail page

**Route/file:** `app/features/customers/[id]/page.tsx`

**Purpose:** Full customer profile with ledger, invoice list, payment history, and actions.

**Data it reads:** Same as `useCustomerDetail` (below).

**Data it writes:** Edit profile, record payment, toggle active, delete (all via hook).

**Business logic:**
- Breadcrumb title = display name (Walk-in Customers for pseudo-row).
- Builds ledger and passes to `CustomerDetail`.
- Redirects to list after successful delete.

**Edge cases:** 404-style empty state when customer UUID not found.

---

## `useCustomerDetail` hook

**Route/file:** `app/features/customers/[id]/_components/useCustomerDetail.ts`

**Purpose:** Data layer for the detail page — fetch, aggregate, mutate.

**Data it reads:**
- `customers` — single row by ID
- `sales` — all for `customer_id`
- `payments` — all for `customer_id`
- `sale_items` + `products` — on invoice drill-down
- `payments` — per sale on invoice drill-down

**Data it writes:**
- `customers` — update, delete, toggle `is_active`
- `payments` — insert on record payment
- `sales` — update `amount_paid`, `balance_due`, `payment_status` when payment linked to invoice

**Business logic:**
- Enriches customer with `total_billed`, `total_paid`, `total_outstanding` (= Net Owed).
- `buildLedger()` merges opening balance + all invoices + all payments; sorted newest-first.
- `recordPayment`: amount must be > 0; inserts payment; if `sale_id` set, updates linked sale balances.
- Walk-in account: edit, deactivate, delete blocked with toast.

**Edge cases:**
- Standalone payments (`sale_id` null) appear in Payments tab and ledger as credits.
- Delete blocked when any `sales` or `payments` exist for customer.

---

## `useCustomers` hook

**Route/file:** `app/features/customers/_components/useCustomers.ts`

**Purpose:** Data layer for list page; also reused by New Sale for `addCustomer`.

**Data it reads/writes:** Same tables as list page; includes `fetchDetail` for payment modal context on list page.

**Business logic:** Identical Net Owed aggregation as detail hook. Walk-in protected from edit/toggle/delete.

**Known gaps:** `buildLedger()` exported but only used if list page ever adds inline detail — currently unused on list route.

---

## `CustomerDetail` component

**Route/file:** `app/features/customers/_components/CustomerDetail.tsx`

**Purpose:** Detail UI — KPI cards, credit bar, Ledger / Invoices / Payments tabs.

**Data it reads:** Props only (no direct DB).

**Business logic:**
- **Net Owed** card = `customer.total_outstanding`.
- **Credit limit bar** (when limit > 0):
  - % used = `min(100, max(0, netOwed) / limit × 100)`
  - Free Credit = `max(0, limit − netOwed)`
  - Over 100% usage: bar caps at 100%, Free Credit shows ₹0.
- **Ledger tab — running balance:**
  - Starts at Net Owed (newest row).
  - Walks backward: invoice −amount, payment +amount, opening −amount.
  - Invoice rows debit (+), payment rows credit (−).
  - **Dr** suffix when balance > 0; **Cr** when < 0.
- **Invoices tab:** filter by payment status; click opens invoice sheet.
- **Payments tab:** unlinked payments show **Advance** in Against Invoice column.

**Edge cases:** Empty ledger / invoices / payments → empty states. Walk-in: edit disabled, no destructive menu items.

**Known gaps:** Ledger sort is by date string only — same-day invoice + payment order may not reflect true chronology.

---

## `CustomerForm` component

**Route/file:** `app/features/customers/_components/CustomerForm.tsx`

**Purpose:** Add or edit customer profile in a right-side sheet.

**Data it writes:** `customers` insert (add) or update (edit) via parent callback.

**Business logic:**
- Required: name, 10-digit phone.
- Optional: email, GSTIN (format validated), address fields, credit limit.
- **Opening balance** field only on add; +ve = owes you, −ve = advance.
- Blank credit limit → stored as `null` in DB (schema default 0 applies on read as `?? 0` in UI).

**Edge cases:** GSTIN/PIN validation; inactive toggle hides from sales autocomplete (active customers only).

---

## `PaymentModal` component

**Route/file:** `app/features/customers/_components/PaymentModal.tsx`

**Purpose:** Record a customer payment from list or detail page.

**Data it writes:** `payments` (+ optional `sales` update when invoice linked).

**Business logic:**
- Amount must be > 0.
- **General payment** (no invoice): any amount allowed; overpayment creates advance credit (Net Owed goes negative).
- **Invoice-linked payment:** amount cannot exceed that invoice's `balance_due`.
- Live summary shows Net Owed, payment amount, remaining balance (floored at ₹0 in summary display).

**Edge cases:** Unpaid invoices listed in dropdown with invoice number and balance due.

---

## `InvoiceDetailSheet` component

**Route/file:** `app/features/customers/_components/InvoiceDetailSheet.tsx`

**Purpose:** Printable invoice view with line items and payment history.

**Data it reads:** Enriched `SaleWithItems` passed from parent (already fetched).

**Business logic:** Walk-in sales show `walkin_name` or "Walk-in Customer" instead of internal name. Uses `lib/config/shop.ts` for letterhead.

**Known gaps:** "Download PDF" triggers print dialog (same as Print) — no true PDF generation.

---

## `types.ts` + `ledger.ts`

**Route/file:** `app/features/customers/_components/types.ts`, `ledger.ts`

**Purpose:** Domain types and shared ledger helpers.

**Notes:** Customer `Sale` type uses `invoice_number` (aligned with DB). `CustomerWithStats.total_outstanding` = Net Owed.

---

## Database schema (relevant columns)

**File:** `schema.sql`

| Table | Key fields |
|-------|-----------|
| `customers` | `opening_balance`, `credit_limit` (0 = no limit), `is_active` |
| `sales` | `customer_id` NOT NULL, `grand_total`, `amount_paid`, `balance_due`, `walkin_name` |
| `payments` | `customer_id` NOT NULL, `sale_id` NULL = advance, `amount` CHECK > 0 |
| `sale_items` | Line items for invoice drill-down |

Walk-in sales: always have `customer_id` pointing to the `__walkin__` row; optional `walkin_name` for display on invoice.

---

## Step 2 verification summary

| Check | Result |
|-------|--------|
| Opening balance sign | Matches schema (+ve = owes you). UI documents on add form. |
| credit_limit = 0 | UI shows **No Limit**; not enforced on sales. |
| Total Billed | Sums `grand_total` ✓ |
| Walk-in sales | Stored under walk-in `customer_id`; excluded from named customer ledgers ✓ |
| Total Paid | Sums all `payments.amount` for customer ✓ |
| Advances | `sale_id` null payments included in Total Paid and ledger ✓ |
| Net Owed formula | Unified: `opening_balance + total_billed − total_paid` on list + detail **after fix** |
| Ledger running balance | True cumulative backward walk **after fix** (opening row included) |
| Dr/Cr suffixes | Correct on ledger balance column |
| Credit limit bar | % capped at 100; Free Credit = max(0, limit − netOwed) |

---

## Step 3 business logic Q&A

| Question | Answer |
|----------|--------|
| What does the list page represent? | Customer master + who owes money right now. |
| What does detail represent? | Full account statement for one customer. |
| Record Payment validation? | > 0 required; invoice-linked capped at invoice balance; general payments allow overpayment/advance. |
| Credit limit enforced on sales? | **No** — advisory warnings on New Sale and credit bar on detail only. |
| Dead / legacy naming? | **Fixed:** `bill_number` → `invoice_number` in customer feature. Sales module still uses some "bill" labels in UI copy. |

---

## Fixes applied (Step 4)

1. **Unified Net Owed** — list Outstanding, detail Net Owed, KPI total outstanding, and `total_outstanding` field all use `computeNetOwed()`.
2. **invoice_number** — customer `Sale` type and all UI references updated from legacy `bill_number`.
3. **Walk-in display** — relabeled "Walk-in Customers"; search matches; edit/delete/deactivate blocked.
4. **PaymentModal** — removed contradictory overpayment block; allows advance on general payments; caps only invoice-linked amounts.
5. **Ledger** — opening balance row now adjusts running balance when walking backward.
6. **Payments tab** — unlinked payments labeled **Advance**.

---

## Cross-feature dependencies

| Location | How it touches customer/sales/payment data |
|----------|---------------------------------------------|
| `app/features/sales/new/page.tsx` | Customer combobox, credit/outstanding panel, embeds `CustomerForm` + `useCustomers.addCustomer`; walk-in path via `getOrCreateWalkinCustomer`. Outstanding on new sale = sum unpaid `sales.balance_due` only (does not include opening balance — advisory gap). |
| `app/features/sales/new/useNewSale.ts` | Loads active customers (excludes walk-in); creates walk-in row; `saveSale()` writes `sales`, `sale_items`, `stock_movements`, `payments`. |
| `app/features/sales/_components/useSales.ts` | Walk-in create/display; sales list; `recordPayment`; `getCustomerOutstanding`; `searchCustomers`. |
| `app/features/sales/_components/types.ts` | `WALKIN_CUSTOMER_NAME = '__walkin__'` constant. |
| `app/features/sales/page.tsx` | Sales list; per-invoice `RecordPaymentModal`. |
| `app/features/sales/_components/RecordPaymentModal.tsx` | Payment against one sale only; amount ≤ `balance_due`. |
| `app/features/sales/_components/InvoiceModal.tsx` | Invoice detail from sales list; walk-in display name helper. |
| `app/features/sales/_components/SalesTable.tsx` | Shows customer name (walk-in relabeled). |
| `app/features/inventory/page.tsx` | Reuses `InvoiceDetailSheet`; fetches `sales` + `customers` + `sale_items` + `payments` for movement drill-down. |
| `components/app-sidebar.tsx` | Nav link to Customers. |
| `components/app-shell.tsx` | Breadcrumb label; `useBreadcrumb` on detail page. |
| `app/features/page.tsx` | Dashboard module card (link only). |
| `lib/supabase/client.ts` | Browser Supabase client for all hooks. |
| `lib/config/shop.ts` | Shop branding on printed invoices. |

---

## Known gaps not fixed (with rationale)

| Gap | Why left |
|-----|----------|
| New Sale outstanding panel ignores opening balance | Scoped to customers feature; sales page uses sale-balance-only by design for quick credit check — document for future alignment. |
| Credit limit not enforced at sale save | Business policy decision; enforcement would belong in `saveSale` / New Sale validation. |
| Same-day ledger ordering | Needs `created_at` tiebreaker; low priority. |
| No server actions / API layer | Entire app uses client Supabase; out of customers scope. |
| Walk-in row visible on customer list | **Intentional** — aggregates all walk-in receivables in one INACTIVE pseudo-account for ledger completeness. |
