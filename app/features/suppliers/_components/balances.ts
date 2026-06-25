import type { SupplierWithStats } from './types'

/** Row shape returned by the `supplier_balances` view. */
export interface SupplierBalanceRow {
  id:              string
  name:            string
  phone:           string | null
  email:           string | null
  address:         string | null
  city:            string | null
  state:           string | null
  postal_code:     string | null
  gstin:           string | null
  opening_balance: number
  created_at:      string
  updated_at:      string
  total_purchased: number
  total_paid:      number
  amount_owed:     number
}

export function mapBalanceRow(row: SupplierBalanceRow): SupplierWithStats {
  return {
    id:              row.id,
    name:            row.name,
    phone:           row.phone ?? '',
    email:           row.email,
    gstin:           row.gstin,
    address:         row.address,
    city:            row.city,
    state:           row.state,
    postal_code:     row.postal_code,
    opening_balance: row.opening_balance,
    created_at:      row.created_at,
    updated_at:      row.updated_at,
    total_purchased: row.total_purchased,
    total_paid:      row.total_paid,
    amount_owed:     row.amount_owed,
  }
}

/** Sum of positive payables across all suppliers (for list KPI). */
export function sumPositiveAmountOwed(rows: Pick<SupplierBalanceRow, 'amount_owed'>[]): number {
  return rows.reduce((sum, r) => sum + (r.amount_owed > 0 ? r.amount_owed : 0), 0)
}
