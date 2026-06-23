// ─── Domain types ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  gstin: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  credit_limit: number | null
  opening_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerWithStats extends Customer {
  total_outstanding: number   // SUM(sales.balance_due)
  total_billed:      number   // SUM(sales.grand_total)
  total_paid:        number   // SUM(payments.amount)
}

export interface Sale {
  id: string
  customer_id: string
  bill_number: string | null
  sale_date: string
  grand_total: number
  amount_paid: number
  balance_due: number
  payment_status: 'pending' | 'partial' | 'paid'
  created_at: string
}

export interface Payment {
  id: string
  customer_id: string
  sale_id: string | null
  amount: number
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer'
  reference_number: string | null
  payment_date: string
  note: string | null
  created_at: string
}

// A ledger entry is either a sale or a payment or the opening balance
export type LedgerEntry =
  | { kind: 'opening'; date: string; amount: number }
  | { kind: 'invoice';  date: string; amount: number; sale: Sale }
  | { kind: 'payment';  date: string; amount: number; payment: Payment; bill_number?: string }

export interface CustomerKpi {
  total_active:      number
  total_outstanding: number
  total_collected:   number
}

export interface CustomerFormValues {
  name:            string
  phone:           string
  email:           string
  gstin:           string
  address:         string
  city:            string
  state:           string
  postal_code:     string
  credit_limit:    string
  opening_balance: string   // add form only
  is_active:       boolean
}

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  name: '', phone: '', email: '', gstin: '',
  address: '', city: '', state: '', postal_code: '',
  credit_limit: '', opening_balance: '0', is_active: true,
}

export interface PaymentFormValues {
  amount:           string
  payment_method:   'cash' | 'upi' | 'card' | 'bank_transfer'
  reference_number: string
  sale_id:          string   // '' = general payment
  payment_date:     string
  note:             string
}

export type CustomerFilter = 'all' | 'active' | 'inactive' | 'outstanding'

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
]
