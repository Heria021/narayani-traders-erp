// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  category: string | null
  unit_name: string
  selling_price: number
  purchase_price: number
  gst_rate: number
  has_box: boolean
  box_name: string | null
  units_per_box: number | null
  box_purchase_price: number | null
  box_selling_price: number | null
  current_stock: number
  minimum_stock: number
  track_inventory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductFormValues {
  name: string
  sku: string
  description: string
  category: string
  unit_name: string
  selling_price: string
  purchase_price: string
  gst_rate: string
  is_active: boolean
  has_box: boolean
  box_name: string
  units_per_box: string
  box_purchase_price: string
  box_selling_price: string
  track_inventory: boolean
  opening_stock: string   // add form only
  minimum_stock: string
}

export const EMPTY_FORM: ProductFormValues = {
  name: '', sku: '', description: '', category: '', unit_name: 'piece',
  selling_price: '', purchase_price: '', gst_rate: '0',
  is_active: true, has_box: false,
  box_name: '', units_per_box: '', box_purchase_price: '', box_selling_price: '',
  track_inventory: true, opening_stock: '', minimum_stock: '0',
}

export interface ProductKpiData {
  total: number
  active: number
  low_stock: number
  total_value: number
}

export type StockStatus = 'ok' | 'low' | 'out'

export function getStockStatus(p: Product): StockStatus {
  if (!p.track_inventory) return 'ok'
  if (p.current_stock <= 0) return 'out'
  if (p.current_stock <= p.minimum_stock) return 'low'
  return 'ok'
}

export type SortField = 'name' | 'sku' | 'category' | 'selling_price' | 'current_stock'
export type SortDir   = 'asc' | 'desc'

export interface ProductFilters {
  search: string
  category: string          // '' = all
  status: 'all' | 'active' | 'inactive' | 'low_stock'
}

export const DEFAULT_FILTERS: ProductFilters = { search: '', category: '', status: 'all' }
export const ROWS_PER_PAGE = 25

export interface StockMovement {
  id: string
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'damage' | 'opening_stock'
  quantity: number
  reference_id: string | null
  notes: string | null
  created_at: string
}
