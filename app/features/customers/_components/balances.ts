import type { CustomerWithStats } from './types'

/** Row shape returned by the `customer_balances` view. */
export interface CustomerBalanceRow {
  id:                 string
  name:               string
  phone:              string | null
  email:              string | null
  address:            string | null
  city:               string | null
  state:              string | null
  postal_code:        string | null
  gstin:              string | null
  opening_balance:    number
  created_at:         string
  updated_at:         string
  total_billed:       number
  total_paid:         number
  unapplied_advance:  number
  amount_owed:        number
}

/** Fields on `customers` not exposed by the balances view. */
export interface CustomerLifecycleFields {
  is_active:    boolean
  credit_limit: number | null
}

export function mapBalanceRow(
  row: CustomerBalanceRow,
  extra: CustomerLifecycleFields,
): CustomerWithStats {
  return {
    id:                row.id,
    name:              row.name,
    phone:             row.phone ?? '',
    email:             row.email,
    gstin:             row.gstin,
    address:           row.address,
    city:              row.city,
    state:             row.state,
    postal_code:       row.postal_code,
    opening_balance:   row.opening_balance,
    created_at:        row.created_at,
    updated_at:        row.updated_at,
    is_active:         extra.is_active,
    credit_limit:      extra.credit_limit,
    total_billed:      row.total_billed,
    total_paid:        row.total_paid,
    unapplied_advance: row.unapplied_advance,
    amount_owed:       row.amount_owed,
    overdue_60_amount: 0,
  }
}

/** Sum of positive receivables across all customers (for list KPI). */
export function sumPositiveAmountOwed(rows: Pick<CustomerBalanceRow, 'amount_owed'>[]): number {
  return rows.reduce((sum, r) => sum + (r.amount_owed > 0 ? r.amount_owed : 0), 0)
}
