'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Product, ProductFormValues, ProductSupplier, StockMovement } from '../../_components/types'

export function useProductDetail(id: string) {
  const supabase = createClient()

  const [product,    setProduct]    = useState<Product | null>(null)
  const [suppliers,  setSuppliers]  = useState<ProductSupplier[]>([])
  const [movements,  setMovements]  = useState<StockMovement[]>([])
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)

    const [
      { data: prod, error: prodError },
      { data: items },
      { data: movRows },
    ] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase
        .from('purchase_items')
        .select(`
          unit_price,
          purchases!inner(
            purchase_date,
            supplier_id,
            suppliers!inner(id, name)
          )
        `)
        .eq('product_id', id),
      supabase
        .from('stock_movements')
        .select('id, movement_type, quantity, reference_id, notes, created_at')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (prodError || !prod) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProduct(prod as Product)
    setMovements((movRows ?? []) as StockMovement[])

    // Most recent purchase per supplier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...(items ?? [])].sort((a: any, b: any) =>
      (b.purchases?.purchase_date ?? '').localeCompare(a.purchases?.purchase_date ?? ''),
    )

    const seen = new Set<string>()
    const supplierList: ProductSupplier[] = []
    for (const row of sorted) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (row as any).purchases
      if (!p?.supplier_id) continue
      const sid = p.supplier_id as string
      if (seen.has(sid)) continue
      seen.add(sid)
      supplierList.push({
        supplier_id:        sid,
        supplier_name:      p.suppliers?.name ?? 'Unknown',
        last_unit_price:    Number(row.unit_price),
        last_purchase_date: p.purchase_date,
      })
    }
    setSuppliers(supplierList)
    setLoading(false)
  }, [supabase, id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const updateProduct = useCallback(async (values: ProductFormValues): Promise<boolean> => {
    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim() || null,
      description: values.description.trim() || null,
      category: values.category.trim() || null,
      unit_name: values.unit_name.trim() || 'piece',
      selling_price: Number(values.selling_price) || 0,
      purchase_price: Number(values.purchase_price) || 0,
      gst_rate: Number(values.gst_rate) || 0,
      is_active: values.is_active,
      has_box: values.has_box,
      box_name: values.has_box ? values.box_name.trim() || null : null,
      units_per_box: values.has_box ? (parseInt(values.units_per_box) || null) : null,
      box_purchase_price: values.has_box ? Number(values.box_purchase_price) || null : null,
      box_selling_price: values.has_box ? Number(values.box_selling_price) || null : null,
      track_inventory: values.track_inventory,
      minimum_stock: Number(values.minimum_stock) || 0,
    }

    const { error } = await supabase.from('products').update(payload).eq('id', id)
    if (error) { toast.error(error.message); return false }

    toast.success(`${values.name} updated`)
    await fetchAll()
    return true
  }, [supabase, id, fetchAll])

  return {
    product,
    suppliers,
    movements,
    loading,
    notFound,
    updateProduct,
    refresh: fetchAll,
  }
}
