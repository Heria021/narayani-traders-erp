// ─── Domain types ──────────────────────────────────────────────────────────────

export interface Supplier {
  id:              string
  name:            string
  phone:           string
  email:           string | null
  gstin:           string | null
  address:         string | null
  city:            string | null
  state:           string | null
  postal_code:     string | null
  opening_balance: number
  created_at:      string
  updated_at:      string
}

export interface SupplierWithStats extends Supplier {
  total_purchased:     number   // from supplier_balances view
  total_paid:          number   // from supplier_balances view
  unapplied_advance:   number   // from supplier_balances view
  last_purchase_date:  string | null
  amount_owed:         number   // from supplier_balances view: opening_balance + total_purchased − total_paid
}

export type PurchasePaymentStatus = 'paid' | 'partial' | 'pending'

export interface Purchase {
  id:              string
  supplier_id:     string
  purchase_number: string | null
  purchase_date:   string
  grand_total:     number
  amount_paid:     number
  balance_due:     number
  payment_status:  PurchasePaymentStatus
  notes:           string | null
  created_at:      string
  item_count?:     number   // populated client-side
}

export interface PurchaseItem {
  id:           string
  purchase_id:  string
  product_id:   string
  quantity:     number
  unit_price:   number
  line_total:   number
  product_name?: string   // joined
  unit_name?:    string   // joined
}

// Per-product summary across all purchases from this supplier
export interface SupplierProduct {
  product_id:     string
  product_name:   string
  unit_name:      string
  total_qty:      number
  last_purchased: string   // date string
}

export interface SupplierKpi {
  total_count:       number
  total_purchased:   number
  amount_owed:       number
  total_input_gst:   number
}

export interface PayablesAgingBucket {
  bucket:         '0-30' | '31-60' | '60+'
  invoice_count:  number
  total_due:      number
}

export type SupplierSortField = 'name' | 'amount_owed' | 'total_purchased' | 'last_purchase_date'
export type SupplierSortDir   = 'asc' | 'desc'

export interface SupplierFormValues {
  name:            string
  phone:           string
  email:           string
  gstin:           string
  address:         string
  city:            string
  state:           string
  postal_code:     string
  opening_balance: string   // add form only
}

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: '', phone: '', email: '', gstin: '',
  address: '', city: '', state: '', postal_code: '',
  opening_balance: '0',
}

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
]

export interface SupplierPayment {
  id:               string
  supplier_id:      string
  purchase_id:      string | null
  amount:           number
  payment_method:   'cash' | 'upi' | 'card' | 'bank_transfer'
  reference_number: string | null
  payment_date:     string
  note:             string | null
  created_at:       string
  purchase_number?: string | null // joined/linked purchase number
}

export interface SupplierPaymentFormValues {
  amount:           string
  payment_method:   'cash' | 'upi' | 'card' | 'bank_transfer'
  reference_number: string
  purchase_id:      string
  payment_date:     string
  note:             string
}

