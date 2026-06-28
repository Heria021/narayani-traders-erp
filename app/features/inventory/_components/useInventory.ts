/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  InventoryItem, InventoryKpi, InventoryFilters,
  StockMovement, SortField, SortDir, InventoryStatus,
} from './types'
import { inventoryStatusSortValue } from './types'

export function useInventory() {
  const supabase = createClient()

  // ── Master States ──
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([])
  const [categories,        setCategories]        = useState<string[]>([])
  const [kpis,              setKpis]              = useState<InventoryKpi>({ total_skus: 0, in_stock: 0, low_stock: 0, out_of_stock: 0, total_value: 0 })
  const [loading,           setLoading]           = useState(true)

  // ── Filter and Sort States ──
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: 'all',
    status: 'all',
  })
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir,   setSortDir]   = useState<SortDir>('asc')

  // ── Drawer States ──
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [movements,          setMovements]          = useState<StockMovement[]>([])
  const [drawerLoading,      setDrawerLoading]      = useState(false)

  const selectedItem = useMemo(() => {
    return allInventoryItems.find(i => i.id === selectedProductId) ?? null
  }, [allInventoryItems, selectedProductId])

  // ── Fetch Master List & Stats ──
  const fetchAll = useCallback(async () => {
    setLoading(true)

    // 1. Fetch active products
    const { data: prodsData, error: prodsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (prodsError || !prodsData) {
      console.error(prodsError)
      setLoading(false)
      return
    }

    // 2. Fetch latest movement dates for each product
    const { data: movementsData } = await supabase
      .from('stock_movements')
      .select('product_id, created_at')
      .order('created_at', { ascending: true })

    const lastMovementMap = new Map<string, string>()
    const hasMovementSet = new Set<string>()
    for (const m of movementsData ?? []) {
      hasMovementSet.add(m.product_id)
      const existing = lastMovementMap.get(m.product_id)
      if (!existing || m.created_at > existing) {
        lastMovementMap.set(m.product_id, m.created_at)
      }
    }

    // 3. Fetch latest purchases (restocks) with supplier reference
    const { data: purchaseItemsData } = await supabase
      .from('purchase_items')
      .select('product_id, purchase_id, purchases(purchase_number, purchase_date, supplier_id)')

    const lastPurchaseMap = new Map<string, { id: string; number: string; date: string; supplier_id: string }>()
    for (const pi of purchaseItemsData ?? []) {
      const p = pi.purchases as any
      if (p) {
        const existing = lastPurchaseMap.get(pi.product_id)
        if (!existing || p.purchase_date > existing.date) {
          lastPurchaseMap.set(pi.product_id, {
            id: pi.purchase_id,
            number: p.purchase_number,
            date: p.purchase_date,
            supplier_id: p.supplier_id,
          })
        }
      }
    }

    // 4. Fetch latest sales with invoice reference
    const { data: saleItemsData } = await supabase
      .from('sale_items')
      .select('product_id, sale_id, sales(invoice_number, sale_date)')

    const lastSaleMap = new Map<string, { id: string; number: string; date: string }>()
    for (const si of saleItemsData ?? []) {
      const s = si.sales as any
      if (s) {
        const existing = lastSaleMap.get(si.product_id)
        if (!existing || s.sale_date > existing.date) {
          lastSaleMap.set(si.product_id, {
            id: si.sale_id,
            number: s.invoice_number,
            date: s.sale_date,
          })
        }
      }
    }

    // 5. Enrich products with status, valuation cost, and logs
    const enriched: InventoryItem[] = prodsData.map(p => {
      let unit_cost = p.purchase_price
      if (p.has_box && p.units_per_box) {
        unit_cost = p.box_purchase_price ? p.box_purchase_price / p.units_per_box : p.purchase_price
      }

      const stock_value = p.current_stock * unit_cost

      let status: InventoryStatus = 'untracked'
      const hasMovementHistory = hasMovementSet.has(p.id)
      if (p.track_inventory) {
        if (p.minimum_stock > 0 && p.current_stock > 0 && p.current_stock <= p.minimum_stock) {
          status = 'low_stock'
        } else if (p.current_stock > 0) {
          status = 'in_stock'
        } else if (!hasMovementHistory) {
          status = 'never_stocked'
        } else {
          status = 'out_of_stock'
        }
      }

      const lastMov = lastMovementMap.get(p.id) ?? null
      const lastPurch = lastPurchaseMap.get(p.id) ?? null
      const lastSale = lastSaleMap.get(p.id) ?? null

      return {
        ...p,
        unit_cost,
        stock_value,
        status,
        has_movement_history: hasMovementHistory,
        last_movement_date: lastMov,

        // Low stock helpers
        shortage: status === 'low_stock' ? Math.max(0, p.minimum_stock - p.current_stock) : undefined,
        last_purchase_date: lastPurch?.date ?? null,
        last_purchase_id: lastPurch?.id ?? null,
        last_purchase_number: lastPurch?.number ?? null,
        suggested_supplier_id: lastPurch?.supplier_id ?? null,

        // Out of stock helpers
        last_sold_date: lastSale?.date ?? null,
        last_sold_id: lastSale?.id ?? null,
        last_sold_number: lastSale?.number ?? null,
        last_restocked_date: lastPurch?.date ?? null,
        last_restocked_id: lastPurch?.id ?? null,
        last_restocked_number: lastPurch?.number ?? null,
      }
    })

    // 6. Compute distinct categories
    const cats = Array.from(new Set(prodsData.map(p => p.category).filter(Boolean))) as string[]
    cats.sort()

    // 7. Compute KPIs
    const total_skus = enriched.filter(i => i.track_inventory).length
    const in_stock = enriched.filter(i => i.track_inventory && i.status === 'in_stock').length
    const low_stock = enriched.filter(i => i.track_inventory && i.status === 'low_stock').length
    const out_of_stock = enriched.filter(i => i.track_inventory && i.status === 'out_of_stock').length
    const total_value = enriched.reduce((sum, i) => sum + i.stock_value, 0)

    setAllInventoryItems(enriched)
    setCategories(cats)
    setKpis({ total_skus, in_stock, low_stock, out_of_stock, total_value })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Fetch Product Stock Movements ──
  const fetchMovements = useCallback(async (productId: string) => {
    setDrawerLoading(true)

    // 1. Fetch movements ordered ascending to calculate running totals
    const { data: movs } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    const movList = (movs ?? []) as StockMovement[]

    // 2. Extract reference IDs to resolve PO / Bill numbers
    const purchaseIds = movList.filter(m => m.movement_type === 'purchase').map(m => m.reference_id).filter(Boolean) as string[]
    const saleIds = movList.filter(m => m.movement_type === 'sale').map(m => m.reference_id).filter(Boolean) as string[]

    const nameMap = new Map<string, string>()

    if (purchaseIds.length > 0) {
      const { data: purchData } = await supabase
        .from('purchases')
        .select('id, purchase_number')
        .in('id', purchaseIds)
      for (const p of purchData ?? []) {
        nameMap.set(p.id, p.purchase_number)
      }
    }

    if (saleIds.length > 0) {
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, invoice_number')
        .in('id', saleIds)
      for (const s of salesData ?? []) {
        nameMap.set(s.id, s.invoice_number)
      }
    }

    // 3. Compute running stock balanceAfter
    let running = 0
    const enriched = movList.map(m => {
      running += Number(m.quantity)
      return {
        ...m,
        balanceAfter: running,
        reference_name: m.reference_id ? nameMap.get(m.reference_id) ?? null : null,
      }
    })

    // 4. Reverse to put newest first
    enriched.reverse()

    setMovements(enriched)
    setDrawerLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedProductId) fetchMovements(selectedProductId)
    else setMovements([])
  }, [selectedProductId, fetchMovements])

  // ── Filtering and Sorting Math ──
  const filteredItems = useMemo(() => {
    let result = [...allInventoryItems]

    // 1. Status Filter Chip
    if (filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status)
    } else {
      // Default: show tracked products
      result = result.filter(i => i.track_inventory)
    }

    // 2. Category Filter Dropdown
    if (filters.category !== 'all') {
      result = result.filter(i => i.category === filters.category)
    }

    // 3. Live Search Name/SKU
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.sku ?? '').toLowerCase().includes(q)
      )
    }

    // 4. Client-side Sort
    result.sort((a, b) => {
      let valA: any = a[sortField]
      let valB: any = b[sortField]

      if (sortField === 'name') {
        valA = a.name.toLowerCase()
        valB = b.name.toLowerCase()
      } else if (sortField === 'status') {
        valA = inventoryStatusSortValue(a.status)
        valB = inventoryStatusSortValue(b.status)
      }

      if (valA === null || valA === undefined) return sortDir === 'asc' ? -1 : 1
      if (valB === null || valB === undefined) return sortDir === 'asc' ? 1 : -1

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [allInventoryItems, filters, sortField, sortDir])

  function changeFilter(key: keyof InventoryFilters, value: string) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  return {
    allInventoryItems,
    filteredItems,
    categories,
    kpis,
    loading,
    filters,
    sortField,
    sortDir,
    selectedProductId,
    selectedItem,
    movements,
    drawerLoading,
    setSelectedProductId,
    changeFilter,
    setSortField,
    setSortDir,
    refresh: fetchAll,
  }
}
