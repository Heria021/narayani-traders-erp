'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type Product, type StockMovement,
  type ProductFilters, type SortField, type SortDir,
  type ProductFormValues, DEFAULT_FILTERS, ROWS_PER_PAGE,
} from '../../app/features/products/_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | number) { return Number(v) || 0 }

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useProducts() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // debounce ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)


  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .order('category')

    const unique = [...new Set((data ?? []).map(r => r.category as string).filter(Boolean))]
    setCategories(unique)
  }, [supabase])

  // ── fetch paginated + filtered product list ────────────────────────────────
  const fetchProducts = useCallback(async (
    f: ProductFilters = filters,
    sf: SortField = sortField,
    sd: SortDir = sortDir,
    pg: number = page,
  ) => {
    setLoading(true)

    let q = supabase.from('products').select('*', { count: 'exact' })

    // Search across name, sku, category (case-insensitive via ilike)
    if (f.search.trim()) {
      const s = `%${f.search.trim()}%`
      q = q.or(`name.ilike.${s},sku.ilike.${s},category.ilike.${s}`)
    }

    // Category filter
    if (f.category) q = q.eq('category', f.category)

    // Status filter
    if (f.status === 'active') q = q.eq('is_active', true)
    if (f.status === 'inactive') q = q.eq('is_active', false)
    if (f.status === 'low_stock') q = q.lte('current_stock', supabase.rpc as unknown as never)

    // For low_stock we use a raw filter
    if (f.status === 'low_stock') {
      // Supabase doesn't support column-to-column comparisons directly.
      // We fetch all and filter client-side only for this special case.
      q = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('track_inventory', true)
    }

    // Sort
    q = q.order(sf, { ascending: sd === 'asc' })

    // Pagination
    const from = (pg - 1) * ROWS_PER_PAGE
    const to = from + ROWS_PER_PAGE - 1
    q = q.range(from, to)

    const { data, count, error } = await q

    if (error) { console.error('Products fetch error', error); setLoading(false); return }

    let rows = (data ?? []) as Product[]

    // Client-side low_stock post-filter (column-to-column comparison)
    if (f.status === 'low_stock') {
      rows = rows.filter(r => r.current_stock <= r.minimum_stock)
    }

    setProducts(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, filters, sortField, sortDir, page])

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    // ── auth diagnostic (remove after confirmed working) ──
    supabase.auth.getUser().then(({ data, error }) => {
      console.log('[useProducts] auth.getUser →', data?.user?.id ?? 'NO SESSION', error ?? '')
    })
    // ──────────────────────────────────────────────────────
    fetchCategories()
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── re-fetch on sort / page change ─────────────────────────────────────────
  useEffect(() => {
    fetchProducts(filters, sortField, sortDir, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDir, page])

  // ── filter handlers ────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    const next = { ...filters, search: value }
    setFilters(next)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchProducts(next, sortField, sortDir, 1)
    }, 300)
  }, [filters, sortField, sortDir, fetchProducts])

  const handleCategoryChange = useCallback((value: string) => {
    const next = { ...filters, category: value }
    setFilters(next)
    setPage(1)
    fetchProducts(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchProducts])

  const handleStatusChange = useCallback((value: ProductFilters['status']) => {
    const next = { ...filters, status: value }
    setFilters(next)
    setPage(1)
    fetchProducts(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchProducts])

  const handleSort = useCallback((field: SortField) => {
    const nextDir: SortDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDir(nextDir)
  }, [sortField, sortDir])

  const handlePageChange = useCallback((p: number) => setPage(p), [])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
    fetchProducts(DEFAULT_FILTERS, sortField, sortDir, 1)
  }, [sortField, sortDir, fetchProducts])

  // ── mutations ─────────────────────────────────────────────────────────────
  const addProduct = useCallback(async (values: ProductFormValues): Promise<boolean> => {
    const payload = buildPayload(values)

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()

    if (error) { toast.error(error.message); return false }

    // Insert opening_stock movement if provided
    const openingStock = fmt(values.opening_stock)
    if (openingStock > 0 && data) {
      await supabase.from('stock_movements').insert({
        product_id: data.id,
        movement_type: 'opening_stock',
        quantity: openingStock,
        notes: 'Opening stock on product creation',
      })
      // Also set current_stock on the product
      await supabase
        .from('products')
        .update({ current_stock: openingStock })
        .eq('id', data.id)
    }

    toast.success(`${values.name} added successfully`)
    await Promise.all([fetchProducts(), fetchCategories()])
    return true
  }, [supabase, fetchProducts, fetchCategories])

  const updateProduct = useCallback(async (id: string, values: ProductFormValues): Promise<boolean> => {
    const payload = buildPayload(values)

    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)

    if (error) { toast.error(error.message); return false }

    toast.success(`${values.name} updated`)
    await Promise.all([fetchProducts(), fetchCategories()])
    return true
  }, [supabase, fetchProducts, fetchCategories])

  const toggleActive = useCallback(async (product: Product): Promise<void> => {
    const next = !product.is_active
    const { error } = await supabase
      .from('products')
      .update({ is_active: next })
      .eq('id', product.id)

    if (error) { toast.error(error.message); return }
    toast.success(`${product.name} ${next ? 'activated' : 'deactivated'}`)
    await fetchProducts()
  }, [supabase, fetchProducts])

  const deleteProduct = useCallback(async (product: Product): Promise<boolean> => {
    // Guard: must have zero stock
    if (product.current_stock > 0) {
      toast.error('Cannot delete: product has stock. Deactivate instead.')
      return false
    }

    // Guard: check for linked records
    const [{ count: saleCount }, { count: purchaseCount }] = await Promise.all([
      supabase.from('sale_items').select('id', { count: 'exact', head: true }).eq('product_id', product.id),
      supabase.from('purchase_items').select('id', { count: 'exact', head: true }).eq('product_id', product.id),
    ])

    if ((saleCount ?? 0) > 0 || (purchaseCount ?? 0) > 0) {
      toast.error('This product has transaction history and cannot be deleted. Deactivate it instead.')
      return false
    }

    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) { toast.error(error.message); return false }

    toast.success(`${product.name} deleted`)
    await Promise.all([fetchProducts(), fetchCategories()])
    return true
  }, [supabase, fetchProducts, fetchCategories])

  const fetchStockMovements = useCallback(async (productId: string): Promise<StockMovement[]> => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('id, movement_type, quantity, reference_id, notes, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) { console.error(error); return [] }
    return (data ?? []) as StockMovement[]
  }, [supabase])

  return {
    // state
    products, total, page, sortField, sortDir, filters, categories, loading,
    // handlers
    handleSearchChange, handleCategoryChange, handleStatusChange,
    handleSort, handlePageChange, clearFilters,
    // mutations
    addProduct, updateProduct, toggleActive, deleteProduct,
    fetchStockMovements,
  }
}

// ── payload builder ───────────────────────────────────────────────────────────
function buildPayload(v: ProductFormValues) {
  const hasBox = v.has_box
  return {
    name: v.name.trim(),
    sku: v.sku.trim() || null,
    description: v.description.trim() || null,
    category: v.category.trim() || null,
    unit_name: v.unit_name.trim() || 'piece',
    selling_price: fmt(v.selling_price),
    purchase_price: fmt(v.purchase_price),
    gst_rate: fmt(v.gst_rate),
    is_active: v.is_active,
    has_box: hasBox,
    box_name: hasBox ? v.box_name.trim() || null : null,
    units_per_box: hasBox ? (parseInt(v.units_per_box) || null) : null,
    box_purchase_price: hasBox ? fmt(v.box_purchase_price) : null,
    box_selling_price: hasBox ? fmt(v.box_selling_price) : null,
    track_inventory: v.track_inventory,
    minimum_stock: fmt(v.minimum_stock),
  }
}
