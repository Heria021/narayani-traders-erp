'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  QuickProductFormValues, SaleProduct, Customer,
} from '../_components/types'
import { WALKIN_CUSTOMER_NAME } from '../_components/types'

const PRODUCT_SELECT = 'id, name, sku, unit_name, selling_price, box_selling_price, purchase_price, has_box, box_name, units_per_box, gst_rate, current_stock, track_inventory, is_active'

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, 'en-IN', { sensitivity: 'base' }))
}

export function useNewSale() {
  const supabase = useMemo(() => createClient(), [])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products,  setProducts]  = useState<SaleProduct[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const walkinIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOptions() {
      setOptionsLoading(true)
      const [customerRes, productRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, phone, email, address, city, credit_limit, opening_balance, is_active')
          .eq('is_active', true)
          .neq('name', WALKIN_CUSTOMER_NAME)
          .order('name'),
        supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('is_active', true)
          .order('name'),
      ])

      if (!active) return

      if (customerRes.error || productRes.error) {
        toast.error('Failed to load customer or product options')
      }

      setCustomers(sortByName((customerRes.data ?? []) as Customer[]))
      setProducts(sortByName((productRes.data ?? []) as SaleProduct[]))
      setOptionsLoading(false)
    }

    void loadOptions()
    return () => { active = false }
  }, [supabase])

  const getOrCreateWalkinCustomer = useCallback(async (): Promise<string | null> => {
    if (walkinIdRef.current) return walkinIdRef.current

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('name', WALKIN_CUSTOMER_NAME)
      .single()

    if (existing) {
      walkinIdRef.current = existing.id
      return existing.id
    }

    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        name:            WALKIN_CUSTOMER_NAME,
        is_active:       false,
        credit_limit:    0,
        opening_balance: 0,
      })
      .select('id')
      .single()

    if (error) { console.error('Failed to create walk-in customer:', error); return null }
    walkinIdRef.current = created.id
    return created.id
  }, [supabase])

  const generateBillNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('sales')
      .select('invoice_number')
      .like('invoice_number', `BILL-${year}-%`)

    const existing = new Set((data ?? []).map(s => s.invoice_number.trim()))
    let next = 1
    while (true) {
      const candidate = `BILL-${year}-${String(next).padStart(3, '0')}`
      if (!existing.has(candidate)) return candidate
      next++
    }
  }, [supabase])

  // ── save sale ────────────────────────────────────────────────────────────────
  const saveSale = useCallback(async (params: {
    invoiceNumber:   string
    saleDate:        string
    customerId:      string          // resolved customer id (walk-in id if walk-in)
    walkinName:      string          // typed name for walk-in (stored in notes prefix)
    isWalkin:        boolean
    lineItems: Array<{
      product:     SaleProduct
      sell_mode:   'unit' | 'box'
      qty_input:   number            // number of boxes or units
      unit_price:  number
      tax_rate:    number
      line_total:  number
      base_units:  number
      box_count:   number | null
    }>
    subtotal:        number
    taxAmount:       number
    discountVal:     number
    grandTotal:      number
    amountPaid:      number
    balanceDue:      number
    paymentStatus:   'paid' | 'partial' | 'pending'
    paymentMethod:   string
    referenceNumber: string
    dueDate:         string
    notes:           string
  }): Promise<string | null> => {
    const {
      invoiceNumber, saleDate, customerId, walkinName, isWalkin,
      lineItems, subtotal, taxAmount, discountVal, grandTotal,
      amountPaid, balanceDue, paymentStatus, paymentMethod,
      referenceNumber, dueDate, notes,
    } = params

    // 1. INSERT sales
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        customer_id:    customerId,
        sale_date:      saleDate || new Date().toISOString().slice(0, 10),
        subtotal:       parseFloat(subtotal.toFixed(2)),
        tax_amount:     parseFloat(taxAmount.toFixed(2)),
        discount:       parseFloat(discountVal.toFixed(2)),
        grand_total:    parseFloat(grandTotal.toFixed(2)),
        amount_paid:    parseFloat(amountPaid.toFixed(2)),
        balance_due:    parseFloat(balanceDue.toFixed(2)),
        payment_status: paymentStatus,
        due_date:       dueDate || null,
        notes:          notes.trim() || null,
        walkin_name:    isWalkin ? (walkinName.trim() || null) : null,
      })
      .select()
      .single()

    if (saleErr) {
      if (saleErr.code === '23505') toast.error('Bill number already exists')
      else toast.error(saleErr.message)
      return null
    }

    // 2. INSERT sale_items + stock_movements + UPDATE products.current_stock
    for (const row of lineItems) {
      const { product, sell_mode, qty_input, unit_price, tax_rate, base_units, box_count } = row
      const lineTotal = parseFloat((qty_input * unit_price).toFixed(2))

      await supabase.from('sale_items').insert({
        sale_id:    sale.id,
        product_id: product.id,
        sell_mode,
        box_count,
        quantity:   parseFloat(base_units.toFixed(3)),
        unit_price,
        tax_rate,
        line_total: lineTotal,
      })

      await supabase.from('stock_movements').insert({
        product_id:    product.id,
        movement_type: 'sale',
        quantity:      -parseFloat(base_units.toFixed(3)),   // negative = outgoing
        reference_id:  sale.id,
        notes:         `Sale ${invoiceNumber}`,
      })

      if (product.track_inventory) {
        await supabase.rpc('increment_stock', {
          p_product_id: product.id,
          p_delta:      -parseFloat(base_units.toFixed(3)),
        })
      }
    }

    // 3. INSERT payments (if amount_paid > 0)
    if (amountPaid > 0) {
      await supabase.from('payments').insert({
        customer_id:      customerId,
        sale_id:          sale.id,
        amount:           parseFloat(amountPaid.toFixed(2)),
        payment_method:   paymentMethod,
        reference_number: referenceNumber.trim() || null,
        payment_date:     saleDate || new Date().toISOString().slice(0, 10),
      })
    }

    toast.success(`${invoiceNumber} saved successfully`)
    return sale.id
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
      .select(PRODUCT_SELECT)
      .single()

    if (error) { toast.error(error.message); return null }

    const product = data as SaleProduct
    setProducts(prev => sortByName([...prev.filter(p => p.id !== product.id), product]))
    toast.success(`"${values.name}" added as a new product`)
    return product
  }, [supabase])

  const refreshCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, city, credit_limit, opening_balance, is_active')
      .eq('is_active', true)
      .neq('name', WALKIN_CUSTOMER_NAME)
      .order('name')
    if (error) {
      toast.error('Failed to reload customers')
    } else {
      setCustomers(sortByName((data ?? []) as Customer[]))
    }
  }, [supabase])

  return {
    customers, products, optionsLoading,
    generateBillNumber, saveSale, quickAddProduct, getOrCreateWalkinCustomer,
    refreshCustomers,
  }
}
