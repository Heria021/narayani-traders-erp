/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type SupplierWithStats, type Purchase,
  type PurchaseItem, type SupplierProduct, type SupplierKpi,
  type SupplierFormValues, type PayablesAgingBucket,
  type SupplierSortField, type SupplierSortDir,
} from './types'
import { mapBalanceRow, mapPurchaseRow, sumPositiveAmountOwed, type SupplierBalanceRow } from './balances'

function bucketAge(purchaseDate: string): PayablesAgingBucket['bucket'] {
  const days = Math.floor(
    (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  return '60+'
}

function sortSuppliers(
  rows: SupplierWithStats[],
  field: SupplierSortField,
  dir: SupplierSortDir,
): SupplierWithStats[] {
  const mult = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (field === 'name') {
      return mult * a.name.localeCompare(b.name)
    }
    if (field === 'amount_owed') {
      return mult * (a.amount_owed - b.amount_owed)
    }
    if (field === 'total_purchased') {
      return mult * (a.total_purchased - b.total_purchased)
    }
    // last_purchase_date — nulls last
    const aDate = a.last_purchase_date ?? ''
    const bDate = b.last_purchase_date ?? ''
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return mult * aDate.localeCompare(bDate)
  })
}

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useSuppliers() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [suppliers,         setSuppliers]         = useState<SupplierWithStats[]>([])
  const [kpi,               setKpi]               = useState<SupplierKpi>({
    total_count: 0, total_purchased: 0, amount_owed: 0, total_input_gst: 0,
  })
  const [aging,             setAging]             = useState<PayablesAgingBucket[]>([])
  const [search,            setSearch]            = useState('')
  const [outstandingOnly,   setOutstandingOnly]   = useState(false)
  const [sortField,         setSortField]         = useState<SupplierSortField>('amount_owed')
  const [sortDir,           setSortDir]           = useState<SupplierSortDir>('desc')
  const [loading,           setLoading]           = useState(true)
  const [kpiLoading,        setKpiLoading]        = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── detail state ─────────────────────────────────────────────────────────────
  const [selectedId,       setSelectedId]       = useState<string | null>(null)
  const [purchases,        setPurchases]        = useState<Purchase[]>([])
  const [purchaseItems,    setPurchaseItems]    = useState<PurchaseItem[]>([])
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [detailLoading,    setDetailLoading]    = useState(false)

  const selectedSupplier = suppliers.find(s => s.id === selectedId) ?? null

  // ── fetch KPIs + aging + GST ────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const [
      { data: balanceRows },
      { data: gstRows },
      { data: openPurchases },
    ] = await Promise.all([
      supabase.from('supplier_balances').select('amount_owed, total_purchased'),
      supabase.from('purchases').select('tax_amount'),
      supabase.from('purchases').select('purchase_date, balance_due').gt('balance_due', 0),
    ])

    const balances = balanceRows ?? []
    setKpi({
      total_count:     balances.length,
      total_purchased: balances.reduce((sum, r) => sum + r.total_purchased, 0),
      amount_owed:     sumPositiveAmountOwed(balances),
      total_input_gst: (gstRows ?? []).reduce((sum, r) => sum + (Number(r.tax_amount) || 0), 0),
    })

    const bucketMap = new Map<PayablesAgingBucket['bucket'], PayablesAgingBucket>([
      ['0-30',  { bucket: '0-30',  invoice_count: 0, total_due: 0 }],
      ['31-60', { bucket: '31-60', invoice_count: 0, total_due: 0 }],
      ['60+',   { bucket: '60+',   invoice_count: 0, total_due: 0 }],
    ])
    for (const row of openPurchases ?? []) {
      const bucket = bucketAge(row.purchase_date)
      const entry = bucketMap.get(bucket)!
      entry.invoice_count += 1
      entry.total_due += Number(row.balance_due) || 0
    }
    setAging(Array.from(bucketMap.values()))

    setKpiLoading(false)
  }, [supabase])

  // ── fetch supplier list ───────────────────────────────────────────────────────
  const fetchSuppliers = useCallback(async (
    s: string = search,
    outstanding: boolean = outstandingOnly,
    field: SupplierSortField = sortField,
    dir: SupplierSortDir = sortDir,
  ) => {
    setLoading(true)

    const { data: rows, error } = await supabase
      .from('supplier_balances')
      .select('*')

    if (error || !rows) { console.error(error); setLoading(false); return }

    let enriched: SupplierWithStats[] = (rows as SupplierBalanceRow[]).map(mapBalanceRow)

    if (outstanding) {
      enriched = enriched.filter(sup => sup.amount_owed > 0)
    }

    if (s.trim()) {
      const q = s.toLowerCase()
      enriched = enriched.filter(sup =>
        sup.name.toLowerCase().includes(q) ||
        (sup.phone ?? '').includes(q) ||
        (sup.gstin ?? '').toLowerCase().includes(q)
      )
    }

    enriched = sortSuppliers(enriched, field, dir)

    setSuppliers(enriched)
    setLoading(false)
  }, [supabase, search, outstandingOnly, sortField, sortDir])

  // ── fetch supplier detail ─────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (supplierId: string) => {
    setDetailLoading(true)

    const { data: purch } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('purchase_date', { ascending: false })

    const purchList: Purchase[] = (purch ?? []).map(row => ({
      id:              row.id,
      supplier_id:     row.supplier_id,
      purchase_number: row.purchase_number,
      purchase_date:   row.purchase_date,
      grand_total:     Number(row.grand_total),
      notes:           row.notes,
      created_at:      row.created_at,
      ...mapPurchaseRow(row as Record<string, unknown>),
    }))

    const purchIds = purchList.map(p => p.id)
    let allItems: PurchaseItem[] = []

    if (purchIds.length > 0) {
      const { data: items } = await supabase
        .from('purchase_items')
        .select('*, products(name, unit_name)')
        .in('purchase_id', purchIds)

      allItems = (items ?? []).map(i => ({
        id:           i.id,
        purchase_id:  i.purchase_id,
        product_id:   i.product_id,
        quantity:     i.quantity,
        unit_price:   i.unit_price,
        line_total:   i.line_total,
        product_name: (i.products as { name: string; unit_name: string } | null)?.name ?? 'Unknown',
        unit_name:    (i.products as { name: string; unit_name: string } | null)?.unit_name ?? 'unit',
      }))
    }

    const itemCountMap = new Map<string, number>()
    for (const item of allItems) {
      itemCountMap.set(item.purchase_id, (itemCountMap.get(item.purchase_id) ?? 0) + 1)
    }
    const purchWithCounts = purchList.map(p => ({ ...p, item_count: itemCountMap.get(p.id) ?? 0 }))

    const productMap = new Map<string, { name: string; unit: string; qty: number; last: string }>()
    for (const item of allItems) {
      const purchase = purchList.find(p => p.id === item.purchase_id)
      const date     = purchase?.purchase_date ?? ''
      const existing = productMap.get(item.product_id)
      if (!existing || date > existing.last) {
        productMap.set(item.product_id, {
          name: item.product_name ?? 'Unknown',
          unit: item.unit_name ?? 'unit',
          qty:  (existing?.qty ?? 0) + item.quantity,
          last: date,
        })
      } else {
        existing.qty += item.quantity
      }
    }

    const supProducts: SupplierProduct[] = Array.from(productMap.entries()).map(([pid, v]) => ({
      product_id:     pid,
      product_name:   v.name,
      unit_name:      v.unit,
      total_qty:      v.qty,
      last_purchased: v.last,
    })).sort((a, b) => b.last_purchased.localeCompare(a.last_purchased))

    setPurchases(purchWithCounts)
    setPurchaseItems(allItems)
    setSupplierProducts(supProducts)
    setDetailLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchKpi()
    fetchSuppliers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else { setPurchases([]); setPurchaseItems([]); setSupplierProducts([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSuppliers(v, outstandingOnly, sortField, sortDir), 300)
  }, [fetchSuppliers, outstandingOnly, sortField, sortDir])

  const handleOutstandingToggle = useCallback(() => {
    setOutstandingOnly(prev => {
      const next = !prev
      fetchSuppliers(search, next, sortField, sortDir)
      return next
    })
  }, [fetchSuppliers, search, sortField, sortDir])

  const handleSort = useCallback((field: SupplierSortField) => {
    const nextDir: SupplierSortDir =
      field === sortField ? (sortDir === 'desc' ? 'asc' : 'desc') : 'desc'
    setSortField(field)
    setSortDir(nextDir)
    fetchSuppliers(search, outstandingOnly, field, nextDir)
  }, [fetchSuppliers, search, outstandingOnly, sortField, sortDir])

  const addSupplier = useCallback(async (values: SupplierFormValues): Promise<boolean> => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name:            values.name.trim(),
        phone:           values.phone.trim(),
        email:           values.email.trim() || null,
        gstin:           values.gstin.trim()  || null,
        address:         values.address.trim()     || null,
        city:            values.city.trim()        || null,
        state:           values.state.trim()       || null,
        postal_code:     values.postal_code.trim() || null,
        opening_balance: Number(values.opening_balance) || 0,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); return false }
    toast.success(`${values.name} added`)
    await Promise.all([fetchSuppliers(), fetchKpi()])
    if (data) setSelectedId(data.id)
    return true
  }, [supabase, fetchSuppliers, fetchKpi])

  const updateSupplier = useCallback(async (id: string, values: SupplierFormValues): Promise<boolean> => {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name:        values.name.trim(),
        phone:       values.phone.trim(),
        email:       values.email.trim()       || null,
        gstin:       values.gstin.trim()       || null,
        address:     values.address.trim()     || null,
        city:        values.city.trim()        || null,
        state:       values.state.trim()       || null,
        postal_code: values.postal_code.trim() || null,
      })
      .eq('id', id)

    if (error) { toast.error(error.message); return false }
    toast.success(`${values.name} updated`)
    await fetchSuppliers()
    return true
  }, [supabase, fetchSuppliers])

  const deleteSupplier = useCallback(async (supplier: SupplierWithStats): Promise<boolean> => {
    const [{ count: purchCount }, { count: payCount }] = await Promise.all([
      supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
      supabase.from('supplier_payments').select('id', { count: 'exact', head: true }).eq('supplier_id', supplier.id),
    ])

    if ((purchCount ?? 0) > 0 || (payCount ?? 0) > 0) {
      toast.error('Supplier has purchase or payment history and cannot be deleted.')
      return false
    }

    const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id)
    if (error) { toast.error(error.message); return false }

    toast.success(`${supplier.name} deleted`)
    if (selectedId === supplier.id) setSelectedId(null)
    await Promise.all([fetchSuppliers(), fetchKpi()])
    return true
  }, [supabase, fetchSuppliers, fetchKpi, selectedId])

  return {
    suppliers, kpi, aging, search, outstandingOnly, sortField, sortDir,
    loading, kpiLoading,
    selectedId, selectedSupplier, purchases, purchaseItems, supplierProducts, detailLoading,
    setSelectedId,
    handleSearchChange, handleOutstandingToggle, handleSort,
    addSupplier, updateSupplier, deleteSupplier,
  }
}
