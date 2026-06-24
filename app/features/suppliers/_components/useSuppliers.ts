/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type SupplierWithStats, type Purchase,
  type PurchaseItem, type SupplierProduct, type SupplierKpi,
  type SupplierFormValues,
} from './types'

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useSuppliers() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [suppliers,    setSuppliers]    = useState<SupplierWithStats[]>([])
  const [kpi,          setKpi]          = useState<SupplierKpi>({ total_count: 0, total_purchased: 0, amount_owed: 0 })
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [kpiLoading,   setKpiLoading]   = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── detail state ─────────────────────────────────────────────────────────────
  const [selectedId,       setSelectedId]       = useState<string | null>(null)
  const [purchases,        setPurchases]        = useState<Purchase[]>([])
  const [purchaseItems,    setPurchaseItems]    = useState<PurchaseItem[]>([])  // all items for selected supplier's purchases
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [detailLoading,    setDetailLoading]    = useState(false)

  // ── derived ───────────────────────────────────────────────────────────────────
  const selectedSupplier = suppliers.find(s => s.id === selectedId) ?? null

  // ── fetch KPIs ───────────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const [{ data: sups }, { data: purch }] = await Promise.all([
      supabase.from('suppliers').select('opening_balance'),
      supabase.from('purchases').select('grand_total'),
    ])
    const totalPurchased = (purch ?? []).reduce((sum, p) => sum + p.grand_total, 0)
    const amountOwed     = (sups  ?? []).reduce((sum, s) => sum + s.opening_balance, 0) + totalPurchased
    setKpi({
      total_count:     (sups ?? []).length,
      total_purchased: totalPurchased,
      amount_owed:     amountOwed,
    })
    setKpiLoading(false)
  }, [supabase])

  // ── fetch supplier list with purchase aggregates ──────────────────────────────
  const fetchSuppliers = useCallback(async (s: string = search) => {
    setLoading(true)

    const { data: sups, error } = await supabase.from('suppliers').select('*').order('name')
    if (error || !sups) { console.error(error); setLoading(false); return }

    // Aggregate purchases per supplier
    const { data: purch } = await supabase.from('purchases').select('supplier_id, grand_total')
    const purchMap = new Map<string, number>()
    for (const p of purch ?? []) {
      purchMap.set(p.supplier_id, (purchMap.get(p.supplier_id) ?? 0) + p.grand_total)
    }

    let enriched: SupplierWithStats[] = sups.map(sup => {
      const totalPurchased = purchMap.get(sup.id) ?? 0
      return {
        ...sup,
        total_purchased: totalPurchased,
        amount_owed:     sup.opening_balance + totalPurchased,
      }
    })

    // Client-side search
    if (s.trim()) {
      const q = s.toLowerCase()
      enriched = enriched.filter(sup =>
        sup.name.toLowerCase().includes(q) ||
        (sup.phone ?? '').includes(q) ||
        (sup.gstin ?? '').toLowerCase().includes(q)
      )
    }

    setSuppliers(enriched)
    setLoading(false)
  }, [supabase, search])

  // ── fetch supplier detail ─────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (supplierId: string) => {
    setDetailLoading(true)

    // Get all purchases for this supplier
    const { data: purch } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('purchase_date', { ascending: false })

    const purchList = (purch ?? []) as Purchase[]

    // Get purchase items for all those purchases
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
        total_price:  i.total_price,
        product_name: (i.products as { name: string; unit_name: string } | null)?.name ?? 'Unknown',
        unit_name:    (i.products as { name: string; unit_name: string } | null)?.unit_name ?? 'unit',
      }))
    }

    // Attach item counts to purchases
    const itemCountMap = new Map<string, number>()
    for (const item of allItems) {
      itemCountMap.set(item.purchase_id, (itemCountMap.get(item.purchase_id) ?? 0) + 1)
    }
    const purchWithCounts = purchList.map(p => ({ ...p, item_count: itemCountMap.get(p.id) ?? 0 }))

    // Build per-product summary
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

  // ── initial load ─────────────────────────────────────────────────────────────
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

  // ── search ───────────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSuppliers(v), 300)
  }, [fetchSuppliers])

  // ── mutations ─────────────────────────────────────────────────────────────────
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
    const { count } = await supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)

    if ((count ?? 0) > 0) {
      toast.error('Supplier has purchase history and cannot be deleted.')
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
    suppliers, kpi, search, loading, kpiLoading,
    selectedId, selectedSupplier, purchases, purchaseItems, supplierProducts, detailLoading,
    setSelectedId,
    handleSearchChange,
    addSupplier, updateSupplier, deleteSupplier,
  }
}
