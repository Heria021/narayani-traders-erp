'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { applyStockMovement, type StockRollbackLine } from '@/lib/services/stockMovement'
import { insertQuickProduct } from '@/lib/services/productQuickAdd'
import { rollbackFailedDocument } from '@/lib/services/documentRollback'
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

async function rollbackFailedPurchase(
  supabase: ReturnType<typeof createClient>,
  purchaseId: string,
  purchaseNumber: string,
  stockLines: StockRollbackLine[],
): Promise<boolean> {
  const ok = await rollbackFailedDocument(supabase, {
    table: 'purchases',
    documentId: purchaseId,
    documentLabel: purchaseNumber,
    movementType: 'purchase',
    stockLines,
  })
  if (!ok) {
    toast.error(
      `Save failed and could not fully roll back ${purchaseNumber}. Check inventory before retrying.`,
    )
  }
  return ok
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
      (data ?? []).map(p => p.purchase_number.trim()),
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

    const stockLines: StockRollbackLine[] = []

    for (const row of validItems) {
      const product = row.product!
      const isBox = row.buy_mode === 'box'
      const boxCount = isBox ? num(row.qty_input) : null
      const baseUnits = isBox
        ? num(row.qty_input) * (product.units_per_box ?? 1)
        : num(row.qty_input)
      const unitPrice = num(row.unit_price)
      const lineTotal = parseFloat((num(row.qty_input) * unitPrice).toFixed(2))
      const baseUnitsRounded = parseFloat(baseUnits.toFixed(3))

      const { error: itemErr } = await supabase.from('purchase_items').insert({
        purchase_id: purchase.id,
        product_id:  product.id,
        buy_mode:    row.buy_mode,
        box_count:   boxCount,
        quantity:    baseUnitsRounded,
        unit_price:  unitPrice,
        tax_rate:    num(row.tax_rate),
        line_total:  lineTotal,
      })

      if (itemErr) {
        await rollbackFailedPurchase(supabase, purchase.id, header.purchase_number, stockLines)
        toast.error(`Failed to save line item for ${product.name}: ${itemErr.message}`)
        return false
      }

      const mov = await applyStockMovement(supabase, {
        productId: product.id,
        delta: baseUnitsRounded,
        movementType: 'purchase',
        referenceId: purchase.id,
        notes: `Purchase ${header.purchase_number}`,
      })

      if (!mov.ok) {
        await rollbackFailedPurchase(supabase, purchase.id, header.purchase_number, stockLines)
        toast.error(`Stock update failed for ${product.name}: ${mov.message}`)
        return false
      }

      if (product.track_inventory) {
        stockLines.push({
          productId: product.id,
          baseUnits: baseUnitsRounded,
          trackInventory: true,
        })
      }
    }

    toast.success(`${header.purchase_number} saved — stock updated`)
    return true
  }, [supabase])

  const quickAddProduct = useCallback(async (
    values: QuickProductFormValues,
  ): Promise<Product | null> => {
    const result = await insertQuickProduct<Product>(supabase, values, PRODUCT_SELECT)
    if (!result.ok) {
      toast.error(result.message)
      return null
    }

    const product = result.data
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
