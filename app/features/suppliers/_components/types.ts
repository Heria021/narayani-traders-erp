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
  total_purchased: number   // SUM(purchases.grand_total)
  amount_owed:     number   // opening_balance + total_purchased
}

export interface Purchase {
  id:              string
  supplier_id:     string
  purchase_number: string | null
  purchase_date:   string
  grand_total:     number
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
  total_price:  number
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
  total_count:      number
  total_purchased:  number
  amount_owed:      number
}

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
