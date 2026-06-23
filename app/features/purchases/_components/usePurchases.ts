'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type Purchase, type PurchaseWithItems, type PurchaseItem,
  type PurchaseKpi, type PurchaseFilters, type SortField, type SortDir,
  type LineItemDraft, type PurchaseHeaderValues,
  type DiscountMode, type QuickProductFormValues, type Product,
  DEFAULT_FILTERS, ROWS_PER_PAGE,
} from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

function startOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function dateRangeToFilter(
  range: PurchaseFilters['dateRange'],
  customFrom: string,
  customTo: string,
): { from: string | null; to: string | null } {
  const t = today()
  if (range === 'today')  return { from: t, to: t }
  if (range === 'week') {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d.setDate(diff)).toISOString().slice(0, 10)
    return { from: mon, to: today() }
  }
  if (range === 'month')  return { from: startOfMonth(), to: t }
  if (range === 'custom') return { from: customFrom || null, to: customTo || null }
  return { from: null, to: null }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function usePurchases() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [purchases,    setPurchases]    = useState<Purchase[]>([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [sortField,    setSortField]    = useState<SortField>('purchase_date')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [filters,      setFilters]      = useState<PurchaseFilters>(DEFAULT_FILTERS)
  const [loading,      setLoading]      = useState(true)

  // ── KPI state ───────────────────────────────────────────────────────────────
  const [kpi,          setKpi]          = useState<PurchaseKpi>({
    total_count: 0, this_month: 0, total_spent: 0, total_items_bought: 0,
  })
  const [kpiLoading,   setKpiLoading]   = useState(true)

  // ── detail state ─────────────────────────────────────────────────────────────
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [detailData,    setDetailData]    = useState<PurchaseWithItems | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── fetch KPIs ───────────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const som = startOfMonth()
    const [
      { data: allPurchases },
      { data: monthPurchases },
      { data: itemsData },
    ] = await Promise.all([
      supabase.from('purchases').select('grand_total'),
      supabase.from('purchases').select('id').gte('purchase_date', som),
      supabase.from('purchase_items').select('quantity'),
    ])

    setKpi({
      total_count:       (allPurchases ?? []).length,
      this_month:        (monthPurchases ?? []).length,
      total_spent:       (allPurchases ?? []).reduce((s, p) => s + p.grand_total, 0),
      total_items_bought:(itemsData ?? []).reduce((s, i) => s + i.quantity, 0),
    })
    setKpiLoading(false)
  }, [supabase])

  // ── fetch purchases list ──────────────────────────────────────────────────────
  const fetchPurchases = useCallback(async (
    f: PurchaseFilters = filters,
    sf: SortField = sortField,
    sd: SortDir = sortDir,
    pg: number = page,
  ) => {
    setLoading(true)

    const { from, to } = dateRangeToFilter(f.dateRange, f.customFrom, f.customTo)

    // Fetch purchases with supplier name
    let query = supabase
      .from('purchases')
      .select(`
        id, supplier_id, purchase_number, purchase_date,
        subtotal, tax_amount, discount_amount, grand_total, notes, created_at,
        suppliers!inner(name)
      `, { count: 'exact' })

    if (from) query = query.gte('purchase_date', from)
    if (to)   query = query.lte('purchase_date', to)

    // Sort
    if (sf === 'supplier_name') {
      query = query.order('suppliers(name)', { ascending: sd === 'asc' })
    } else {
      query = query.order(sf, { ascending: sd === 'asc' })
    }

    // Pagination
    const from_row = (pg - 1) * ROWS_PER_PAGE
    query = query.range(from_row, from_row + ROWS_PER_PAGE - 1)

    const { data, count, error } = await query

    if (error) { console.error(error); setLoading(false); return }

    // Fetch item counts per purchase
    const purchaseIds = (data ?? []).map(p => p.id)
    let itemCountMap = new Map<string, number>()
    if (purchaseIds.length > 0) {
      const { data: itemCounts } = await supabase
        .from('purchase_items')
        .select('purchase_id')
        .in('purchase_id', purchaseIds)
      for (const item of itemCounts ?? []) {
        itemCountMap.set(item.purchase_id, (itemCountMap.get(item.purchase_id) ?? 0) + 1)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: Purchase[] = (data ?? []).map((p: any) => ({
      id: p.id,
      supplier_id: p.supplier_id,
      supplier_name: p.suppliers?.name ?? '—',
      purchase_number: p.purchase_number,
      purchase_date: p.purchase_date,
      subtotal: p.subtotal,
      tax_amount: p.tax_amount,
      discount_amount: p.discount_amount,
      grand_total: p.grand_total,
      notes: p.notes,
      created_at: p.created_at,
      item_count: itemCountMap.get(p.id) ?? 0,
    }))

    // Client-side search filter (by purchase_number or supplier_name)
    if (f.search.trim()) {
      const q = f.search.toLowerCase()
      rows = rows.filter(p =>
        p.purchase_number.toLowerCase().includes(q) ||
        p.supplier_name.toLowerCase().includes(q)
      )
    }

    setPurchases(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, filters, sortField, sortDir, page])

  // ── fetch purchase detail ─────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (purchaseId: string) => {
    setDetailLoading(true)

    const [
      { data: purchase },
      { data: items },
    ] = await Promise.all([
      supabase
        .from('purchases')
        .select('*, suppliers!inner(name)')
        .eq('id', purchaseId)
        .single(),
      supabase
        .from('purchase_items')
        .select('*, products!inner(name, unit_name)')
        .eq('purchase_id', purchaseId)
        .order('id'),
    ])

    if (!purchase) { setDetailLoading(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedItems: PurchaseItem[] = (items ?? []).map((i: any) => ({
      id: i.id,
      purchase_id: i.purchase_id,
      product_id: i.product_id,
      product_name: i.products?.name ?? '—',
      unit_name: i.products?.unit_name ?? 'unit',
      buy_mode: i.buy_mode,
      box_count: i.box_count,
      quantity: i.quantity,
      unit_price: i.unit_price,
      tax_rate: i.tax_rate,
      line_total: i.line_total,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = purchase as any
    setDetailData({
      id: p.id,
      supplier_id: p.supplier_id,
      supplier_name: p.suppliers?.name ?? '—',
      purchase_number: p.purchase_number,
      purchase_date: p.purchase_date,
      subtotal: p.subtotal,
      tax_amount: p.tax_amount,
      discount_amount: p.discount_amount,
      grand_total: p.grand_total,
      notes: p.notes,
      created_at: p.created_at,
      items: enrichedItems,
    })
    setDetailLoading(false)
  }, [supabase])

  // ── initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchKpi()
    fetchPurchases()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── detail load on selection ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else setDetailData(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── filter / sort / page handlers ────────────────────────────────────────────
  const handleSearchChange = useCallback((search: string) => {
    const next = { ...filters, search }
    setFilters(next)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchPurchases(next, sortField, sortDir, 1)
    }, 300)
  }, [filters, sortField, sortDir, fetchPurchases])

  const handleDateRangeChange = useCallback((
    dateRange: PurchaseFilters['dateRange'],
    customFrom = filters.customFrom,
    customTo   = filters.customTo,
  ) => {
    const next = { ...filters, dateRange, customFrom, customTo }
    setFilters(next)
    setPage(1)
    fetchPurchases(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchPurchases])

  const handleSort = useCallback((field: SortField) => {
    const dir: SortDir = sortField === field && sortDir === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDir(dir)
    setPage(1)
    fetchPurchases(filters, field, dir, 1)
  }, [sortField, sortDir, filters, fetchPurchases])

  const handlePageChange = useCallback((pg: number) => {
    setPage(pg)
    fetchPurchases(filters, sortField, sortDir, pg)
  }, [filters, sortField, sortDir, fetchPurchases])

  // ── generate purchase number ──────────────────────────────────────────────────
  const generatePurchaseNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .gte('purchase_date', `${year}-01-01`)
    const next = (count ?? 0) + 1
    return `PO-${year}-${String(next).padStart(3, '0')}`
  }, [supabase])

  // ── save purchase ─────────────────────────────────────────────────────────────
  const savePurchase = useCallback(async (
    header: PurchaseHeaderValues,
    lineItems: LineItemDraft[],
    discount: string,
    discountMode: DiscountMode,
  ): Promise<boolean> => {
    // Validate line items
    const validItems = lineItems.filter(r => r.product && num(r.qty_input) > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one product with a valid quantity')
      return false
    }

    // Compute totals
    const subtotal = validItems.reduce((s, r) => s + r.line_total, 0)
    const taxAmount = validItems.reduce((s, r) => {
      return s + (r.line_total * num(r.tax_rate) / 100)
    }, 0)
    const discountVal = discountMode === 'flat'
      ? num(discount)
      : subtotal * num(discount) / 100
    const grandTotal = subtotal + taxAmount - discountVal

    // 1. INSERT purchases
    const { data: purchase, error: pErr } = await supabase
      .from('purchases')
      .insert({
        supplier_id:     header.supplier_id,
        purchase_number: header.purchase_number,
        purchase_date:   header.purchase_date || today(),
        subtotal:        parseFloat(subtotal.toFixed(2)),
        tax_amount:      parseFloat(taxAmount.toFixed(2)),
        discount_amount: parseFloat(discountVal.toFixed(2)),
        grand_total:     parseFloat(grandTotal.toFixed(2)),
        notes:           header.notes.trim() || null,
      })
      .select()
      .single()

    if (pErr) {
      if (pErr.code === '23505') toast.error('Purchase number already exists')
      else toast.error(pErr.message)
      return false
    }

    // 2. INSERT purchase_items + stock_movements + UPDATE products.current_stock
    for (const row of validItems) {
      const product = row.product!
      const isBox   = row.buy_mode === 'box'
      const boxCount   = isBox ? num(row.qty_input) : null
      const baseUnits  = isBox
        ? num(row.qty_input) * (product.units_per_box ?? 1)
        : num(row.qty_input)
      const unitPrice  = num(row.unit_price)
      const lineTotal  = parseFloat((num(row.qty_input) * unitPrice).toFixed(2))

      // purchase_item
      await supabase.from('purchase_items').insert({
        purchase_id: purchase.id,
        product_id:  product.id,
        buy_mode:    row.buy_mode,
        box_count:   boxCount,
        quantity:    parseFloat(baseUnits.toFixed(3)),
        unit_price:  unitPrice,
        tax_rate:    num(row.tax_rate),
        line_total:  lineTotal,
      })

      // stock_movement
      await supabase.from('stock_movements').insert({
        product_id:    product.id,
        movement_type: 'purchase',
        quantity:      parseFloat(baseUnits.toFixed(3)),
        reference_id:  purchase.id,
        notes:         `Purchase ${header.purchase_number}`,
      })

      // update current_stock
      if (product.track_inventory) {
        await supabase.rpc('increment_stock', {
          p_product_id: product.id,
          p_delta:      parseFloat(baseUnits.toFixed(3)),
        }).then(async ({ error: rpcErr }) => {
          if (rpcErr) {
            // fallback: manual update
            const { data: prod } = await supabase
              .from('products')
              .select('current_stock')
              .eq('id', product.id)
              .single()
            if (prod) {
              await supabase
                .from('products')
                .update({ current_stock: prod.current_stock + baseUnits })
                .eq('id', product.id)
            }
          }
        })
      }
    }

    toast.success(`${header.purchase_number} saved — stock updated`)
    await Promise.all([fetchPurchases(), fetchKpi()])
    return true
  }, [supabase, fetchPurchases, fetchKpi])

  // ── delete purchase ───────────────────────────────────────────────────────────
  const deletePurchase = useCallback(async (purchase: Purchase): Promise<boolean> => {
    // Fetch line items first
    const { data: items } = await supabase
      .from('purchase_items')
      .select('*, products!inner(id, name, current_stock, track_inventory)')
      .eq('purchase_id', purchase.id)

    // Guard: check no product goes negative
    for (const item of items ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = (item as any).products
      if (prod?.track_inventory && prod.current_stock - item.quantity < 0) {
        toast.error(`Cannot delete — stock of "${prod.name}" would go below zero`)
        return false
      }
    }

    // Delete stock movements
    await supabase
      .from('stock_movements')
      .delete()
      .eq('reference_id', purchase.id)
      .eq('movement_type', 'purchase')

    // Reverse stock for each item
    for (const item of items ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = (item as any).products
      if (prod?.track_inventory) {
        const { data: current } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', item.product_id)
          .single()
        if (current) {
          await supabase
            .from('products')
            .update({ current_stock: current.current_stock - item.quantity })
            .eq('id', item.product_id)
        }
      }
    }

    // Delete purchase (cascades to purchase_items)
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchase.id)

    if (error) { toast.error(error.message); return false }

    if (selectedId === purchase.id) setSelectedId(null)
    toast.success(`${purchase.purchase_number} deleted — stock reversed`)
    await Promise.all([fetchPurchases(), fetchKpi()])
    return true
  }, [supabase, fetchPurchases, fetchKpi, selectedId])

  // ── quick add product ─────────────────────────────────────────────────────────
  const quickAddProduct = useCallback(async (
    values: QuickProductFormValues,
  ): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name:               values.name.trim(),
        sku:                values.sku.trim() || null,
        category:           values.category.trim() || null,
        unit_name:          values.unit_name.trim() || 'piece',
        purchase_price:     num(values.purchase_price),
        selling_price:      num(values.selling_price),
        gst_rate:           num(values.gst_rate),
        has_box:            values.has_box,
        box_name:           values.has_box ? values.box_name.trim() || null : null,
        units_per_box:      values.has_box ? num(values.units_per_box) || null : null,
        box_purchase_price: values.has_box ? num(values.box_purchase_price) || null : null,
        box_selling_price:  values.has_box ? num(values.box_selling_price) || null : null,
        track_inventory:    values.track_inventory,
        current_stock:      0,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); return null }
    toast.success(`"${values.name}" added as a new product`)
    return data as Product
  }, [supabase])

  // ── search suppliers ──────────────────────────────────────────────────────────
  const searchSuppliers = useCallback(async (q: string) => {
    if (!q.trim()) return []
    const { data } = await supabase
      .from('suppliers')
      .select('id, name, phone, email')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(10)
    return data ?? []
  }, [supabase])

  // ── search products ───────────────────────────────────────────────────────────
  const searchProducts = useCallback(async (q: string): Promise<Product[]> => {
    if (!q.trim()) return []
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, unit_name, purchase_price, has_box, box_name, units_per_box, box_purchase_price, gst_rate, current_stock, track_inventory, is_active')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .order('name')
      .limit(15)
    return (data ?? []) as Product[]
  }, [supabase])

  return {
    // list
    purchases, total, page, sortField, sortDir, filters, loading,
    // kpi
    kpi, kpiLoading,
    // detail
    selectedId, detailData, detailLoading,
    // actions
    setSelectedId,
    handleSearchChange, handleDateRangeChange, handleSort, handlePageChange,
    generatePurchaseNumber,
    savePurchase, deletePurchase, quickAddProduct,
    searchSuppliers, searchProducts,
    fetchPurchases, fetchKpi,
  }
}
