'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type Sale, type SaleWithItems, type SaleItem, type PaymentRecord,
  type SaleKpi, type SaleFilters, type SortField, type SortDir,
  type QuickProductFormValues, type SaleProduct, type Customer,
  type PaymentMethod, type PaymentStatus,
  DEFAULT_SALE_FILTERS, ROWS_PER_PAGE, WALKIN_CUSTOMER_NAME,
} from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)

function startOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(new Date().setDate(diff)).toISOString().slice(0, 10)
}

function dateRangeToFilter(
  range: SaleFilters['dateRange'],
  customFrom: string,
  customTo: string,
): { from: string | null; to: string | null } {
  const t = today()
  if (range === 'today')  return { from: t, to: t }
  if (range === 'week')   return { from: startOfWeek(), to: t }
  if (range === 'month')  return { from: startOfMonth(), to: t }
  if (range === 'custom') return { from: customFrom || null, to: customTo || null }
  return { from: null, to: null }
}

function derivePaymentStatus(amountPaid: number, grandTotal: number): PaymentStatus {
  if (amountPaid <= 0)                          return 'pending'
  if (grandTotal - amountPaid <= 0.001)         return 'paid'
  return 'partial'
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useSales() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [sales,      setSales]      = useState<Sale[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [sortField,  setSortField]  = useState<SortField>('sale_date')
  const [sortDir,    setSortDir]    = useState<SortDir>('desc')
  const [filters,    setFilters]    = useState<SaleFilters>(DEFAULT_SALE_FILTERS)
  const [loading,    setLoading]    = useState(true)

  // ── KPI state ───────────────────────────────────────────────────────────────
  const [kpi,        setKpi]        = useState<SaleKpi>({
    today_sales: 0, this_month: 0, total_outstanding: 0, total_collected: 0,
  })
  const [kpiLoading, setKpiLoading] = useState(true)

  // ── detail state ─────────────────────────────────────────────────────────────
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [detailData,    setDetailData]    = useState<SaleWithItems | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── walk-in customer ID cache ─────────────────────────────────────────────────
  const walkinIdRef = useRef<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── get or create walk-in customer ──────────────────────────────────────────
  const getOrCreateWalkinCustomer = useCallback(async (): Promise<string | null> => {
    if (walkinIdRef.current) return walkinIdRef.current

    // check if exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('name', WALKIN_CUSTOMER_NAME)
      .single()

    if (existing) {
      walkinIdRef.current = existing.id
      return existing.id
    }

    // create walk-in customer
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        name:          WALKIN_CUSTOMER_NAME,
        is_active:     false,
        credit_limit:  0,
        opening_balance: 0,
      })
      .select('id')
      .single()

    if (error) { console.error('Failed to create walk-in customer:', error); return null }
    walkinIdRef.current = created.id
    return created.id
  }, [supabase])

  // ── fetch KPIs ───────────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const t   = today()
    const som = startOfMonth()

    const [
      { data: allSales },
      { data: todaySales },
      { data: monthSales },
    ] = await Promise.all([
      supabase.from('sales').select('grand_total, amount_paid, balance_due, payment_status'),
      supabase.from('sales').select('grand_total').eq('sale_date', t),
      supabase.from('sales').select('grand_total').gte('sale_date', som),
    ])

    setKpi({
      today_sales:       (todaySales ?? []).reduce((s, r) => s + r.grand_total, 0),
      this_month:        (monthSales ?? []).reduce((s, r) => s + r.grand_total, 0),
      total_outstanding: (allSales ?? [])
        .filter(r => r.payment_status !== 'paid')
        .reduce((s, r) => s + r.balance_due, 0),
      total_collected:   (allSales ?? []).reduce((s, r) => s + r.amount_paid, 0),
    })
    setKpiLoading(false)
  }, [supabase])

  // ── fetch sales list ──────────────────────────────────────────────────────────
  const fetchSales = useCallback(async (
    f: SaleFilters = filters,
    sf: SortField  = sortField,
    sd: SortDir    = sortDir,
    pg: number     = page,
  ) => {
    setLoading(true)

    const { from, to } = dateRangeToFilter(f.dateRange, f.customFrom, f.customTo)

    let query = supabase
      .from('sales')
      .select(`
        id, customer_id, invoice_number, sale_date,
        subtotal, tax_amount, discount, grand_total,
        amount_paid, balance_due, payment_status, due_date, notes, walkin_name, created_at,
        customers!inner(name)
      `, { count: 'exact' })

    if (from) query = query.gte('sale_date', from)
    if (to)   query = query.lte('sale_date', to)
    if (f.status !== 'all') query = query.eq('payment_status', f.status)

    query = query.order(sf, { ascending: sd === 'asc' })

    const from_row = (pg - 1) * ROWS_PER_PAGE
    query = query.range(from_row, from_row + ROWS_PER_PAGE - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching sales:', error.message, error.details, error.hint)
      setLoading(false)
      return
    }

    // Fetch item counts per sale
    const saleIds = (data ?? []).map(s => s.id)
    const itemCountMap = new Map<string, number>()
    if (saleIds.length > 0) {
      const { data: itemCounts } = await supabase
        .from('sale_items')
        .select('sale_id')
        .in('sale_id', saleIds)
      for (const item of itemCounts ?? []) {
        itemCountMap.set(item.sale_id, (itemCountMap.get(item.sale_id) ?? 0) + 1)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: Sale[] = (data ?? []).map((s: any) => {
      const rawName = s.customers?.name ?? '—'
      const customerName = rawName === WALKIN_CUSTOMER_NAME
        ? (s.walkin_name ? `Walk-in (${s.walkin_name})` : 'Walk-in')
        : rawName
      return {
        id: s.id,
        customer_id: s.customer_id,
        customer_name: customerName,
        walkin_name: s.walkin_name,
        invoice_number: s.invoice_number,
        sale_date: s.sale_date,
        subtotal: s.subtotal,
        tax_amount: s.tax_amount,
        discount: s.discount,
        grand_total: s.grand_total,
        amount_paid: s.amount_paid,
        balance_due: s.balance_due,
        payment_status: s.payment_status as PaymentStatus,
        due_date: s.due_date,
        notes: s.notes,
        created_at: s.created_at,
        item_count: itemCountMap.get(s.id) ?? 0,
      }
    })

    // Client-side search
    if (f.search.trim()) {
      const q = f.search.toLowerCase()
      rows = rows.filter(s =>
        s.invoice_number.toLowerCase().includes(q) ||
        s.customer_name.toLowerCase().includes(q)
      )
    }

    setSales(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [supabase, filters, sortField, sortDir, page])

  // ── fetch sale detail ─────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (saleId: string) => {
    setDetailLoading(true)

    const [
      { data: sale },
      { data: items },
      { data: payments },
    ] = await Promise.all([
      supabase
        .from('sales')
        .select('*, customers!inner(name)')
        .eq('id', saleId)
        .single(),
      supabase
        .from('sale_items')
        .select('*, products!inner(name, unit_name, box_name, units_per_box)')
        .eq('sale_id', saleId)
        .order('id'),
      supabase
        .from('payments')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at'),
    ])

    if (!sale) { setDetailLoading(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedItems: SaleItem[] = (items ?? []).map((i: any) => ({
      id:           i.id,
      sale_id:      i.sale_id,
      product_id:   i.product_id,
      product_name: i.products?.name ?? '—',
      unit_name:    i.products?.unit_name ?? 'unit',
      box_name:     i.products?.box_name ?? null,
      units_per_box:i.products?.units_per_box ?? null,
      sell_mode:    i.sell_mode,
      box_count:    i.box_count,
      quantity:     i.quantity,
      unit_price:   i.unit_price,
      tax_rate:     i.tax_rate,
      line_total:   i.line_total,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedPayments: PaymentRecord[] = (payments ?? []).map((p: any) => ({
      id:               p.id,
      sale_id:          p.sale_id,
      customer_id:      p.customer_id,
      amount:           p.amount,
      payment_method:   p.payment_method,
      reference_number: p.reference_number,
      payment_date:     p.payment_date,
      note:             p.note,
      created_at:       p.created_at,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = sale as any
    const rawName = s.customers?.name ?? '—'
    setDetailData({
      id: s.id,
      customer_id: s.customer_id,
      customer_name: rawName === WALKIN_CUSTOMER_NAME ? 'Walk-in' : rawName,
      walkin_name: s.walkin_name,
      invoice_number: s.invoice_number,
      sale_date: s.sale_date,
      subtotal: s.subtotal,
      tax_amount: s.tax_amount,
      discount: s.discount,
      grand_total: s.grand_total,
      amount_paid: s.amount_paid,
      balance_due: s.balance_due,
      payment_status: s.payment_status,
      due_date: s.due_date,
      notes: s.notes,
      created_at: s.created_at,
      items: enrichedItems,
      payments: enrichedPayments,
    })
    setDetailLoading(false)
  }, [supabase])

  // ── initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchKpi()
    fetchSales()
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
      fetchSales(next, sortField, sortDir, 1)
    }, 300)
  }, [filters, sortField, sortDir, fetchSales])

  const handleStatusChange = useCallback((status: SaleFilters['status']) => {
    const next = { ...filters, status }
    setFilters(next)
    setPage(1)
    fetchSales(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchSales])

  const handleDateRangeChange = useCallback((
    dateRange: SaleFilters['dateRange'],
    customFrom = filters.customFrom,
    customTo   = filters.customTo,
  ) => {
    const next = { ...filters, dateRange, customFrom, customTo }
    setFilters(next)
    setPage(1)
    fetchSales(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchSales])

  const handleSort = useCallback((field: SortField) => {
    const dir: SortDir = sortField === field && sortDir === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDir(dir)
    setPage(1)
    fetchSales(filters, field, dir, 1)
  }, [sortField, sortDir, filters, fetchSales])

  const handlePageChange = useCallback((pg: number) => {
    setPage(pg)
    fetchSales(filters, sortField, sortDir, pg)
  }, [filters, sortField, sortDir, fetchSales])

  // ── generate bill number ──────────────────────────────────────────────────────
  const generateBillNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('sales')
      .select('invoice_number')
      .like('invoice_number', `BILL-${year}-%`)

    const existingNumbers = new Set(
      (data ?? []).map(s => s.invoice_number.trim())
    )

    let next = 1
    while (true) {
      const candidate = `BILL-${year}-${String(next).padStart(3, '0')}`
      if (!existingNumbers.has(candidate)) return candidate
      next++
    }
  }, [supabase])

  // ── delete sale ───────────────────────────────────────────────────────────────
  const deleteSale = useCallback(async (sale: Sale): Promise<boolean> => {
    // Guard: same-day only
    if (sale.sale_date !== today()) {
      toast.error('Cannot delete — only today\'s bills can be deleted')
      return false
    }

    // Guard: no payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('sale_id', sale.id)
      .limit(1)

    if (payments && payments.length > 0) {
      const amt = payments[0].amount
      toast.error(`Cannot delete — payment of ₹${amt.toFixed(2)} is recorded against this bill`)
      return false
    }

    // Fetch line items for stock reversal
    const { data: items } = await supabase
      .from('sale_items')
      .select('*, products!inner(id, name, current_stock, track_inventory)')
      .eq('sale_id', sale.id)

    // Delete stock movements
    await supabase
      .from('stock_movements')
      .delete()
      .eq('reference_id', sale.id)
      .eq('movement_type', 'sale')

    // Reverse stock for each item
    for (const item of items ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = (item as any).products
      if (prod?.track_inventory) {
        await supabase.rpc('increment_stock', {
          p_product_id: item.product_id,
          p_delta:      parseFloat(item.quantity.toFixed(3)),
        })
      }
    }

    // Delete sale (cascades to sale_items)
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', sale.id)

    if (error) { toast.error(error.message); return false }

    if (selectedId === sale.id) setSelectedId(null)
    toast.success(`${sale.invoice_number} deleted — stock reversed`)
    await Promise.all([fetchSales(), fetchKpi()])
    return true
  }, [supabase, fetchSales, fetchKpi, selectedId])

  // ── record payment against existing sale ─────────────────────────────────────
  const recordPayment = useCallback(async (
    sale: Sale,
    amount: number,
    method: PaymentMethod,
    referenceNumber: string,
  ): Promise<boolean> => {
    if (amount <= 0) {
      toast.error('Amount must be greater than ₹0')
      return false
    }
    if (amount > sale.balance_due + 0.001) {
      toast.error(`Amount cannot exceed balance due (₹${sale.balance_due.toFixed(2)})`)
      return false
    }

    // Insert payment (only if customer is not walk-in placeholder)
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        customer_id:      sale.customer_id,
        sale_id:          sale.id,
        amount:           parseFloat(amount.toFixed(2)),
        payment_method:   method,
        reference_number: referenceNumber.trim() || null,
        payment_date:     today(),
      })

    if (payErr) { toast.error(payErr.message); return false }

    // Update sale
    const newAmountPaid  = parseFloat((sale.amount_paid + amount).toFixed(2))
    const newBalanceDue  = parseFloat((sale.grand_total - newAmountPaid).toFixed(2))
    const newStatus      = derivePaymentStatus(newAmountPaid, sale.grand_total)

    const { error: saleErr } = await supabase
      .from('sales')
      .update({
        amount_paid:    newAmountPaid,
        balance_due:    newBalanceDue < 0 ? 0 : newBalanceDue,
        payment_status: newStatus,
      })
      .eq('id', sale.id)

    if (saleErr) { toast.error(saleErr.message); return false }

    toast.success(`Payment of ₹${amount.toFixed(2)} recorded for ${sale.invoice_number}`)
    await Promise.all([fetchSales(), fetchKpi()])
    if (selectedId === sale.id) fetchDetail(sale.id)
    return true
  }, [supabase, fetchSales, fetchKpi, selectedId, fetchDetail])

  // ── customer outstanding balance ──────────────────────────────────────────────
  const getCustomerOutstanding = useCallback(async (customerId: string): Promise<number> => {
    const { data } = await supabase
      .from('sales')
      .select('balance_due')
      .eq('customer_id', customerId)
      .neq('payment_status', 'paid')
    return (data ?? []).reduce((s, r) => s + r.balance_due, 0)
  }, [supabase])

  // ── quick add product ─────────────────────────────────────────────────────────
  const quickAddProduct = useCallback(async (
    values: QuickProductFormValues,
  ): Promise<SaleProduct | null> => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name:               values.name.trim(),
        sku:                values.sku.trim() || null,
        category:           values.category.trim() || null,
        unit_name:          values.unit_name.trim() || 'piece',
        purchase_price:     Number(values.purchase_price) || 0,
        selling_price:      Number(values.selling_price) || 0,
        gst_rate:           Number(values.gst_rate) || 0,
        has_box:            values.has_box,
        box_name:           values.has_box ? values.box_name.trim() || null : null,
        units_per_box:      values.has_box ? Number(values.units_per_box) || null : null,
        box_purchase_price: values.has_box ? Number(values.box_purchase_price) || null : null,
        box_selling_price:  values.has_box ? Number(values.box_selling_price) || null : null,
        track_inventory:    values.track_inventory,
        current_stock:      0,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); return null }
    toast.success(`"${values.name}" added as a new product`)
    return data as SaleProduct
  }, [supabase])

  // ── search customers ──────────────────────────────────────────────────────────
  const searchCustomers = useCallback(async (q: string): Promise<Customer[]> => {
    if (!q.trim()) return []
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, city, credit_limit, opening_balance, is_active')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .neq('name', WALKIN_CUSTOMER_NAME)
      .order('name')
      .limit(10)
    return (data ?? []) as Customer[]
  }, [supabase])

  // ── search products ───────────────────────────────────────────────────────────
  const searchProducts = useCallback(async (q: string): Promise<SaleProduct[]> => {
    if (!q.trim()) return []
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, unit_name, selling_price, box_selling_price, purchase_price, has_box, box_name, units_per_box, gst_rate, current_stock, track_inventory, is_active')
      .ilike('name', `%${q}%`)
      .eq('is_active', true)
      .order('name')
      .limit(15)
    return (data ?? []) as SaleProduct[]
  }, [supabase])

  return {
    // list
    sales, total, page, sortField, sortDir, filters, loading,
    // kpi
    kpi, kpiLoading,
    // detail
    selectedId, detailData, detailLoading,
    // actions
    setSelectedId,
    handleSearchChange, handleStatusChange, handleDateRangeChange,
    handleSort, handlePageChange,
    generateBillNumber,
    deleteSale, recordPayment,
    getOrCreateWalkinCustomer, getCustomerOutstanding,
    quickAddProduct, searchCustomers, searchProducts,
    fetchSales, fetchKpi,
  }
}
