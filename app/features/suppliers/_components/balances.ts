import type { SupplierWithStats, PurchasePaymentStatus } from './types'

/** Row shape returned by the `supplier_balances` view. */
export interface SupplierBalanceRow {
  id:                  string
  name:                string
  phone:               string | null
  email:               string | null
  address:             string | null
  city:                string | null
  state:               string | null
  postal_code:         string | null
  gstin:               string | null
  opening_balance:     number
  created_at:          string
  updated_at:          string
  total_purchased:     number
  total_paid:          number
  unapplied_advance:   number
  last_purchase_date:  string | null
  amount_owed:         number
}

export function mapBalanceRow(row: SupplierBalanceRow): SupplierWithStats {
  return {
    id:                 row.id,
    name:               row.name,
    phone:              row.phone ?? '',
    email:              row.email,
    gstin:              row.gstin,
    address:            row.address,
    city:               row.city,
    state:              row.state,
    postal_code:        row.postal_code,
    opening_balance:    row.opening_balance,
    created_at:         row.created_at,
    updated_at:         row.updated_at,
    total_purchased:    row.total_purchased,
    total_paid:         row.total_paid,
    unapplied_advance:  row.unapplied_advance,
    last_purchase_date: row.last_purchase_date,
    amount_owed:        row.amount_owed,
  }
}

/** Sum of positive payables across all suppliers (for list KPI). */
export function sumPositiveAmountOwed(rows: Pick<SupplierBalanceRow, 'amount_owed'>[]): number {
  return rows.reduce((sum, r) => sum + (r.amount_owed > 0 ? r.amount_owed : 0), 0)
}

const PAYMENT_STATUS_DEFAULT: PurchasePaymentStatus = 'pending'

/** Normalize purchase row from Supabase (payment columns may be absent on older DBs). */
export function mapPurchaseRow(row: Record<string, unknown>): {
  amount_paid: number
  balance_due: number
  payment_status: PurchasePaymentStatus
} {
  const grandTotal = Number(row.grand_total) || 0
  const amountPaid = row.amount_paid != null ? Number(row.amount_paid) : 0
  const balanceDue = row.balance_due != null
    ? Number(row.balance_due)
    : Math.max(0, grandTotal - amountPaid)
  const status = row.payment_status as PurchasePaymentStatus | undefined

  return {
    amount_paid:    amountPaid,
    balance_due:    balanceDue,
    payment_status: status ?? (balanceDue <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : PAYMENT_STATUS_DEFAULT),
  }
}
