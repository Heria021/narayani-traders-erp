// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface Product {
  id: string
  name: string
  sku: string | null
  unit_name: string
  purchase_price: number
  has_box: boolean
  box_name: string | null
  units_per_box: number | null
  box_purchase_price: number | null
  gst_rate: number
  current_stock: number
  track_inventory: boolean
  is_active: boolean
}

export interface Purchase {
  id: string
  supplier_id: string
  supplier_name: string        // joined from suppliers
  purchase_number: string
  purchase_date: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  grand_total: number
  amount_paid: number
  balance_due: number
  payment_status: 'paid' | 'partial' | 'pending'
  notes: string | null
  created_at: string
  item_count?: number          // COUNT(purchase_items) — included on list
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  product_name: string         // joined from products
  unit_name: string            // joined from products
  buy_mode: 'unit' | 'box'
  box_count: number | null
  quantity: number             // always base units
  unit_price: number
  tax_rate: number
  line_total: number
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[]
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface PurchaseKpi {
  total_count: number
  this_month: number
  total_spent: number
  total_items_bought: number
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LineItemDraft {
  id: string                   // local uuid for React key
  product: Product | null
  buy_mode: 'unit' | 'box'
  qty_input: string            // boxes if box mode, units if unit mode
  unit_price: string           // editable
  tax_rate: string
  // derived (computed on render)
  base_units: number           // qty × units_per_box (box) OR qty (unit)
  line_total: number           // base_units × unit_price ... wait, actually qty_input × unit_price
}

export interface PurchaseHeaderValues {
  purchase_number: string
  purchase_date: string
  supplier_id: string
  notes: string
}

// discount mode
export type DiscountMode = 'flat' | 'percent'

// ─── Filter types ─────────────────────────────────────────────────────────────

export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'custom'

export interface PurchaseFilters {
  search: string
  dateRange: DateRangeFilter
  customFrom: string
  customTo: string
}

export const DEFAULT_FILTERS: PurchaseFilters = {
  search: '',
  dateRange: 'all',
  customFrom: '',
  customTo: '',
}

export type SortField = 'purchase_date' | 'grand_total' | 'supplier_name'
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
