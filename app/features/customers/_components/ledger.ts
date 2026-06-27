import { WALKIN_CUSTOMER_NAME } from '../../sales/_components/types'

export function isWalkinCustomer(name: string): boolean {
  return name === WALKIN_CUSTOMER_NAME
}

/** Human-readable label for the internal walk-in pseudo-customer row. */
export function customerDisplayName(name: string): string {
  return isWalkinCustomer(name) ? 'Walk-in Customers' : name
}
