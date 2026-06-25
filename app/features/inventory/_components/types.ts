export type { Product } from '@/app/features/products/_components/types'
import type { Product } from '@/app/features/products/_components/types'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'untracked'

export interface InventoryItem extends Product {
  unit_cost:           number
  stock_value:         number
  status:              InventoryStatus
  last_movement_date:  string | null
  
  // Extra columns for Low Stock view
  shortage?:           number
  last_purchase_date?: string | null
  last_purchase_id?:   string | null
  last_purchase_number?: string | null
  suggested_supplier_id?: string | null

  // Extra columns for Out of Stock view
  last_sold_date?:     string | null
  last_sold_id?:       string | null
  last_sold_number?:   string | null
  last_restocked_date?: string | null
  last_restocked_id?:   string | null
  last_restocked_number?: string | null
}

export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'damage' | 'opening_stock'

export interface StockMovement {
  id:            string
  product_id:    string
  movement_type: StockMovementType
  quantity:      number
  reference_id:  string | null
  reference_name: string | null // resolved PO number or Invoice bill number
  notes:         string | null
  created_at:    string
  balanceAfter?: number // calculated running total
}

export interface InventoryKpi {
  total_skus:    number
  in_stock:      number
  low_stock:     number
  out_of_stock:  number
  total_value:   number
}

export interface InventoryFilters {
  search:        string
  category:      string
  status:        'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'untracked'
}

export type SortField = 'name' | 'current_stock' | 'stock_value' | 'last_movement_date' | 'status'
export type SortDir = 'asc' | 'desc'
