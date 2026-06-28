export type { Product } from '@/app/features/products/_components/types'
import type { Product } from '@/app/features/products/_components/types'

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'never_stocked' | 'untracked'

export interface InventoryItem extends Product {
  unit_cost:           number
  stock_value:         number
  status:              InventoryStatus
  has_movement_history: boolean
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

const STATUS_SORT_ORDER: Record<InventoryStatus, number> = {
  in_stock: 1,
  low_stock: 2,
  out_of_stock: 3,
  never_stocked: 4,
  untracked: 5,
}

export function inventoryStatusLabel(status: InventoryStatus): string {
  switch (status) {
    case 'in_stock':      return 'In Stock'
    case 'low_stock':     return 'Low Stock'
    case 'out_of_stock':  return 'Out of Stock'
    case 'never_stocked': return 'Never Stocked'
    default:              return 'Untracked'
  }
}

export function inventoryStatusBadgeClass(status: InventoryStatus): string {
  switch (status) {
    case 'in_stock':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'low_stock':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    case 'out_of_stock':
      return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
    case 'never_stocked':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400'
  }
}

export function inventoryStatusSortValue(status: InventoryStatus): number {
  return STATUS_SORT_ORDER[status]
}
