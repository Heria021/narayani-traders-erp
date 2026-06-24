// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  credit_limit: number
  opening_balance: number
  is_active: boolean
}

export interface SaleProduct {
  id: string
  name: string
  sku: string | null
  unit_name: string
  selling_price: number
  box_selling_price: number | null
  purchase_price: number       // kept for reference
  has_box: boolean
  box_name: string | null
  units_per_box: number | null
  gst_rate: number
  current_stock: number
  track_inventory: boolean
  is_active: boolean
}

export type PaymentStatus = 'paid' | 'partial' | 'pending'
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit'

export interface Sale {
  id: string
  customer_id: string
  customer_name: string          // joined from customers (or "Walk-in")
  invoice_number: string
  sale_date: string
  subtotal: number
  tax_amount: number
  discount: number
  grand_total: number
  amount_paid: number
  balance_due: number
  payment_status: PaymentStatus
  due_date: string | null
  notes: string | null
  created_at: string
  item_count?: number
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string           // joined from products
  unit_name: string              // joined from products
  box_name: string | null        // joined from products
  units_per_box: number | null   // joined from products
  sell_mode: 'unit' | 'box'
  box_count: number | null
  quantity: number               // always base units
  unit_price: number
  tax_rate: number
  line_total: number
}

export interface PaymentRecord {
  id: string
  sale_id: string | null
  customer_id: string
  amount: number
  payment_method: PaymentMethod
  reference_number: string | null
  payment_date: string
  note: string | null
  created_at: string
}

export interface SaleWithItems extends Sale {
  items: SaleItem[]
  payments: PaymentRecord[]
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface SaleKpi {
  today_sales: number
  this_month: number
  total_outstanding: number
  total_collected: number
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface SaleDraftLineItem {
  id: string                   // local uuid for React key
  product: SaleProduct | null
  sell_mode: 'unit' | 'box'
  qty_input: string            // boxes if box mode, units if unit mode
  unit_price: string           // editable sell price
  tax_rate: string
  // derived (computed on render)
  base_units: number
  line_total: number
}

export interface SaleHeaderValues {
  invoice_number: string
  sale_date: string
  customer_id: string          // '' for walk-in
  walkin_name: string          // optional display name for walk-in
  notes: string
}

export interface PaymentFormValues {
  payment_method: PaymentMethod
  reference_number: string
  amount_paid: string
  due_date: string
}

// discount mode
export type DiscountMode = 'flat' | 'percent'

// ─── Filter types ─────────────────────────────────────────────────────────────

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'custom'
export type StatusFilter    = 'all' | 'paid' | 'partial' | 'pending'

export interface SaleFilters {
  search: string
  status: StatusFilter
  dateRange: DateRangeFilter
  customFrom: string
  customTo: string
}

export const DEFAULT_SALE_FILTERS: SaleFilters = {
  search: '',
  status: 'all',
  dateRange: 'all',
  customFrom: '',
  customTo: '',
}

export type SortField = 'sale_date' | 'grand_total' | 'balance_due'
export type SortDir   = 'asc' | 'desc'

export const ROWS_PER_PAGE = 25

// ─── Quick-add product form ───────────────────────────────────────────────────

export interface QuickProductFormValues {
  name: string
  sku: string
  category: string
  unit_name: string
  purchase_price: string
  selling_price: string
  gst_rate: string
  has_box: boolean
  box_name: string
  units_per_box: string
  box_purchase_price: string
  box_selling_price: string
  track_inventory: boolean
}

export const EMPTY_QUICK_PRODUCT: QuickProductFormValues = {
  name: '', sku: '', category: '', unit_name: 'piece',
  purchase_price: '', selling_price: '', gst_rate: '0',
  has_box: false,
  box_name: '', units_per_box: '', box_purchase_price: '', box_selling_price: '',
  track_inventory: true,
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Special internal marker for walk-in customer name (stored in customers.name)
export const WALKIN_CUSTOMER_NAME = '__walkin__'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:          'Cash',
  upi:           'UPI',
  card:          'Card',
  bank_transfer: 'Bank Transfer',
  credit:        'Credit',
}

export const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  paid:    { label: 'Paid',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900' },
  partial: { label: 'Partial', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900' },
  pending: { label: 'Pending', color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-900' },
}
