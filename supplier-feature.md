# Suppliers Feature — Audit & Documentation

Narayani Traders ERP · Next.js + Supabase/Postgres  
Last audited: June 2025

---

## Shared balance rules

| Concept | Rule |
|--------|------|
| **Total Purchased** | `SUM(purchases.grand_total)` per supplier |
| **Total Paid** | `SUM(supplier_payments.amount)` per supplier |
| **Amount Owed** | `opening_balance + total_purchased − total_paid` |
| **Opening balance sign** | +ve = you owe them; −ve = advance credit (they owe you / you prepaid) |
| **Source of truth** | Postgres view `supplier_balances` — **never** recomputed in UI hooks |

Implementation helpers: `app/features/suppliers/_components/balances.ts`

---

## Database: `supplier_balances` view

**File:** `schema.sql`

```sql
amount_owed = opening_balance + total_purchased − total_paid
```

The view joins `suppliers` with aggregated `purchases` and `supplier_payments`. All list KPIs, table columns, detail header cards, and payment sheet summaries read `amount_owed` from this view (via hooks that query `supplier_balances`).

**Deploy note:** Run the view DDL against Supabase if the remote DB was created before this audit.

---

## `/features/suppliers` — List page

**Route/file:** `app/features/suppliers/page.tsx`

**Purpose:** Master list of vendors with purchase totals and payables, search, and quick actions.

**Data it reads:**
- `supplier_balances` — all columns (profile + `total_purchased`, `total_paid`, `amount_owed`)

**Data it writes:**
- Via `SupplierForm` → insert/update on `suppliers`
- Row delete → delete on `suppliers` (when no history)

**Business logic:**
- KPI **Total Suppliers** = row count from `supplier_balances`.
- KPI **Total Purchases** = sum of `total_purchased` across all suppliers.
- KPI **Amount Owed** = sum of positive `amount_owed` values only (advance credits excluded).
- Table columns: name/phone/email, city/state (— when empty), GSTIN (— when missing), Total Purchased, Amount Owed (— when ≤ 0).
- Search: client-side filter on name, phone, GSTIN (debounced 300 ms).

**Edge cases handled:**
- Empty list / no search matches → friendly empty states.
- Location and GSTIN show em dash when absent.

**Known gaps / follow-ups:**
- No active/inactive filter (suppliers table has no `is_active` column).
- KPI "Showing" card reflects post-search count, not total registry size.

---

## `/features/suppliers/[id]` — Detail page

**Route/file:** `app/features/suppliers/[id]/page.tsx`

**Purpose:** Full supplier profile with purchase history, product summary, payments, and PO drill-down.

**Data it reads:** Via `useSupplierDetail` (below).

**Data it writes:** Edit profile, record payment, delete supplier.

**Business logic:**
- Breadcrumb title = supplier name.
- Opens `PurchaseDetail` drawer on purchase row click.
- Opens `SupplierPaymentSheet` for outgoing payments.

**Edge cases:** Not-found state when UUID invalid.

---

## `useSuppliers` hook

**Route/file:** `app/features/suppliers/_components/useSuppliers.ts`

**Purpose:** List-page data layer; also available for future reuse.

**Data it reads:**
- `supplier_balances` — list + KPIs
- `purchases`, `purchase_items`, `products` — only in `fetchDetail` when `selectedId` set (edit-modal context)

**Data it writes:**
- `suppliers` — insert, update, delete

**Business logic:**
- Maps `supplier_balances` rows via `mapBalanceRow()`.
- Delete blocked when any `purchases` **or** `supplier_payments` exist.

---

## `useSupplierDetail` hook

**Route/file:** `app/features/suppliers/[id]/_components/useSupplierDetail.ts`

**Purpose:** Detail-page data layer.

**Data it reads:**
- `supplier_balances` — single row by ID (stats + profile)
- `purchases` — all for supplier
- `purchase_items` + `products` — product summary tab + item counts
- `supplier_payments` + `purchases` join — payments tab
- `purchases`, `purchase_items`, `products`, `suppliers` — PO sheet via `fetchPurchaseDetail`

**Data it writes:**
- `suppliers` — update, delete
- `supplier_payments` — insert on record payment; then **`fetchAll()`** re-queries `supplier_balances` (no local decrement)

**Business logic:**
- `amount_owed` always from view after refresh — not manually calculated in hook.
- `recordPayment`: validates amount > 0; inserts with `payment_method` (required by DB); `purchase_id` null = advance.
- Delete blocked when purchases or supplier_payments exist.

---

## `SupplierDetail` component

**Route/file:** `app/features/suppliers/_components/SupplierDetail.tsx`

**Purpose:** Detail UI — KPI cards and Purchases / Products / Payments tabs.

**Data it reads:** Props only.

**Business logic:**
- KPI cards: Opening Balance, Total Purchased, Amount Owed (all from `supplier` prop sourced from view).
- Purchases tab: all rows show hard-coded **Received** badge (purchases have no payment_status column).
- Products tab: aggregates base-unit `quantity` per product across all POs.
- Payments tab: unlinked payments labeled **Advance**.

---

## `SupplierForm` component

**Route/file:** `app/features/suppliers/_components/SupplierForm.tsx`

**Purpose:** Add or edit supplier in a right-side sheet.

**Data it writes:** `suppliers` via parent callback.

**Business logic:**
- Required: name, 10-digit phone.
- Optional: email, GSTIN (format validated), address fields.
- Opening balance on add only: +ve = you owe them, −ve = advance you paid before go-live.

---

## `SupplierPaymentSheet` component

**Route/file:** `app/features/suppliers/_components/SupplierPaymentSheet.tsx`

**Purpose:** Record outgoing payment to supplier.

**Data it writes:** `supplier_payments` via `recordPayment` → full re-fetch.

**Business logic:**
- Amount must be > 0; payment method required (Select default `cash`).
- Optional link to a purchase PO (informational — does not auto-allocate or update purchase rows).
- Overpayment allowed with warning; creates advance credit (negative `amount_owed`).
- Live summary uses `supplier.amount_owed` from view.

---

## `PurchaseDetail` component (shared PO drawer)

**Route/file:** `app/features/purchases/_components/PurchaseDetail.tsx`

**Purpose:** Purchase order detail sheet opened from supplier detail (and inventory).

**Data it reads:** Enriched `PurchaseWithItems` from parent fetch.

**Business logic — line items:**
- **Mode column:** `buy_mode` — shows `Box × {box_count}` or `Unit`.
- **Qty column:** always base-unit `quantity` (schema rule: quantity = boxes × units_per_box when buy_mode = box).
- Totals: subtotal, tax, discount, grand total from `purchases` row.

**Verified:** UI does not display `box_count` in the Qty column — correct.

---

## `types.ts` + `balances.ts`

**Route/file:** `app/features/suppliers/_components/types.ts`, `balances.ts`

**Purpose:** Domain types and view row mapping.

**Notes:** `PurchaseItem.line_total` aligned with DB (was legacy `total_price`). `SupplierWithStats` includes `total_paid` from view.

---

## Step 2 verification summary

| Check | Result |
|-------|--------|
| `suppliers.opening_balance` sign | Schema + form: +ve = you owe them ✓ |
| List columns | From `supplier_balances`; city/state/GSTIN em dash when empty ✓ |
| Total Purchased | Sums `grand_total` ✓ |
| PO sheet qty | Base units in Qty; buy_mode/box_count in Mode ✓ |
| `supplier_balances` view | **Created** in `schema.sql`; wired in hooks ✓ |
| List vs detail amount owed | **Fixed** — both use view (was list-only bug omitting payments) |
| Payment recording | amount > 0; method required; re-fetch after insert ✓ |

---

## Step 3 business logic Q&A

| Question | Answer |
|----------|--------|
| What does list represent? | Vendor directory + who you still owe money to. |
| What does detail represent? | Full account with PO history and payment log. |
| Nonsensical states prevented? | Delete with history blocked; negative/zero payment rejected. Overpayment allowed (advance). |
| Dead / legacy code? | **Fixed:** `total_price` → `line_total`; removed client-side `opening + purchases` formula from list hook. |

---

## Fixes applied (Step 4)

1. **Added `supplier_balances` view** to `schema.sql` with grant.
2. **`useSuppliers`** — list + KPIs query view; delete checks `supplier_payments`.
3. **`useSupplierDetail`** — profile/stats from view; removed manual `amount_owed` math.
4. **Types** — `total_paid` on `SupplierWithStats`; `line_total` on `PurchaseItem`.
5. **`SupplierPaymentSheet`** — overpayment warning; summary uses view balance.
6. **Payments tab** — unlinked rows labeled **Advance**.

---

## Cross-feature dependencies

| Location | How it touches supplier/purchase/payment data |
|----------|---------------------------------------------|
| `app/features/purchases/new/page.tsx` | Supplier combobox; `?supplier_id=` pre-fill; saves PO via `useNewPurchase`. |
| `app/features/purchases/new/useNewPurchase.ts` | Loads `suppliers` for picker; inserts `purchases`, `purchase_items`, `stock_movements`. |
| `app/features/purchases/_components/usePurchases.ts` | Purchase list with `suppliers` join; `searchSuppliers()`. |
| `app/features/purchases/_components/PurchaseDetail.tsx` | PO drawer (shared). |
| `app/features/purchases/_components/PurchaseTable.tsx` | Shows `supplier_name` per PO. |
| `app/features/inventory/page.tsx` | Reorder → `/features/purchases/new?supplier_id=…`; PO drawer. |
| `app/features/inventory/_components/useInventory.ts` | `suggested_supplier_id` from last purchase per product. |
| `components/app-sidebar.tsx` | Nav link to Suppliers. |
| `components/app-shell.tsx` | Breadcrumb label; dynamic title on detail. |
| `app/features/page.tsx` | Dashboard module card (link only). |
| `lib/supabase/client.ts` | Browser client for all hooks. |

---

## Known gaps not fixed (with rationale)

| Gap | Why left |
|-----|----------|
| PO-linked payment doesn't update purchase paid/balance fields | Purchases table has no `amount_paid` / `balance_due` columns — payables tracked at supplier level only. |
| All purchases show "Received" | No receipt/payment status on `purchases` — informational badge only. |
| No supplier ledger tab | Unlike customers; Purchases + Payments tabs serve similar purpose. |
| View must be deployed to remote Supabase | DDL in `schema.sql`; run migration manually on hosted DB. |
