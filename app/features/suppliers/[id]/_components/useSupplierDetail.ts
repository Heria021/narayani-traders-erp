/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  SupplierWithStats,
  Purchase,
  PurchaseItem,
  SupplierProduct,
  SupplierFormValues,
  SupplierPayment,
  SupplierPaymentFormValues,
} from '../../_components/types'
import { mapBalanceRow, type SupplierBalanceRow } from '../../_components/balances'
import type { PurchaseWithItems } from '../../../purchases/_components/types'

export function useSupplierDetail(id: string) {
  const supabase = createClient()

  const [supplier,         setSupplier]         = useState<SupplierWithStats | null>(null)
  const [purchases,        setPurchases]        = useState<Purchase[]>([])
  const [purchaseItems,    setPurchaseItems]    = useState<PurchaseItem[]>([])
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [payments,         setPayments]         = useState<SupplierPayment[]>([])
  const [loading,          setLoading]          = useState(true)
  const [notFound,         setNotFound]         = useState(false)

  // ── purchase detail state ──
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithItems | null>(null)
  const [purchaseLoading,  setPurchaseLoading]  = useState(false)

  // ── fetch everything ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)

    // 1. Supplier row + balances from view
    const { data: sup, error } = await supabase
      .from('supplier_balances')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !sup) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setSupplier(mapBalanceRow(sup as SupplierBalanceRow))

    // 2. Fetch payments
    const { data: payRows } = await supabase
      .from('supplier_payments')
      .select('*, purchases(purchase_number)')
      .eq('supplier_id', id)
      .order('payment_date', { ascending: false })

    const paymentsList = (payRows ?? []).map(p => ({
      id: p.id,
      supplier_id: p.supplier_id,
      purchase_id: p.purchase_id,
      amount: Number(p.amount),
      payment_method: p.payment_method,
      reference_number: p.reference_number,
      payment_date: p.payment_date,
      note: p.note,
      created_at: p.created_at,
      purchase_number: p.purchases?.purchase_number ?? null
    })) as SupplierPayment[]

    setPayments(paymentsList)

    // 3. Purchases
    const { data: purch } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', id)
      .order('purchase_date', { ascending: false })

    const purchList = (purch ?? []) as Purchase[]

    // 4. Purchase items
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

    setPurchaseItems(allItems)

    // Attach item counts
    const itemCountMap = new Map<string, number>()
    for (const item of allItems) {
      itemCountMap.set(item.purchase_id, (itemCountMap.get(item.purchase_id) ?? 0) + 1)
    }
    const purchWithCounts = purchList.map(p => ({ ...p, item_count: itemCountMap.get(p.id) ?? 0 }))
    setPurchases(purchWithCounts)

    // Per-product summary
    const productMap = new Map<string, { name: string; unit: string; qty: number; last: string }>()
    for (const item of allItems) {
      const purchase = purchList.find(p => p.id === item.purchase_id)
      const date     = purchase?.purchase_date ?? ''
      const existing = productMap.get(item.product_id)
      if (!existing || date > existing.last) {
        productMap.set(item.product_id, {
          name: item.product_name ?? 'Unknown',
          unit: item.unit_name   ?? 'unit',
          qty:  (existing?.qty ?? 0) + item.quantity,
          last: date,
        })
      } else {
        existing.qty += item.quantity
      }
    }

    setSupplierProducts(
      Array.from(productMap.entries())
        .map(([pid, v]) => ({
          product_id:     pid,
          product_name:   v.name,
          unit_name:      v.unit,
          total_qty:      v.qty,
          last_purchased: v.last,
        }))
        .sort((a, b) => b.last_purchased.localeCompare(a.last_purchased))
    )

    setLoading(false)
  }, [supabase, id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── fetch single purchase detail ──
  const fetchPurchaseDetail = useCallback(async (purchaseId: string) => {
    setPurchaseLoading(true)
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

    if (!purchase) {
      setPurchaseLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedItems: any[] = (items ?? []).map((i: any) => ({
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
    setSelectedPurchase({
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
    setPurchaseLoading(false)
  }, [supabase])

  // ── update ───────────────────────────────────────────────────────────────────
  const updateSupplier = useCallback(async (values: SupplierFormValues): Promise<boolean> => {
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
    await fetchAll()
    return true
  }, [supabase, id, fetchAll])

  // ── delete ───────────────────────────────────────────────────────────────────
  const deleteSupplier = useCallback(async (): Promise<boolean> => {
    const [{ count: purchCount }, { count: payCount }] = await Promise.all([
      supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('supplier_id', id),
      supabase.from('supplier_payments').select('id', { count: 'exact', head: true }).eq('supplier_id', id),
    ])

    if ((purchCount ?? 0) > 0 || (payCount ?? 0) > 0) {
      toast.error('Supplier has purchase or payment history and cannot be deleted.')
      return false
    }

    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) { toast.error(error.message); return false }
    toast.success('Supplier deleted')
    return true
  }, [supabase, id])

  // ── record payment ──────────────────────────────────────────────────────────
  const recordPayment = useCallback(async (values: SupplierPaymentFormValues): Promise<boolean> => {
    const amountNum = Number(values.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid payment amount')
      return false
    }

    const { error } = await supabase
      .from('supplier_payments')
      .insert({
        supplier_id: id,
        purchase_id: values.purchase_id || null,
        amount: amountNum,
        payment_method: values.payment_method,
        reference_number: values.reference_number.trim() || null,
        payment_date: values.payment_date,
        note: values.note.trim() || null,
      })

    if (error) {
      toast.error(error.message)
      return false
    }

    toast.success('Supplier payment recorded successfully')
    await fetchAll()
    return true
  }, [supabase, id, fetchAll])

  return {
    supplier, purchases, purchaseItems, supplierProducts, payments,
    loading, notFound,
    selectedPurchase, purchaseLoading,
    fetchPurchaseDetail, setSelectedPurchase,
    updateSupplier, deleteSupplier, recordPayment,
    refresh: fetchAll,
  }
}

