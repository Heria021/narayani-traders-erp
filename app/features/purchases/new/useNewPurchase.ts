'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  PurchaseHeaderValues, LineItemDraft, DiscountMode,
  QuickProductFormValues, Product, Supplier,
} from '../_components/types'

const num = (v: string | number) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)
const PRODUCT_SELECT = 'id, name, sku, unit_name, purchase_price, has_box, box_name, units_per_box, box_purchase_price, gst_rate, current_stock, track_inventory, is_active'

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, 'en-IN', { sensitivity: 'base' }))
}

export function useNewPurchase() {
  const supabase = useMemo(() => createClient(), [])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadLookupOptions() {
      setOptionsLoading(true)

      const [supplierRes, productRes] = await Promise.all([
        supabase
          .from('suppliers')
          .select('id, name, phone, email')
          .order('name'),
        supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('is_active', true)
          .order('name'),
      ])

      if (!active) return

      if (supplierRes.error || productRes.error) {
        console.error('Failed to load purchase lookup options:', {
          suppliers: supplierRes.error,
          products: productRes.error,
        })
        toast.error('Failed to load supplier or product options')
      }

      setSuppliers(sortByName(supplierRes.data ?? []))
      setProducts(sortByName((productRes.data ?? []) as Product[]))
      setOptionsLoading(false)
    }

    void loadLookupOptions()

    return () => { active = false }
  }, [supabase])

  const generatePurchaseNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('purchases')
      .select('purchase_number')
      .like('purchase_number', `PO-${year}-%`)
    
    if (error) {
      console.error('Error generating purchase number:', error)
      toast.error('Failed to check existing purchase numbers: ' + error.message)
    }

    const existingNumbers = new Set(
      (data ?? []).map(p => p.purchase_number.trim())
    )

    let next = 1
    while (true) {
      const candidate = `PO-${year}-${String(next).padStart(3, '0')}`
      if (!existingNumbers.has(candidate)) {
        return candidate
      }
      next++
    }
  }, [supabase])

  // ── save purchase ───────────────────────────────────────────────────────────
  const savePurchase = useCallback(async (
    header: PurchaseHeaderValues,
    lineItems: LineItemDraft[],
    discount: string,
    discountMode: DiscountMode,
  ): Promise<boolean> => {
    const validItems = lineItems.filter(r => r.product && num(r.qty_input) > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one product with a valid quantity')
      return false
    }

    const subtotal = validItems.reduce((s, r) => {
      const qty = num(r.qty_input)
      const price = num(r.unit_price)
      return s + parseFloat((qty * price).toFixed(2))
    }, 0)
    const taxAmount = validItems.reduce((s, r) => {
      const lt = parseFloat((num(r.qty_input) * num(r.unit_price)).toFixed(2))
      return s + lt * num(r.tax_rate) / 100
    }, 0)
    const discountVal = discountMode === 'flat'
      ? num(discount)
      : subtotal * num(discount) / 100
    const grandTotal = subtotal + taxAmount - discountVal

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

    for (const row of validItems) {
      const product = row.product!
      const isBox   = row.buy_mode === 'box'
      const boxCount   = isBox ? num(row.qty_input) : null
      const baseUnits  = isBox
        ? num(row.qty_input) * (product.units_per_box ?? 1)
        : num(row.qty_input)
      const unitPrice  = num(row.unit_price)
      const lineTotal  = parseFloat((num(row.qty_input) * unitPrice).toFixed(2))

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

      await supabase.from('stock_movements').insert({
        product_id:    product.id,
        movement_type: 'purchase',
        quantity:      parseFloat(baseUnits.toFixed(3)),
        reference_id:  purchase.id,
        notes:         `Purchase ${header.purchase_number}`,
      })

      if (product.track_inventory) {
        await supabase.rpc('increment_stock', {
          p_product_id: product.id,
          p_delta:      parseFloat(baseUnits.toFixed(3)),
        }).then(async ({ error: rpcErr }) => {
          if (rpcErr) {
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
    return true
  }, [supabase])

  // ── quick add product ───────────────────────────────────────────────────────
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
      .select(PRODUCT_SELECT)
      .single()
    if (error) { toast.error(error.message); return null }

    const product = data as Product
    setProducts(prev => sortByName([
      ...prev.filter(p => p.id !== product.id),
      product,
    ]))
    toast.success(`"${values.name}" added as a new product`)
    return product
  }, [supabase])

  return {
    generatePurchaseNumber,
    savePurchase,
    suppliers,
    products,
    optionsLoading,
    quickAddProduct,
  }
}
