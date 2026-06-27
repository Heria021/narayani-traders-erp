'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type Purchase, type PurchaseWithItems, type PurchaseItem,
  type PurchaseKpi, type PurchaseFilters, type SortField, type SortDir,
  DEFAULT_FILTERS, ROWS_PER_PAGE,
} from './types'
import { rollbackReferencedStock } from '@/lib/services/stockMovement'
import { mapBalanceRow, mapPurchaseRow, type SupplierBalanceRow } from '../../suppliers/_components/balances'
import type { SupplierWithStats, SupplierPaymentFormValues } from '../../suppliers/_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

  const [purchases,    setPurchases]    = useState<Purchase[]>([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [sortField,    setSortField]    = useState<SortField>('purchase_date')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [filters,      setFilters]      = useState<PurchaseFilters>(DEFAULT_FILTERS)
  const [loading,      setLoading]      = useState(true)

  const [kpi,          setKpi]          = useState<PurchaseKpi>({
    total_count: 0, this_month: 0, total_spent: 0, pending_amount: 0, pending_count: 0,
  })
  const [kpiLoading,   setKpiLoading]   = useState(true)

  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [detailData,    setDetailData]    = useState<PurchaseWithItems | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [paymentSupplier, setPaymentSupplier] = useState<SupplierWithStats | null>(null)
  const [paymentPrefill,  setPaymentPrefill]  = useState<{ purchaseId: string; amount: string } | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const som = startOfMonth()
    const [
      { data: allPurchases },
      { data: monthPurchases },
      { data: pendingRows },
    ] = await Promise.all([
      supabase.from('purchases').select('grand_total'),
      supabase.from('purchases').select('id').gte('purchase_date', som),
      supabase.from('purchases').select('balance_due'),
    ])

    const pending = (pendingRows ?? []).filter(r => Number(r.balance_due) > 0)

    setKpi({
      total_count:     (allPurchases ?? []).length,
      this_month:      (monthPurchases ?? []).length,
      total_spent:     (allPurchases ?? []).reduce((s, p) => s + Number(p.grand_total), 0),
      pending_amount:  pending.reduce((s, r) => s + Number(r.balance_due), 0),
      pending_count:   pending.length,
    })
    setKpiLoading(false)
  }, [supabase])

  const fetchPurchases = useCallback(async (
    f: PurchaseFilters = filters,
    sf: SortField = sortField,
    sd: SortDir = sortDir,
    pg: number = page,
  ) => {
    setLoading(true)

    const { from, to } = dateRangeToFilter(f.dateRange, f.customFrom, f.customTo)

    let query = supabase
      .from('purchases')
      .select(`
        id, supplier_id, purchase_number, purchase_date,
        subtotal, tax_amount, discount_amount, grand_total,
        amount_paid, balance_due, payment_status,
        notes, created_at,
        suppliers!inner(name)
      `, { count: 'exact' })

    if (from) query = query.gte('purchase_date', from)
    if (to)   query = query.lte('purchase_date', to)
    if (f.paymentStatus !== 'all') query = query.eq('payment_status', f.paymentStatus)

    if (sf === 'supplier_name') {
      query = query.order('suppliers(name)', { ascending: sd === 'asc' })
    } else {
      query = query.order(sf, { ascending: sd === 'asc' })
    }

    const from_row = (pg - 1) * ROWS_PER_PAGE
    query = query.range(from_row, from_row + ROWS_PER_PAGE - 1)

    const { data, count, error } = await query

    if (error) { console.error(error); setLoading(false); return }

    const purchaseIds = (data ?? []).map(p => p.id)
    const itemCountMap = new Map<string, number>()
    if (purchaseIds.length > 0) {
      const { data: itemCounts } = await supabase
        .from('purchase_items')
        .select('purchase_id')
        .in('purchase_id', purchaseIds)
      for (const item of itemCounts ?? []) {
        itemCountMap.set(item.purchase_id, (itemCountMap.get(item.purchase_id) ?? 0) + 1)
      }
    }

    let rows: Purchase[] = (data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      supplier_id: p.supplier_id as string,
      supplier_name: (p.suppliers as { name: string } | null)?.name ?? '—',
      purchase_number: p.purchase_number as string,
      purchase_date: p.purchase_date as string,
      subtotal: Number(p.subtotal),
      tax_amount: Number(p.tax_amount),
      discount_amount: Number(p.discount_amount),
      grand_total: Number(p.grand_total),
      notes: p.notes as string | null,
      created_at: p.created_at as string,
      item_count: itemCountMap.get(p.id as string) ?? 0,
      ...mapPurchaseRow(p),
    }))

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

    const p = purchase as Record<string, unknown>
    setDetailData({
      id: p.id as string,
      supplier_id: p.supplier_id as string,
      supplier_name: (p.suppliers as { name: string } | null)?.name ?? '—',
      purchase_number: p.purchase_number as string,
      purchase_date: p.purchase_date as string,
      subtotal: Number(p.subtotal),
      tax_amount: Number(p.tax_amount),
      discount_amount: Number(p.discount_amount),
      grand_total: Number(p.grand_total),
      notes: p.notes as string | null,
      created_at: p.created_at as string,
      items: enrichedItems,
      ...mapPurchaseRow(p),
    })
    setDetailLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchKpi()
    fetchPurchases()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else setDetailData(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

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

  const handlePaymentStatusChange = useCallback((paymentStatus: PurchaseFilters['paymentStatus']) => {
    const next = { ...filters, paymentStatus }
    setFilters(next)
    setPage(1)
    fetchPurchases(next, sortField, sortDir, 1)
  }, [filters, sortField, sortDir, fetchPurchases])

  const prepareRecordPayment = useCallback(async (purchase: PurchaseWithItems) => {
    const { data, error } = await supabase
      .from('supplier_balances')
      .select('*')
      .eq('id', purchase.supplier_id)
      .single()

    if (error || !data) {
      toast.error('Could not load supplier balance')
      return false
    }

    setPaymentSupplier(mapBalanceRow(data as SupplierBalanceRow))
    setPaymentPrefill({
      purchaseId: purchase.id,
      amount: purchase.balance_due > 0 ? purchase.balance_due.toFixed(2) : '',
    })
    return true
  }, [supabase])

  const clearPaymentContext = useCallback(() => {
    setPaymentSupplier(null)
    setPaymentPrefill(null)
  }, [])

  const recordPayment = useCallback(async (values: SupplierPaymentFormValues): Promise<boolean> => {
    if (!paymentSupplier || !detailData) return false

    const amountNum = Number(values.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid payment amount')
      return false
    }

    const { error } = await supabase
      .from('supplier_payments')
      .insert({
        supplier_id:      paymentSupplier.id,
        purchase_id:      values.purchase_id || detailData.id,
        amount:           amountNum,
        payment_method:   values.payment_method,
        reference_number: values.reference_number.trim() || null,
        payment_date:     values.payment_date,
        note:             values.note.trim() || null,
      })

    if (error) {
      toast.error(error.message)
      return false
    }

    toast.success('Payment recorded successfully')
    await Promise.all([
      fetchDetail(detailData.id),
      fetchPurchases(),
      fetchKpi(),
    ])
    return true
  }, [supabase, paymentSupplier, detailData, fetchDetail, fetchPurchases, fetchKpi])

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

  const deletePurchase = useCallback(async (purchase: Purchase): Promise<boolean> => {
    const { data: items } = await supabase
      .from('purchase_items')
      .select('*, products!inner(id, name, current_stock, track_inventory)')
      .eq('purchase_id', purchase.id)

    for (const item of items ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = (item as any).products
      if (prod?.track_inventory && prod.current_stock - item.quantity < 0) {
        toast.error(`Cannot delete — stock of "${prod.name}" would go below zero`)
        return false
      }
    }

    const stockLines = (items ?? []).map(item => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = (item as any).products
      return {
        productId: item.product_id,
        baseUnits: item.quantity,
        trackInventory: Boolean(prod?.track_inventory),
      }
    })

    const rev = await rollbackReferencedStock(supabase, {
      referenceId: purchase.id,
      movementType: 'purchase',
      lines: stockLines,
    })
    if (!rev.ok) {
      toast.error(`Could not reverse stock: ${rev.message}`)
      return false
    }

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

  return {
    purchases, total, page, sortField, sortDir, filters, loading,
    kpi, kpiLoading,
    selectedId, detailData, detailLoading,
    paymentSupplier, paymentPrefill,
    setSelectedId,
    handleSearchChange, handleDateRangeChange, handlePaymentStatusChange, handleSort, handlePageChange,
    deletePurchase,
    prepareRecordPayment, recordPayment, clearPaymentContext,
    fetchPurchases, fetchKpi,
  }
}
